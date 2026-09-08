/**
 * demo-controls.js — wires the four demo chips on the Login page.
 *
 * Each chip:
 *   1. Prompts the user via a confirm modal (Cancel / Run)
 *   2. Sets the button to a 'busy' visual state while working
 *   3. Performs the IDB operation directly (so it works without the full mock scaffold)
 *   4. Shows a toast with the outcome (success/warning/danger)
 *   5. Updates the button to a 'done' visual state for ~1.5s, then resets
 *
 * Operations:
 *   reset  — wipe IDB (chain_blocks + session + meta) + clear localStorage + reseed
 *   reseed — wipe chain_blocks only, reseed genesis + 10 blocks
 *   tamper — corrupt block #5's hash to 0xffff…(deterministic for demo)
 *   fail   — append a ChainVerificationFailed event without corrupting storage
 *
 * All operations are idempotent and use the public IDB layer.
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  // IDB helper (matches mocks/idb.ts API surface)
  // ─────────────────────────────────────────────────────────────────

  var DB_NAME = 'surakkha-mock';

  function openStore(name) {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    }).then(function (db) {
      return { db: db, name: name };
    });
  }

  function getAll(name) {
    return openStore(name).then(function (s) {
      return new Promise(function (resolve, reject) {
        var tx = s.db.transaction(s.name, 'readonly');
        var store = tx.objectStore(s.name);
        var req = store.getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  function put(name, key, value) {
    return openStore(name).then(function (s) {
      return new Promise(function (resolve, reject) {
        var tx = s.db.transaction(s.name, 'readwrite');
        var store = tx.objectStore(s.name);
        var req = store.put(value, key);
        req.onsuccess = function () { resolve(value); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  function clear(name) {
    return openStore(name).then(function (s) {
      return new Promise(function (resolve, reject) {
        var tx = s.db.transaction(s.name, 'readwrite');
        var req = tx.objectStore(s.name).clear();
        req.onsuccess = function () { resolve(); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  function getOne(name, key) {
    return openStore(name).then(function (s) {
      return new Promise(function (resolve, reject) {
        var tx = s.db.transaction(s.name, 'readonly');
        var req = tx.objectStore(s.name).get(key);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror   = function () { reject(req.error); };
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Hashing (sha256 of canonical_json) — mirrors surakkha-app/src/mocks/canonical.ts
  // ─────────────────────────────────────────────────────────────────

  function canonicalJson(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
    var keys = Object.keys(value).sort();
    return '{' + keys.map(function (k) {
      return JSON.stringify(k) + ':' + canonicalJson(value[k]);
    }).join(',') + '}';
  }

  function sha256Hex(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
      .then(function (buf) {
        return Array.from(new Uint8Array(buf))
          .map(function (b) { return b.toString(16).padStart(2, '0'); })
          .join('');
      });
  }

  function ulid() {
    // Deterministic-enough for demo: timestamp in ms + 16 random chars
    var t = Date.now().toString(36).toUpperCase();
    var r = '';
    var alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    for (var i = 0; i < 16; i++) r += alphabet[bytes[i] % 32];
    return t.padStart(10, '0') + r;
  }

  function blockHash(input) {
    return sha256Hex(canonicalJson({
      prev_block_hash: input.prev_block_hash,
      tenant_id:       input.tenant_id,
      schema_version:  input.schema_version,
      event_type:      input.event_type,
      event_id:        input.event_id,
      occurred_at:     input.occurred_at,
      ingested_at:     input.ingested_at,
      actor_identity:  input.actor_identity,
      payload:         input.payload,
    }));
  }

  // ─────────────────────────────────────────────────────────────────
  // Actors + sentinel event types
  // ─────────────────────────────────────────────────────────────────

  var ACTOR_SENSOR = { kind: 'system',  ref: '01J0SENSOR00000000000000000', display: 'sensor-fleet' };
  var ACTOR_PRIYA  = { kind: 'operator', ref: '01J0PRIYA000000000000000000', display: 'Priya (utility operator)' };
  var ACTOR_PHA    = { kind: 'pha',      ref: '01J0PHA000000000000000000000', display: 'Dr. Karim (PHA approver)' };
  var ACTOR_ANJALI = { kind: 'citizen',  ref: '01J0ANJALI00000000000000000', display: 'anjali@example.com' };

  var GENESIS_PREV = '0x' + '0'.repeat(64);
  var TENANT = 'dhaka';
  var SCHEMA = 1;

  // ─────────────────────────────────────────────────────────────────
  // Build a block (mirrors mocks/fixtures.ts)
  // ─────────────────────────────────────────────────────────────────

  function buildBlock(prev, event_type, payload, actor) {
    var occurred_at = new Date().toISOString();
    var ingested_at = occurred_at;
    var event_id = ulid();
    return sha256Hex(canonicalJson({
      prev_block_hash: prev || GENESIS_PREV,
      tenant_id: TENANT,
      schema_version: SCHEMA,
      event_type: event_type,
      event_id: event_id,
      occurred_at: occurred_at,
      ingested_at: ingested_at,
      actor_identity: actor,
      payload: payload,
    })).then(function (h) {
      return {
        block_hash: h,
        height: 0,  // set by append
        prev_block_hash: prev || GENESIS_PREV,
        tenant_id: TENANT,
        schema_version: SCHEMA,
        event_type: event_type,
        event_id: event_id,
        occurred_at: occurred_at,
        ingested_at: ingested_at,
        actor_identity: actor,
        payload: payload,
      };
    });
  }

  function appendBlock(block) {
    return getOne('chain_head', 'head').then(function (head) {
      block.height = (head && head.height ? head.height : 0) + 1;
      return put('chain_blocks', block.block_hash, block).then(function () {
        return put('chain_head', 'head', {
          block_hash: block.block_hash,
          height: block.height,
          ingested_at: block.ingested_at,
        });
      });
    }).then(function () { return block; });
  }

  // ─────────────────────────────────────────────────────────────────
  // Seed chain (matches mocks/fixtures.ts — 11 blocks total)
  // ─────────────────────────────────────────────────────────────────

  function seedChain() {
    return getAll('chain_blocks').then(function (existing) {
      if (existing.length >= 11) return existing;
      // wipe + reseed
      return clear('chain_blocks').then(function () { return clear('chain_head'); })
        .then(function () { return buildSeed(); });
    });
  }

  function buildSeed() {
    var chain = [];
    var prev = null;

    function next(event_type, payload, actor) {
      return buildBlock(prev, event_type, payload, actor).then(function (b) {
        chain.push(b);
        prev = b.block_hash;
        return b;
      });
    }

    return next('SchemaVersionBumped',
      { from: 0, to: SCHEMA, reason: 'genesis' },
      ACTOR_SENSOR)
      .then(function () {
        var sensorId = '01J0SENSOR0WARD0000000000000A';
        var p = Promise.resolve();
        for (var i = 0; i < 5; i++) {
          (function (idx) {
            p = p.then(function () {
              return next('SensorReadingSubmitted', {
                sensor_id: sensorId,
                ward_id: 'ward-dhanmondi',
                parameter: 'pH',
                value: 7.2 + idx * 0.1,
                unit: 'pH',
                captured_at: new Date(Date.now() - (5 - idx) * 90 * 60 * 1000).toISOString(),
                ingestion_window_id: 'iw-' + Math.floor(Date.now() / 900000),
              }, ACTOR_SENSOR);
            });
          })(i);
        }
        return p;
      })
      .then(function () {
        return next('SensorSilenceObserved', {
          sensor_id: '01J0SENSOR0WARD0000000000000A',
          expected_period_seconds: 300,
          last_reading_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        }, ACTOR_SENSOR);
      })
      .then(function () {
        return next('AnjaliReportSubmitted', {
          report_id: ulid(),
          submitted_via: 'sms',
          from_e164: '+8801700000001',
          ward_id: 'ward-dhanmondi',
          category: 'taste_change',
          description: 'Water tastes metallic this morning.',
          captured_at: new Date().toISOString(),
        }, ACTOR_ANJALI);
      })
      .then(function (last) {
        return next('IncidentCreated', {
          incident_id: ulid(),
          correlation_id: last.event_id,
          ward_id: 'ward-dhanmondi',
          severity: 'medium',
          source: 'AnjaliReport',
          sensor_snapshot: [{ sensor_id: '01J0SENSOR0WARD0000000000000A', parameter: 'pH', value: 7.6, band: 'medium' }],
        }, ACTOR_PRIYA);
      })
      .then(function () {
        return next('IncidentEscalated', {
          incident_id: 'from-prior',
          from_severity: 'medium',
          to_severity: 'high',
          reason: 'Cluster shows 3+ sensors drifting upward simultaneously.',
        }, ACTOR_PRIYA);
      })
      .then(function () {
        return next('PlaybookStepExecuted', {
          playbook_version_id: '01J0PLAYBOOKVERSION00000000A',
          step_id: 'flush-hydrant-line',
          incident_id: 'from-prior',
          notes: 'Flushed hydrant line 12 for 8 minutes; pH trending down.',
        }, ACTOR_PRIYA);
      })
      .then(function () {
        return next('PublicNoticeIssued', {
          notice_id: ulid(),
          incident_id: 'from-prior',
          locale: 'bn',
          character_count: 138,
          channel_targets: ['sms', 'whatsapp', 'local-radio'],
          attestation_event_ids: [],
          body_summary: 'Ward dhanmondi — flush taps before use until noon.',
        }, ACTOR_PRIYA);
      })
      .then(function () {
        return next('SignatureAttestation', {
          attestation_id: ulid(),
          attesting_event_id: 'from-prior',
          attesting_event_type: 'PublicNoticeIssued',
          payload_hash: 'mock-hash-not-checked-in-phase-1',
          version_id: 'v1',
          signature: 'mock-sig-placeholder',
        }, ACTOR_PHA);
      })
      .then(function () {
        return next('OperatorAuthenticated', {
          session_id: ulid(),
          auth_method: 'password',
          client_kind: 'web',
        }, ACTOR_PRIYA);
      })
      .then(function () {
        return Promise.all(chain.map(appendBlock));
      })
      .then(function () { return chain; });
  }

  // ─────────────────────────────────────────────────────────────────
  // Tamper — corrupt block #5's hash, advance head to it
  // ─────────────────────────────────────────────────────────────────

  function tamperBlock(index) {
    return getAll('chain_blocks').then(function (all) {
      var sorted = all.sort(function (a, b) { return a.height - b.height; });
      var target = sorted[index];
      if (!target) return null;

      var corrupted = Object.assign({}, target, {
        block_hash: '0x' + 'f'.repeat(64),
      });

      // Delete the original block_hash entry, write the corrupted one under the SAME key
      // so on next read the chain shows the corruption in place.
      var key = target.block_hash;
      // We can't easily delete without adding deleteStore, so put a corrupted version under
      // both the original key AND a new key, and advance head to the new key.
      var newKey = corrupted.block_hash;
      return openStore('chain_blocks').then(function (s) {
        return new Promise(function (resolve, reject) {
          var tx = s.db.transaction('chain_blocks', 'readwrite');
          var store = tx.objectStore('chain_blocks');
          // Delete the original slot
          var delReq = store.delete(key);
          delReq.onsuccess = function () {
            // Put corrupted block under its own new key
            var addReq = store.put(corrupted, newKey);
            addReq.onsuccess = function () {
              // Advance chain head to the corruption
              var headTx = s.db.transaction('chain_head', 'readwrite');
              headTx.objectStore('chain_head').put({
                block_hash: newKey,
                height: target.height,
                ingested_at: corrupted.ingested_at,
              }, 'head');
              headTx.oncomplete = function () { resolve(corrupted); };
              headTx.onerror = function () { reject(headTx.error); };
            };
            addReq.onerror = function () { reject(addReq.error); };
          };
          delReq.onerror = function () { reject(delReq.error); };
        });
      });
    });
  }

  function simulateFail() {
    return getOne('chain_head', 'head').then(function (head) {
      return buildBlock(
        head ? head.block_hash : GENESIS_PREV,
        'ChainVerificationFailed',
        { failing_block_height: head ? head.height : 0, reason: 'tamper-detected' },
        { kind: 'system', ref: 'monitor', display: 'chain monitor' }
      ).then(appendBlock);
    });
  }

  function countBlocks() {
    return getAll('chain_blocks').then(function (a) { return a.length; });
  }

  function resetEverything() {
    return Promise.all([
      clear('chain_blocks'),
      clear('chain_head'),
      clear('session'),
      clear('meta'),
    ]).then(function () {
      try { localStorage.removeItem('surakkha.persona'); } catch (e) {}
      return buildSeed();
    });
  }

  function reseedChain() {
    // Save session before wiping so login state persists
    return getOne('session', 'current').then(function (savedSession) {
      return Promise.all([clear('chain_blocks'), clear('chain_head')])
        .then(function () { return buildSeed(); })
        .then(function () {
          if (savedSession) return put('session', 'current', savedSession);
        });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Confirm modal
  // ─────────────────────────────────────────────────────────────────

  function confirmAction(opts) {
    return new Promise(function (resolve) {
      var modal = document.getElementById('confirm-modal');
      modal.querySelector('.confirm-modal__title').textContent = opts.title;
      modal.querySelector('.confirm-modal__body').textContent  = opts.body;
      modal.removeAttribute('hidden');

      function close(result) {
        modal.setAttribute('hidden', '');
        modal.querySelector('[data-confirm="cancel"]').removeEventListener('click', onCancel);
        modal.querySelector('[data-confirm="ok"]').removeEventListener('click', onOk);
        document.removeEventListener('keydown', onKey);
        resolve(result);
      }
      function onCancel() { close(false); }
      function onOk()     { close(true); }
      function onKey(e)   {
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
        if (e.key === 'Enter')  { e.preventDefault(); close(true); }
      }

      modal.querySelector('[data-confirm="cancel"]').addEventListener('click', onCancel);
      modal.querySelector('[data-confirm="ok"]').addEventListener('click', onOk);
      document.addEventListener('keydown', onKey);

      // Focus the Run button (dim-4 modal focus rule)
      setTimeout(function () {
        modal.querySelector('[data-confirm="ok"]').focus();
      }, 0);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Toast — bottom-center, 4s auto-dismiss, also closeable
  // ─────────────────────────────────────────────────────────────────

  function toast(opts) {
    var host = document.getElementById('toast-host');
    if (!host) return;

    var node = document.createElement('div');
    node.className = 'toast toast--' + (opts.kind || 'info');
    node.innerHTML =
      '<div class="toast__icon" aria-hidden="true">' + (opts.icon || 'i') + '</div>' +
      '<div class="toast__body">' +
        '<div class="toast__title">' + opts.title + '</div>' +
        '<div class="toast__meta">' + (opts.meta || '') + '</div>' +
      '</div>' +
      '<button class="toast__close" type="button" aria-label="Dismiss">×</button>';
    host.appendChild(node);

    var timer = setTimeout(function () { dismiss(); }, opts.duration || 4000);
    node.querySelector('.toast__close').addEventListener('click', dismiss);

    function dismiss() {
      clearTimeout(timer);
      node.style.opacity = '0';
      node.style.transition = 'opacity 200ms ease-out';
      setTimeout(function () { node.remove(); }, 220);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Wire demo chips
  // ─────────────────────────────────────────────────────────────────

  var ACTIONS = {
    reset: {
      title: 'Reset everything',
      body:  'Wipes the chain, session, and meta. Reseeds 11 blocks. Page reloads after.',
      icon:  'R',
      kind:  'warning',
      run:   function (chip) {
        return resetEverything().then(function (chain) {
          // Reflect new state on brand panel
          updateChainMeta();
          // Brief delay then reload so the user sees the success toast
          return new Promise(function (resolve) {
            setTimeout(function () { window.location.reload(); resolve(chain); }, 1200);
          });
        });
      },
    },
    reseed: {
      title: 'Reseed chain',
      body:  'Wipes chain_blocks and chain_head. Re-seeds 11 blocks. Keeps current session.',
      icon:  'S',
      kind:  'info',
      run:   function () {
        return reseedChain().then(updateChainMeta);
      },
    },
    tamper: {
      title: 'Tamper block #5',
      body:  'Corrupts block #5 hash to 0xffff…ffff. Next /chain/head fetch will return mismatch. Dim-4 chain-fail shake will trigger on next page.',
      icon:  '!',
      kind:  'danger',
      run:   function () {
        return tamperBlock(5).then(updateChainMeta);
      },
    },
    fail: {
      title: 'Simulate chain failure',
      body:  'Appends a ChainVerificationFailed event to the chain without modifying storage. Useful for showing the failure UI cleanly.',
      icon:  'F',
      kind:  'warning',
      run:   function () {
        return simulateFail().then(updateChainMeta);
      },
    },
  };

  function updateChainMeta() {
    return countBlocks().then(function (n) {
      var el = document.querySelector('.brand-panel__live span:last-child');
      if (el) el.textContent = 'chain live · ' + n + ' blocks';
    });
  }

  document.querySelectorAll('.demo-chip[data-action]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var action = chip.dataset.action;
      var def = ACTIONS[action];
      if (!def) return;

      confirmAction({
        title: def.title,
        body:  def.body,
      }).then(function (ok) {
        if (!ok) return;

        chip.dataset.state = 'busy';
        chip.disabled = true;

        toast({
          kind:  'info',
          icon:  '…',
          title: def.title + ' — running',
          meta:  'check IDB store surakkha-mock',
        });

        def.run(chip).then(function () {
          chip.dataset.state = 'done';
          chip.disabled = false;
          toast({
            kind: def.kind,
            icon: def.icon,
            title: def.title + ' — done',
            meta: 'chain updated · check top status chip',
          });
          // Reset the chip visual after a moment
          setTimeout(function () { delete chip.dataset.state; }, 1800);
        }).catch(function (err) {
          chip.disabled = false;
          delete chip.dataset.state;
          toast({
            kind:  'danger',
            icon:  '×',
            title: def.title + ' — failed',
            meta:  String(err && err.message ? err.message : err),
          });
        });
      });
    });
  });

  // Initial state refresh on load
  updateChainMeta();

  // ─────────────────────────────────────────────────────────────────
  // Sim widget (floating demo control panel)
  // ─────────────────────────────────────────────────────────────────

  (function () {
    var fab = document.getElementById('simFab');
    var panel = document.getElementById('simPanel');
    if (!fab || !panel) return;

    function setOpen(open) {
      if (open) { panel.removeAttribute('hidden'); fab.setAttribute('hidden', ''); }
      else      { panel.setAttribute('hidden', ''); fab.removeAttribute('hidden'); }
    }

    document.querySelectorAll('[data-action="sim-toggle"]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); setOpen(panel.hasAttribute('hidden')); });
    });

    // Map sim triggers to existing demo-chip actions where possible
    var SIM_MAP = {
      'tampering':    { chipAction: 'tamper', label: 'Tamper fired — block #5 corrupted' },
      'reset-chain':  { chipAction: 'reset',  label: 'Reset fired — chain reseeded' },
    };

    panel.querySelectorAll('.sim-trigger').forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        var on = t.classList.toggle('is-on');
        var sim = t.dataset.sim;

        if (!on) {
          toast({ kind: 'info', icon: '·', title: sim + ' cleared', meta: 'state returned to normal' });
          return;
        }

        // Map to existing demo chip where applicable
        var mapping = SIM_MAP[sim];
        if (mapping) {
          var chip = document.querySelector('.demo-chip[data-action="' + mapping.chipAction + '"]');
          if (chip) {
            chip.click();  // re-uses confirm modal + toast
            return;
          }
        }

        // Visual-only sim triggers for Phase 1 (would drive MSW in production)
        var label = t.querySelector('span:last-child').textContent;
        toast({
          kind: 'warning',
          icon: '◐',
          title: label + ' — simulated',
          meta: 'visual state only · MSW wiring deferred',
        });
      });
    });
  })();
})();
