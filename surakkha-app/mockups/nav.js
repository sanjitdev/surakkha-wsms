/**
 * nav.js — Surakkha mockup navigation (folder-aware)
 *
 * Surakkha mockups live in per-persona subfolders:
 *   mockups/00-login/login.html
 *   mockups/01-priya/*.html
 *   mockups/02-anjali/submit.html
 *   mockups/03-pha-approver/approve.html
 *   mockups/04-pha-viewer/audit-log.html  (also serves viewer)
 *   mockups/05-vendor/vendor.html
 *
 * Wires:
 *   - Persona picker on login.html → writes selected persona to localStorage
 *   - Continue button → navigates to that persona's landing route
 *   - Top-chrome nav: rebuilt from persona's allowed chrome links
 *   - Active-state highlighting per current page
 *   - Logout button (data-action="logout") → clears persona, returns to login
 */

(function () {
  'use strict';

  // ───────────────────────────────────────────────────────── personas
  // Each route is relative to the PAGE THAT WIRES IT. Pages in
  // subfolders use '../<folder>/<file>'; the login page uses bare
  // '<file>' for its own subfolder.

  var PERSONAS = {
    priya: {
      id: 'priya',
      display: 'Priya',
      role: 'utility_operator',
      landing: '../01-priya/dashboard.html',
      chrome: ['Dashboard', 'Handover', 'Inbox', 'Verify', 'Notices', 'Sensors', 'Audit', 'Settings'],
      chromeLinks: {
        Dashboard: '../01-priya/dashboard.html',
        Handover:  '../01-priya/handover.html',
        Inbox:     '../01-priya/inbox-list.html',
        Verify:    '../01-priya/verify-flow.html',
        Notices:   '../01-priya/notices.html',
        Sensors:   '../01-priya/sensors.html',
        Audit:     '../01-priya/audit-log.html',
        Settings:  '../01-priya/settings.html',
      },
    },
    anjali: {
      id: 'anjali',
      display: 'Anjali',
      role: 'anjali',
      landing: '../02-anjali/submit.html',
      chrome: ['Submit', 'Your reports'],
      chromeLinks: {
        'Submit':       '../02-anjali/submit.html',
        'Your reports': '../02-anjali/submit.html',
      },
    },
    pha_approver: {
      id: 'pha_approver',
      display: 'Dr. Karim',
      role: 'pha_approver',
      landing: '../03-pha-approver/approve.html',
      chrome: ['Approve', 'Inbox', 'Audit', 'Settings'],
      chromeLinks: {
        Approve:  '../03-pha-approver/approve.html',
        Inbox:    '../01-priya/inbox-list.html',
        Audit:    '../01-priya/audit-log.html',
        Settings: '../01-priya/settings.html',
      },
    },
    pha_viewer: {
      id: 'pha_viewer',
      display: 'PHA Viewer',
      role: 'pha_viewer',
      landing: '../04-pha-viewer/audit-log.html',
      chrome: ['Audit', 'Inbox', 'Settings'],
      chromeLinks: {
        Audit:    '../01-priya/audit-log.html',
        Inbox:    '../01-priya/inbox-list.html',
        Settings: '../01-priya/settings.html',
      },
    },
    vendor: {
      id: 'vendor',
      display: 'Acme Sensors',
      role: 'vendor',
      landing: '../05-vendor/vendor.html',
      chrome: ['Fleet', 'Submit batch', 'Settings'],
      chromeLinks: {
        'Fleet':        '../05-vendor/vendor.html',
        'Submit batch': '../05-vendor/vendor.html',
        Settings:       '../01-priya/settings.html',
      },
    },
  };

  // Detect which folder we're in by looking at the URL path
  function currentFolder() {
    var path = window.location.pathname;
    // On windows this gives "C:/ZDrive.../00-login/" or similar; regex the trailing segment
    var m = path.match(/\/(\d{2}-[^/]+)\//);
    if (m) return m[1];
    return null;  // root or unknown
  }

  // ───────────────────────────────────────────────────────── persona picker

  function wirePersonaPicker() {
    var radios = document.querySelectorAll('.persona');
    var continueBtn = document.querySelector('.button--primary');
    if (!radios.length || !continueBtn) return;

    // Order matches the HTML ordering: priya, anjali, pha_approver, pha_viewer, vendor
    var ids = ['priya', 'anjali', 'pha_approver', 'pha_viewer', 'vendor'];
    radios.forEach(function (r, i) {
      r.dataset.persona = ids[i];
    });

    var selectedId = 'priya';
    continueBtn.disabled = false;

    function updateSelection() {
      radios.forEach(function (r) {
        var isSel = r.dataset.persona === selectedId;
        r.classList.toggle('persona--selected', isSel);
        r.setAttribute('aria-checked', String(isSel));
      });
    }

    updateSelection();

    radios.forEach(function (r) {
      r.addEventListener('click', function () {
        selectedId = r.dataset.persona;
        updateSelection();
      });
      r.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        var all = Array.prototype.slice.call(radios);
        var i = all.map(function (x) { return x.dataset.persona; }).indexOf(selectedId);
        var next = e.key === 'ArrowDown'
          ? (i + 1) % all.length
          : (i - 1 + all.length) % all.length;
        selectedId = all[next].dataset.persona;
        updateSelection();
        all[next].focus();
      });
    });

    continueBtn.addEventListener('click', function () {
      var persona = PERSONAS[selectedId];
      if (!persona) return;
      try { localStorage.setItem('surakkha.persona', selectedId); } catch (e) {}
      window.location.href = persona.landing;
    });
  }

  // ───────────────────────────────────────────────────────── top chrome

  function wireTopChrome() {
    // Legacy top-chrome nav (kept for any pages that don't have a sidebar)
    var chrome = document.querySelector('.top-chrome__nav');
    var folder = currentFolder();
    var personaId = readPersonaId();
    var persona = PERSONAS[personaId];

    if (chrome && persona && folder !== '00-login') {
      chrome.innerHTML = '';
      var currentPath = window.location.pathname.split('/').pop() || '';
      persona.chrome.forEach(function (label) {
        var href = persona.chromeLinks[label];
        var a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        var hrefFile = href.split('/').pop();
        if (currentPath === hrefFile) a.classList.add('active');
        chrome.appendChild(a);
      });
    }

    // Show persona label in either the top-chrome right or sidebar top
    if (!persona) return;
    var right = document.querySelector('.top-chrome__right');
    if (right) {
      var existing = right.querySelector('.top-chrome__persona');
      if (!existing) {
        existing = document.createElement('span');
        existing.className = 'top-chrome__persona';
        existing.style.marginLeft = 'var(--space-md)';
        existing.style.paddingLeft = 'var(--space-md)';
        existing.style.borderLeft = '1px solid var(--border-subtle)';
        right.appendChild(existing);
      }
      existing.textContent = persona.display + ' · ' + persona.role;
    }
  }

  // ───────────────────────────────────────────────────────── sidebar nav
  // Hides sidebar links that the current persona shouldn't see
  // (per Q3 decision: shared Priya chrome, role-aware variants).
  // Also marks the active link.
  //
  // Visibility is determined by reverse-mapping the link's href against
  // the persona's chromeLinks map. We don't read textContent because the
  // label text includes the icon glyph + badge ("▤ Inbox 3"), which would
  // never match the chrome keys cleanly.
  function wireSidebar() {
    var sidebar = document.querySelector('.sidebar__nav');
    if (!sidebar) return;
    var personaId = readPersonaId();
    var persona = PERSONAS[personaId];
    if (!persona) return;

    var links = Array.prototype.slice.call(sidebar.querySelectorAll('.sidebar__link'));
    var currentFile = window.location.pathname.split('/').pop();

    // Build a set of href files the current persona is allowed to see.
    // chromeLinks values are like '../01-priya/dashboard.html' — we just
    // want the trailing filename.
    var allowedFiles = {};
    Object.keys(persona.chromeLinks).forEach(function (label) {
      var href = persona.chromeLinks[label];
      if (href) allowedFiles[href.split('/').pop()] = true;
    });

    links.forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      var hrefFile = href.split('/').pop();

      // Active state
      if (hrefFile === currentFile) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }

      // Visibility — show if the current persona's chrome includes this
      // route. If no chrome map exists (e.g. login page), show all.
      var visible = !persona.chromeLinks || allowedFiles[hrefFile] === true;
      a.style.display = visible ? '' : 'none';
    });
  }

  // ───────────────────────────────────────────────────────── logout

  function wireLogout() {
    var logout = document.querySelector('[data-action="logout"]');
    if (!logout) return;
    // From any subfolder, logout goes back to ../00-login/login.html
    logout.addEventListener('click', function () {
      try { localStorage.removeItem('surakkha.persona'); } catch (e) {}
      window.location.href = '../00-login/login.html';
    });
  }

  // ───────────────────────────────────────────────────────── helpers

  function readPersonaId() {
    try {
      return localStorage.getItem('surakkha.persona') || 'priya';
    } catch (e) {
      return 'priya';
    }
  }

  // ───────────────────────────────────────────────────────── init

  function init() {
    wirePersonaPicker();
    wireTopChrome();
    wireSidebar();
    wireLogout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
