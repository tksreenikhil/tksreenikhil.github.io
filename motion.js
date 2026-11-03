/* Cinematic enhancements. No scroll hijacking, external libraries or tracking. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const body = document.body;
  const systemReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  let preference = root.dataset.motion || 'full';
  let pointerFrame = 0;
  let scrollFrame = 0;
  const calm = () => systemReduced.matches || root.dataset.motion === 'reduced';

  const motionButton = $('.motion-toggle');
  function syncMotion() {
    const reduced = systemReduced.matches || preference === 'reduced';
    root.dataset.motion = reduced ? 'reduced' : 'full';
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.disabled = systemReduced.matches;
    $('.motion-label').textContent = systemReduced.matches ? 'Reduced motion' : reduced ? 'Resume motion' : 'Pause motion';
    $('.motion-icon').textContent = reduced ? '▷' : 'Ⅱ';
    if (reduced) {
      body.classList.remove('pointer-active');
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      $$('[data-tilt]').forEach(item => { item.style.removeProperty('--tilt-x'); item.style.removeProperty('--tilt-y'); });
      $$('.project-cover').forEach(item => { item.style.removeProperty('--card-rx'); item.style.removeProperty('--card-ry'); });
      $$('.magnetic').forEach(item => { item.style.removeProperty('--magnet-x'); item.style.removeProperty('--magnet-y'); });
    }
    queueScroll();
  }
  motionButton.addEventListener('click', () => {
    preference = preference === 'reduced' ? 'full' : 'reduced';
    try { localStorage.setItem('nikhil-motion', preference); } catch (_) {}
    syncMotion();
  });
  systemReduced.addEventListener('change', syncMotion);

  // Add short, staggered entrances without hiding content in a no-JS browser.
  const entrances = $$('.section-kicker, .about-right > p, .about-foot, .ecosystem, .work-heading > div, .project, .film-copy, .lab-console, .lab-projects article, .skill-list details, .awards-grid > *, .learning-strip, .interest-grid article, .contact-links, .tools-line');
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        reveal.unobserve(entry.target);
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -18px 0px' });
    entrances.forEach(item => {
      item.classList.add('motion-item');
      if (item.matches('.lab-projects article, .interest-grid article, .skill-list details')) {
        item.style.setProperty('--stagger', `${Math.min([...item.parentElement.children].indexOf(item), 3) * 65}ms`);
      }
      reveal.observe(item);
    });
  }

  // Cursor light follows the pointer, while the native cursor remains visible.
  const glow = $('.cursor-backlight');
  const halo = $('.cursor-halo');
  let targetX = 0, targetY = 0, lightX = 0, lightY = 0, haloX = 0, haloY = 0;
  let pointerStarted = false;
  function lightFrame() {
    if (calm() || !pointer.matches || document.hidden) { pointerFrame = 0; return; }
    lightX += (targetX - lightX) * .12;
    lightY += (targetY - lightY) * .12;
    haloX += (targetX - haloX) * .32;
    haloY += (targetY - haloY) * .32;
    glow.style.transform = `translate3d(${lightX}px,${lightY}px,0) translate(-50%,-50%)`;
    halo.style.transform = `translate3d(${haloX}px,${haloY}px,0) translate(-50%,-50%)`;
    if (Math.abs(targetX - lightX) + Math.abs(targetY - lightY) > .15) pointerFrame = requestAnimationFrame(lightFrame);
    else pointerFrame = 0;
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || calm() || !pointer.matches) return;
    targetX = event.clientX; targetY = event.clientY;
    if (!pointerStarted) { lightX = haloX = targetX; lightY = haloY = targetY; pointerStarted = true; }
    body.classList.add('pointer-active');
    halo.classList.toggle('interactive', Boolean(event.target.closest('a,button,summary,select')));
    if (!pointerFrame) pointerFrame = requestAnimationFrame(lightFrame);
  }, { passive: true });
  const hidePointer = () => {
    body.classList.remove('pointer-active');
    pointerStarted = false;
    cancelAnimationFrame(pointerFrame); pointerFrame = 0;
  };
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) hidePointer(); });
  window.addEventListener('blur', hidePointer);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hidePointer(); });

  // Perspective is confined to artwork; captions and click targets stay stable.
  $$('.project-open').forEach(button => {
    const cover = button.querySelector('.project-cover');
    button.addEventListener('pointermove', event => {
      if (calm() || !pointer.matches || innerWidth <= 800) return;
      const rect = cover.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      cover.style.setProperty('--card-rx', `${(0.5 - y) * 4}deg`);
      cover.style.setProperty('--card-ry', `${(x - 0.5) * 5}deg`);
      cover.style.setProperty('--shine-x', `${x * 100}%`);
      cover.style.setProperty('--shine-y', `${y * 100}%`);
    }, { passive: true });
    button.addEventListener('pointerleave', () => {
      cover.style.setProperty('--card-rx', '0deg'); cover.style.setProperty('--card-ry', '0deg');
    });
  });
  $$('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (calm() || !pointer.matches) return;
      const rect = button.getBoundingClientRect();
      button.style.setProperty('--magnet-x', `${clamp((event.clientX - rect.left - rect.width / 2) * .14, -9, 9)}px`);
      button.style.setProperty('--magnet-y', `${clamp((event.clientY - rect.top - rect.height / 2) * .14, -9, 9)}px`);
    }, { passive: true });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--magnet-x', '0px'); button.style.setProperty('--magnet-y', '0px');
    });
  });

  const hero = $('.hero');
  const heroArt = $('.hero-art');
  const film = $('.signature-film');
  const filmMark = $('.film-mark');
  const filmCopy = $('.film-copy');
  const filmLight = $('.film-light');
  const artwork = $$('.artwork-pair, .editorial-paper, .browser-mock');
  function renderScroll() {
    scrollFrame = 0;
    if (calm()) return;
    const height = innerHeight;
    if (innerWidth > 800 && hero.getBoundingClientRect().bottom > 0) {
      heroArt.style.setProperty('--hero-drift', `${Math.min(scrollY * .055, 38).toFixed(2)}px`);
    }
    const rect = film.getBoundingClientRect();
    if (rect.bottom > -80 && rect.top < height + 80) {
      const progress = clamp((height - rect.top) / (height + rect.height), 0, 1);
      filmMark.style.setProperty('--film-y', `${(progress - .5) * -65}px`);
      filmMark.style.setProperty('--film-scale', `${.94 + progress * .09}`);
      filmCopy.style.setProperty('--film-copy-y', `${(progress - .5) * 24}px`);
      filmLight.style.setProperty('--film-light-x', `${(progress - .5) * 18}%`);
    }
    if (innerWidth > 800) artwork.forEach(item => {
      const rect = item.closest('.project-cover').getBoundingClientRect();
      if (rect.top >= height || rect.bottom <= 0) return;
      const progress = (height - rect.top) / (height + rect.height);
      item.style.setProperty('--art-drift', `${((progress - .5) * 26).toFixed(2)}px`);
    });
  }
  function queueScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll); }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  syncMotion();

  // Animate only the supplied figures; their original values remain the source.
  const stats = $$('.big-stat strong, .stat-row strong');
  const countUp = element => {
    if (calm()) return;
    const text = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
    if (!text) return;
    const original = text.nodeValue;
    const target = Number(original.replace(/[^\d]/g, ''));
    const prefix = original.startsWith('~') ? '~' : '';
    if (!target) return;
    element.setAttribute('aria-label', element.textContent);
    const value = document.createElement('span');
    value.setAttribute('aria-hidden', 'true');
    text.replaceWith(value);
    const start = performance.now();
    function tick(now) {
      const t = calm() ? 1 : clamp((now - start) / 1350, 0, 1);
      value.textContent = prefix + Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { countUp(entry.target); counterObserver.unobserve(entry.target); }
    }), { threshold: .65 });
    stats.forEach(stat => counterObserver.observe(stat));
  }
  $$('.filter-buttons button').forEach(button => button.addEventListener('click', () => {
    if (!calm()) $$('.project:not([hidden])').forEach((item, index) => {
      item.classList.add('in-view');
      if (item.animate) item.animate([{ opacity: .2, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], { duration: 450, delay: Math.min(index, 3) * 45, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
    queueScroll();
  }));
  const stagePanel = $('#stage-panel');
  const animateStage = () => {
    if (!calm() && stagePanel.animate) stagePanel.animate([{ opacity: .2, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
  };
  $$('.workflow-tabs button, #next-stage').forEach(button => {
    button.addEventListener('click', animateStage);
    button.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) animateStage(); });
  });
})();
