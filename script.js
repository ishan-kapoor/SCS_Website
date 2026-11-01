/* Search Career Services — interactions
   Vanilla JS: mobile menu, header state, scroll-spy, reveal, back-to-top, form validation. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Footer year ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  var toggle = $('#menu-toggle');
  var menu = $('#mobile-menu');
  var iconOpen = $('#icon-open');
  var iconClose = $('#icon-close');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('hidden', !open);
    iconOpen.classList.toggle('hidden', open);
    iconClose.classList.toggle('hidden', !open);
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- Header state + back-to-top ---------- */
  var header = $('#site-header');
  var toTop = $('#to-top');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-visible', y > 700);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    var home = $('#home');
    if (home) { home.setAttribute('tabindex', '-1'); home.focus({ preventScroll: true }); }
  });

  /* ---------- Smooth anchor scrolling with focus management ---------- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.pushState(null, '', id);
    });
  });

  /* ---------- Scroll-spy (active nav link) ---------- */
  var sections = $$('main section[id]');
  var navLinks = $$('.nav-link, .mobile-link');

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (l) {
          var active = l.getAttribute('href') === '#' + id;
          l.classList.toggle('is-active', active);
          if (active) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });

    /* ---------- Reveal on scroll ---------- */
    var reveals = $$('.reveal');
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealer.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Contact form ---------- */
  var form = $('#contact-form');
  if (!form) return;

  var status = $('#form-status');
  var companyLabel = $('#company-label');
  var typeRadios = $$('input[name="type"]', form);
  var RECIPIENTS = {
    client: 'client@search-career.com',
    candidate: 'resume@search-career.com'
  };

  function currentType() {
    var checked = typeRadios.filter(function (r) { return r.checked; })[0];
    return checked ? checked.value : 'client';
  }

  typeRadios.forEach(function (r) {
    r.addEventListener('change', function () {
      companyLabel.textContent = currentType() === 'candidate' ? 'Current organization' : 'Organization';
    });
  });

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your full name.'; },
    email: function (v) {
      if (!v.trim()) return 'Please enter your email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
    },
    message: function (v) { return v.trim().length >= 10 ? '' : 'Please tell us a little more (at least 10 characters).'; }
  };

  function validateField(name) {
    var input = form.elements[name];
    var err = $('#' + name + '-error');
    var msg = rules[name](input.value);
    err.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener('blur', function () { validateField(name); });
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') validateField(name);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'mt-5 text-sm font-medium';
    status.textContent = '';

    // Honeypot: silently stop if filled
    if (form.elements.website && form.elements.website.value) return;

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      if (!validateField(name) && !firstInvalid) firstInvalid = form.elements[name];
    });

    if (firstInvalid) {
      status.classList.add('is-error');
      status.textContent = 'Please correct the highlighted fields and try again.';
      firstInvalid.focus();
      return;
    }

    var type = currentType();
    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      company: form.elements.company.value.trim(),
      role: form.elements.role.value,
      message: form.elements.message.value.trim()
    };

    var subject = (type === 'candidate' ? 'Candidate enquiry' : 'Client enquiry') + ' — ' + data.name;
    var body = [
      'Name: ' + data.name,
      'Email: ' + data.email,
      data.company ? (type === 'candidate' ? 'Current organization: ' : 'Organization: ') + data.company : '',
      data.role ? 'Role of interest: ' + data.role : '',
      '',
      data.message
    ].filter(function (l, i) { return l !== '' || i > 3; }).join('\n');

    var href = 'mailto:' + RECIPIENTS[type] +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    status.classList.add('is-success');
    status.textContent = 'Thank you, ' + data.name.split(' ')[0] + '. Your email app should open with the enquiry ready to send to ' + RECIPIENTS[type] + '.';
    window.location.href = href;
  });
})();
