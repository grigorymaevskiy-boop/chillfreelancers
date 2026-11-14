(function () {
  'use strict';

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Phone menu
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  if (nav && toggle) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.querySelectorAll('.nav__menu a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 810px)').addEventListener('change', function (e) { if (e.matches) setOpen(false); });
  }

  // Appear-on-scroll
  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  // Join form → Google Apps Script web app → Google Sheet
  var form = document.getElementById('join-form');
  if (!form) return;
  var status = form.querySelector('.form__status');
  var button = form.querySelector('button[type="submit"]');
  var done = document.getElementById('join-done');
  var buttonText = button.textContent;

  function showError(msg) {
    status.textContent = msg;
    status.classList.add('is-error');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    status.classList.remove('is-error');

    if (!form.checkValidity()) {
      var bad = form.querySelector(':invalid');
      showError(bad && bad.type === 'email' && bad.value
        ? 'Please check your email address.'
        : 'Please fill in your name and email.');
      if (bad) bad.focus();
      return;
    }

    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      showError('The form isn’t connected yet. Please try again later.');
      console.warn('Join form: set data-endpoint on #join-form to your Apps Script /exec URL.');
      return;
    }

    // Honeypot filled → pretend success, send nothing
    if (form.elements._website.value) { finish(); return; }

    var body = new URLSearchParams(new FormData(form));
    body.append('Page', location.href);

    button.disabled = true;
    button.textContent = 'Sending…';

    fetch(endpoint, { method: 'POST', body: body })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.result === 'success') finish();
        else throw new Error((data && data.error) || 'Unknown error');
      })
      .catch(function (err) {
        console.error('Join form error:', err);
        showError('Sorry, something went wrong. Please try again in a moment.');
        button.disabled = false;
        button.textContent = buttonText;
      });
  });

  function finish() {
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }
})();
