/**
 * dashboard.js — Priya dashboard
 * Wires the layout toggler (A / B / C) and reads/writes the choice
 * to localStorage.surakkha.layout. Default = 'c' (workflow stages).
 */

(function () {
  'use strict';

  function init() {
    wireLayoutToggle();
  }

  // ───────────────────────────────────────────────────────── layout toggle
  // 3 dashboard layouts:
  //   a · dense grid   (legacy)
  //   b · editorial    (legacy)
  //   c · workflow stages (default — 5-column pipeline)
  function wireLayoutToggle() {
    var btns = document.querySelectorAll('.layout-toggle__btn');
    var main = document.querySelector('main.container--wide');
    if (!btns.length || !main) return;

    var saved = 'c';
    try { saved = localStorage.getItem('surakkha.layout') || 'c'; } catch (e) {}
    if (!['a', 'b', 'c'].includes(saved)) saved = 'c';
    applyLayout(saved);

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.dataset.layoutBtn;
        if (!next) return;
        try { localStorage.setItem('surakkha.layout', next); } catch (e) {}
        applyLayout(next);
      });
    });

    function applyLayout(which) {
      main.dataset.layout = which;
      btns.forEach(function (b) {
        var active = b.dataset.layoutBtn === which;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-checked', String(active));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
