/**
 * dashboard.js — tab switching + layout toggle for the Dashboard page
 */

(function () {
  'use strict';

  function init() {
    wireTabs();
    wireLayoutToggle();
  }

  function wireTabs() {
    var tabs = document.querySelectorAll('.tab');
    var panels = document.querySelectorAll('.tab-panel');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.tab;

        // Update tab states
        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle('active', active);
          t.setAttribute('aria-selected', String(active));
        });

        // Update panels
        panels.forEach(function (p) {
          var show = p.dataset.tab === target;
          if (show) p.removeAttribute('hidden');
          else p.setAttribute('hidden', '');
        });
      });

      // Keyboard nav (Left/Right between tabs)
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var all = Array.prototype.slice.call(tabs);
        var i = all.indexOf(tab);
        var next = e.key === 'ArrowRight'
          ? (i + 1) % all.length
          : (i - 1 + all.length) % all.length;
        all[next].focus();
        all[next].click();
      });
    });
  }

  // ───────────────────────────────────────────────────────── layout toggle
  // Switches between 3 dashboard layouts (A · grid / B · editorial /
  // C · status-board) by setting `data-layout` on <main>. The CSS uses
  // attribute selectors to show only the matching [data-layout-only] panel.
  // Choice persists in localStorage.surakkha.layout; default = 'a'.
  function wireLayoutToggle() {
    var btns = document.querySelectorAll('.layout-toggle__btn');
    var main = document.querySelector('main.container--wide');
    if (!btns.length || !main) return;

    var saved = 'a';
    try { saved = localStorage.getItem('surakkha.layout') || 'a'; } catch (e) {}
    if (!['a', 'b', 'c'].includes(saved)) saved = 'a';
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
