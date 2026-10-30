(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // Multilingual intro, shortened for reduced-motion settings.
  const loader = $('.intro-loader');
  if (loader) {
    const words = ['Hello', 'नमस्ते', 'Hola', 'Bonjour', 'こんにちは', 'Ciao', 'Привет', 'স্বাগতম'];
    const word = $('.intro-word', loader);
    const meter = $('.intro-meter', loader);
    let index = 0;
    const finishLoader = () => {
      loader.classList.add('is-leaving');
      document.body.classList.add('body-ready');
      window.setTimeout(() => loader.remove(), reduceMotion ? 20 : 850);
    };
    if (reduceMotion) {
      finishLoader();
    } else {
      const timer = window.setInterval(() => {
        index += 1;
        if (index >= words.length) {
          window.clearInterval(timer);
          finishLoader();
          return;
        }
        word.textContent = words[index];
        meter.innerHTML = `${String(index + 1).padStart(2, '0')} <i>/ ${String(words.length).padStart(2, '0')}</i>`;
      }, 170);
    }
  }

  // Theme preference.
  const themeButton = $('.theme-toggle');
  const applyTheme = theme => {
    root.dataset.theme = theme;
    if (themeButton) themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    try { localStorage.setItem('portfolio-theme', theme); } catch (_) { /* storage can be disabled */ }
  };
  try {
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
  } catch (_) { /* use the document default */ }
  if (themeButton) {
    themeButton.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} mode`);
    themeButton.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  }

  // Layered navigation panel.
  const menuButton = $('.menu-toggle');
  const menu = $('.menu-panel');
  const scrim = $('.menu-scrim');
  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open menu');
  };
  const toggleMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) $('.menu-link', menu)?.focus({ preventScroll: true });
    else menuButton?.focus({ preventScroll: true });
  };
  menuButton?.addEventListener('click', () => toggleMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  scrim?.addEventListener('click', closeMenu);
  $$('.menu-link', menu).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  // Section and item entrance reveals.
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in-view'));
  }

  // Horizontal expertise rail: pointer drag, plus explicit arrow controls.
  const viewport = $('.service-viewport');
  const track = $('#service-track');
  if (viewport && track) {
    let down = false;
    let startX = 0;
    let startScroll = 0;
    viewport.addEventListener('pointerdown', event => {
      if (event.target.closest('a,button')) return;
      down = true;
      startX = event.clientX;
      startScroll = viewport.scrollLeft;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener('pointermove', event => {
      if (down) viewport.scrollLeft = startScroll - (event.clientX - startX);
    });
    const release = () => { down = false; viewport.classList.remove('is-dragging'); };
    viewport.addEventListener('pointerup', release);
    viewport.addEventListener('pointercancel', release);
    $$('.service-arrow').forEach(button => button.addEventListener('click', () => {
      const card = $('.service-card', track);
      viewport.scrollBy({ left: (card?.getBoundingClientRect().width || 320) * Number(button.dataset.dir) + 16, behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
  }

  // Mouse-follow highlights on interactive cards.
  $$('.service-card,.contact-link,.tech-key').forEach(el => {
    el.addEventListener('pointermove', event => {
      const bounds = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
      el.style.setProperty('--my', `${event.clientY - bounds.top}px`);
    });
  });

  // Accessible work / education tabs.
  const tabs = $$('.journey-tab');
  const activateTab = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.dataset.panel);
      if (panel) panel.hidden = !selected;
    });
  };
  tabs.forEach((tab, position) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = position;
      if (event.key === 'ArrowRight') next = (position + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (position - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      tabs[next].focus();
      activateTab(tabs[next]);
    });
  });

  // Stack details affordance and live Bangladesh clock.
  const techTooltip = $('#tech-tooltip');
  $$('.tech-key').forEach(button => {
    const describe = () => { if (techTooltip) techTooltip.textContent = button.dataset.description; };
    button.addEventListener('mouseenter', describe);
    button.addEventListener('focus', describe);
    button.addEventListener('click', describe);
  });
  const updateClock = () => {
    const now = new Date();
    const time = $('#local-time');
    const date = $('#local-date');
    if (time) time.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    if (date) date.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(now).toUpperCase();
  };
  updateClock();
  window.setInterval(updateClock, 1000);
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Scroll progress and back-to-top control.
  const progress = $('.scroll-progress');
  const backTop = $('.back-top');
  let scrollQueued = false;
  const updateScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
    backTop?.classList.toggle('visible', window.scrollY > window.innerHeight * .7);
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      window.requestAnimationFrame(updateScroll);
      scrollQueued = true;
    }
  }, { passive: true });
  updateScroll();
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // Corner-frame cursor on fine pointers only; native cursor remains on touch / reduced motion.
  const cursor = $('.custom-cursor');
  if (cursor && matchMedia('(pointer:fine)').matches && !reduceMotion) {
    window.addEventListener('pointermove', event => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.classList.add('visible');
    }, { passive: true });
    document.addEventListener('pointerover', event => cursor.classList.toggle('hover', Boolean(event.target.closest('.cursor-target,a,button,summary'))));
    document.addEventListener('pointerdown', () => cursor.classList.add('hover'));
    document.addEventListener('pointerup', () => cursor.classList.remove('hover'));
  }
})();
