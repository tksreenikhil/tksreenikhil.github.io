/* Phase 1: vanilla JavaScript. Content is local and editable. No AI API or tracking. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = { get matches() { return reducedQuery.matches || document.documentElement.dataset.motion === 'reduced'; } };
  const finePointer = window.matchMedia('(pointer: fine)');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // A short first-visit reveal. Never blocks content while media downloads.
  let hasVisited = false;
  try { hasVisited = sessionStorage.getItem('nikhil-visited') === 'yes'; } catch (_) {}
  if (!hasVisited && !reduced.matches) {
    document.body.classList.add('loading');
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / 1000, 1);
      $('#load-number').textContent = String(Math.round(progress * 100)).padStart(2, '0');
      $('.preloader').style.setProperty('--load', progress);
      if (progress < 1) requestAnimationFrame(tick);
      else {
        $('.preloader').classList.add('done');
        setTimeout(() => { document.body.classList.remove('loading'); document.body.classList.add('page-entered'); }, 650);
        try { sessionStorage.setItem('nikhil-visited', 'yes'); } catch (_) {}
      }
    };
    requestAnimationFrame(tick);
  } else { requestAnimationFrame(() => document.body.classList.add('page-entered')); }

  // Theme state is optional; storage-disabled browsers still work.
  const themeButton = $('.theme-toggle');
  const syncTheme = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    $('meta[name="theme-color"]').setAttribute('content', dark ? '#111210' : '#f4f3ef');
  };
  syncTheme();
  themeButton.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('nikhil-theme', next); } catch (_) {}
    syncTheme();
  });

  // Mobile menu preserves normal anchor navigation and keyboard behavior.
  const menuToggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const closeMenu = () => { menu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation menu'); };
  menuToggle.addEventListener('click', () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'Close navigation menu' : 'Open navigation menu');
  });
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuToggle.focus(); } });
  document.addEventListener('click', event => { if (!menu.hidden && !menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu(); });
  window.addEventListener('resize', () => { if (innerWidth > 600) closeMenu(); });

  // Progressive enhancement: content stays visible when JavaScript is unavailable.
  if ('IntersectionObserver' in window) {
    document.body.classList.add('motion-ready');
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); reveals.unobserve(entry.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    $$('.reveal').forEach(item => reveals.observe(item));
  }
  const header = $('.site-header');
  const progressBar = $('.scroll-progress');
  const feature = $('#featured');
  const timeline = $('#journey');
  const heroImage = $('.portrait-frame > img');
  const sectionLinks = $$('.page-rail a');
  const navLinks = $$('.nav-pill a');
  const sections = $$('main > section[id]');
  let scrollTicking = false;
  const clamp = (number, min, max) => Math.min(Math.max(number, min), max);
  const updateScroll = () => {
    const y = window.scrollY;
    progressBar.style.transform = `scaleX(${y / Math.max(document.documentElement.scrollHeight - innerHeight, 1)})`;
    header.classList.toggle('scrolled', y > 40);
    let active = 'home';
    for (const section of sections) if (section.getBoundingClientRect().top < innerHeight * 0.44) active = section.id;
    sectionLinks.forEach(a => { const current = a.hash === `#${active}`; a.classList.toggle('active', current); if(current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    document.body.classList.toggle('over-dark-section', ['featured', 'contact'].includes(active));
    navLinks.forEach(a => {
      const current = a.hash === `#${active}`;
      a.classList.toggle('active', current);
      if (current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    if (!reduced.matches) {
      const featureProgress = clamp((innerHeight - feature.getBoundingClientRect().top) / (innerHeight + feature.offsetHeight), 0, 1);
      feature.style.setProperty('--feature-progress', featureProgress.toFixed(3));
      const journeyProgress = clamp((innerHeight * 0.7 - timeline.getBoundingClientRect().top) / timeline.offsetHeight, 0, 1);
      timeline.style.setProperty('--journey-progress', journeyProgress.toFixed(3));
      if (innerWidth > 800 && y < innerHeight * 1.5) heroImage.style.transform = `scale(${1.02 + Math.min(y / innerHeight, 1) * 0.07})`;
    }
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => { if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  // Small pointer effects enhance the composition without replacing the native cursor.
  const portrait = $('[data-tilt]');
  portrait.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches || innerWidth < 800) return;
    const r = portrait.getBoundingClientRect();
    portrait.style.setProperty('--tilt-x', `${((event.clientX - r.left) / r.width - 0.5) * 5}deg`);
    portrait.style.setProperty('--tilt-y', `${-((event.clientY - r.top) / r.height - 0.5) * 5}deg`);
  });
  portrait.addEventListener('pointerleave', () => { portrait.style.setProperty('--tilt-x', '0deg'); portrait.style.setProperty('--tilt-y', '0deg'); });
  const cursor = $('.custom-cursor');
  $$('.project-open').forEach(card => {
    card.addEventListener('pointerenter', () => { if (finePointer.matches && !reduced.matches && innerWidth > 1100) cursor.classList.add('active'); });
    card.addEventListener('pointermove', event => { cursor.style.transform = `translate(${event.clientX + 14}px, ${event.clientY + 14}px)`; });
    card.addEventListener('pointerleave', () => cursor.classList.remove('active'));
    card.addEventListener('click', () => cursor.classList.remove('active'));
  });
  const roles = ['B2B TECHNOLOGY MARKETER', 'BRAND STRATEGIST', 'CREATIVE THINKER', 'AI-ENABLED MARKETER'];
  let roleIndex = 0;
  setInterval(() => {
    if (!reduced.matches && !document.hidden) { roleIndex = (roleIndex + 1) % roles.length; $('#changing-role').textContent = roles[roleIndex]; }
  }, 4200);
  const updateTime = () => { $('.local-time').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) + ' IST'; };
  updateTime(); setInterval(updateTime, 60000);

  // A single selected filter. aria-pressed and a live count announce the state.
  const projects = $$('.project');
  $$('.filter-buttons button').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    $$('.filter-buttons button').forEach(b => { const selected = b === button; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); });
    let count = 0;
    projects.forEach(project => {
      const visible = filter === 'all' || project.dataset.category.split(' ').includes(filter);
      project.hidden = !visible;
      if (visible) count++;
    });
    $('.project-grid').classList.toggle('filtered', filter !== 'all');
    $('#filter-count').textContent = `${String(count).padStart(2, '0')} ${count === 1 ? 'PROJECT' : 'PROJECTS'}`;
    updateScroll();
  }));

  // Case studies use supplied work, with explicit evidence boundaries.
  const cases = {
    enterprise: {
      label: '01 / ENTERPRISE CONTENT & CAMPAIGNS', title: 'Making data matter.',
      intro: 'Enterprise analytics needs a story that starts with the audience’s problem. These Tableau campaign samples translate technical ideas into practical questions about decisions, definitions, and trust.',
      role: 'Campaign messaging, content development, creative direction, and social execution', period: 'Selected work / 2026',
      image: 'assets/work-125702.webp', alt: 'Tableau pharma campaign as shared on LinkedIn', imageCaption: 'Supplied Tableau pharma carousel cover. Product, patient, and growth figures inside the artwork are illustrative creative content, not my campaign results.',
      sections: [
        ['The challenge', 'Make enterprise analytics relevant to industry audiences without reducing the message to a list of product features.'],
        ['My contribution', ['Developed campaign narratives and social copy.', 'Shaped the visual direction and coordinated creative execution.', 'Connected sector-specific questions to the broader analytics story.']],
        ['The approach', 'Lead with a recognizable business question. Use one clear idea per asset, then support it with a concrete example and a practical next step.'],
        ['Execution', 'The supplied examples cover pharma decision-making and shared KPI definitions in manufacturing. Both bring the audience’s context into the opening message.'],
        ['A useful takeaway', 'Industry specificity gives a campaign a reason to exist. Visual craft supports the story; factual and copy reviews still matter at every stage.']
      ],
      gallery: [{src:'assets/work-125531.webp', alt:'Manufacturing KPI social campaign sample', caption:'Original supplied manufacturing KPI campaign creative.'}],
      result: 'The selected creative assets demonstrate delivered campaign work. Campaign-specific reach, leads, and revenue attribution have not been supplied.', next: 'events'
    },
    events: {
      label: '02 / EVENT & PARTNER MARKETING', title: 'Beyond the invitation.',
      intro: 'Executive events connect a business story with a real audience. My work brings campaign communication, brand assets, registration coordination, and the event experience together.',
      role: 'Event marketing, partner coordination, communications, and execution', period: 'Enterprise event portfolio / 2025–2026',
      image: 'assets/zoom-event.webp', alt: 'Zoom executive event marketing collage, Hyderabad', imageCaption: 'Original event collage extracted from my marketing portfolio. It documents a Zoom executive meet in Hyderabad.',
      sections: [
        ['The challenge', 'Create a relevant experience for enterprise decision-makers while coordinating the many moving parts of a partner event.'],
        ['My contribution', ['Event communication and invitation content.', 'Branded campaign assets and audience engagement.', 'Venue, vendor, partner, and registration coordination.', 'Post-event communications and content.']],
        ['The approach', 'Carry one message through invitations, reminders, on-site materials, and follow-up. Make the audience value clear before asking for their time.'],
        ['Execution', 'My portfolio includes enterprise events, roundtables, and sponsorships, with work across Snowflake, Tableau, Zoom, and Freshworks initiatives.'],
        ['A useful takeaway', 'The experience begins with the first invitation. Clear communication and reliable coordination are part of the brand experience.']
      ],
      result: 'The event collage and portfolio document the work. Metrics for this specific Zoom event are not supplied. The separate CXO campaign spotlight uses its own portfolio-reported figures.', next: 'content'
    },
    content: {
      label: '03 / CONTENT & THOUGHT LEADERSHIP', title: 'Complex ideas. Clear stories.',
      intro: 'Enterprise content works best when it gives people a clear reason to pay attention. My work spans newsletters, social campaigns, executive communications, and technology storytelling.',
      role: 'Content strategy, copywriting, creative development, and communication', period: 'Selected work / 2024–2026',
      image: 'assets/work-125733.webp', alt: 'AION-TECH Sports Club box cricket communication', imageCaption: 'Supplied employer-branding creative: “From dashboards to cover drives. From insights to innings.”',
      sections: [
        ['The challenge', 'Bring a consistent voice to a broad mix of content: enterprise technology, partner news, company milestones, and employee engagement.'],
        ['My contribution', ['Blog and newsletter development.', 'Social messaging and visual communication.', 'Executive communication support.', 'Brand and campaign collateral.']],
        ['The approach', 'Choose a clear audience and one central idea. Match the format and language to the context, then connect the story back to the brand.'],
        ['Execution', 'Content themes span AI, analytics, governance, cloud, collaboration, and automation. The supplied visual examples also show company recognition and internal culture communications.'],
        ['A useful takeaway', 'Different formats can share a recognizable voice while serving different audience needs. Keep performance reporting attached to a specific channel and period.']
      ],
      gallery: [{src:'assets/work-130053.webp', alt:'AION-TECH Alteryx partner recognition creative', caption:'Company recognition communication. Alteryx India Partner of the Year belongs to AION-TECH, not to me as an individual.'},{src:'assets/linkedin-september.webp', alt:'LinkedIn analytics for September 1–30 2026', caption:'Supplied LinkedIn analytics snapshot, 1–30 September 2026. The account identity and comparison-period baseline are not visible.'}],
      stats:[['13,118','impressions'],['425','reactions'],['5','comments'],['4','reposts']],
      result:'LinkedIn analytics snapshot — September 2026. These figures describe the supplied reporting screenshot; they are not attributed to a particular post, account, or campaign.', next:'digital'
    },
    digital: {
      label:'04 / DIGITAL EXPERIENCE & MESSAGING', title:'A clearer digital first impression.',
      intro:'Website content needs to help visitors understand the offer, find relevant information, and choose a useful next step.',
      role:'Content review, partner-page planning, messaging, and stakeholder coordination', period:'Enterprise website communication / 2026',
      sections:[
        ['The challenge','Keep enterprise technology messaging clear and current while preserving the company’s brand and partner context.'],
        ['My contribution',['Website content review and messaging improvements.','Partner-page content planning.','Brand alignment and content coordination.']],
        ['The approach','Review the information hierarchy before refining the copy. Make each section answer a visitor question, and make every claim traceable to a current source.'],
        ['Execution','The supplied brief identifies partner pages and website messaging as work areas. The card illustrates a content direction; it is not a screenshot of a shipped partner page.'],
        ['A useful takeaway','A better page starts with a clearer offer and a more useful sequence of information. Visual polish comes after the story is understandable.']
      ],
      result:'No page-level conversion data or final website screenshots have been supplied. The cover remains explicitly labelled as a concept.',next:'ai'
    },
    ai: {
      label:'05 / AI & MARKETING OPERATIONS',title:'Build once. Think further.',
      intro:'The AIONTECH Blueprint Generator organizes institutional knowledge into reusable enterprise narratives, blueprints, use cases, and presales materials.',
      role:'Knowledge organization, prompt framework design, and marketing workflow development',period:'Implemented internal project / documented in supplied materials',
      image:'assets/work-130209.webp',alt:'AIONTECH Blueprint Generator Claude project homepage',imageCaption:'Supplied project screenshot showing the configured Claude workspace, recent sessions, and a 54-file context collection.',
      sections:[
        ['The challenge','Useful enterprise knowledge is often spread across case studies, project documents, and solution assets. Finding and reusing it becomes part of every content task.'],
        ['My contribution',['Organized enterprise reference material.','Developed reusable project instructions and prompt frameworks.','Applied the workflow to blueprints, use cases, and business narratives.']],
        ['The approach','Ground the work in organizational context. Establish a reusable instruction structure, then review generated material for accuracy, scope, and relevance.'],
        ['Execution','The résumé describes an internal AI knowledge initiative, and the supplied screenshots show a configured Claude project with instructions and prior sessions.'],
        ['A useful takeaway','The quality of an AI workflow depends on the source material, context, and review process as much as on the prompt itself.']
      ],
      result:'Status: implemented internal workflow, based on the supplied résumé and project screenshots. This portfolio shows documentation, not a live connected demo. Runtime behavior, adoption, and time savings have not been independently tested.',next:'presentation'
    },
    presentation:{
      label:'AI LAB / ATS PRESENTATION SYSTEM',title:'A consistent system for every deck.',
      intro:'A reusable Claude project instruction system for turning presentations and business documents into brand-aligned, editable ATS materials.',
      role:'Prompt framework and presentation workflow design',period:'Implemented internal project / supplied screenshot evidence',
      image:'assets/work-130139.webp',alt:'ATS PPT Converter Claude project homepage',imageCaption:'Supplied ATS PPT Converter workspace screenshot with a six-file context collection and prior presentation sessions.',
      sections:[
        ['The challenge','Keep the brand, visual hierarchy, and content presentation consistent across decks produced for different audiences.'],
        ['My contribution',['Defined repeatable presentation redesign instructions.','Structured the brand and output expectations.','Used the workspace across corporate presentation tasks.']],
        ['The approach','Turn recurring design decisions into explicit guidance: a shared presentation system, an editable output expectation, and a reviewable result.'],
        ['Execution','Supplied screenshots document the configured project and its redesign instructions. The visible session list covers capability decks, training materials, and partner presentations.'],
        ['A useful takeaway','Reusable instructions can make the starting point more consistent. A human review is still essential for layout, factual accuracy, and brand judgment.']
      ],
      result:'Status: implemented internal instruction workflow. This page documents the project; it does not run a PowerPoint conversion or claim independently measured productivity gains.',next:'enterprise'
    },
    cxo:{
      label:'FEATURED CAMPAIGN / EXECUTIVE EVENTS',title:'The right conversation starts before the room.',
      intro:'A CXO leadership event campaign brought together audience engagement, invitations, branding, registration coordination, and event execution.',
      role:'End-to-end campaign coordination and event execution',period:'CXO event campaign / supplied portfolio snapshot',
      sections:[
        ['The challenge','Bring a relevant senior audience into an enterprise technology conversation and connect registration activity with the in-person event.'],
        ['My contribution',['Audience communication and campaign execution.','Registration and stakeholder coordination.','Brand assets, event experience, and follow-through.']],
        ['The approach','Build a consistent journey from invitation to attendance, with clear audience relevance and coordinated delivery.'],
        ['Execution','The source portfolio reports end-to-end event execution and engagement with C-level and business stakeholders.'],
        ['A useful takeaway','Registration volume is one part of the picture. Audience relevance and attendance conversion help describe what happened next, without implying a revenue outcome.']
      ],
      stats:[['137','registrations'],['~50%','senior audience relevance'],['25%','attendance conversion']],
      result:'Source: supplied marketing portfolio, slide 4. The event is not named in that source; figures are not assigned to the separate Zoom collage. The relevance figure is approximate and conversion is rounded. No attributable revenue figure is supplied.',next:'events'
    },
    award:{
      label:'RECOGNITION / THRIVE 2024',title:'Above & Beyond.',
      intro:'A personal recognition milestone from AION-TECH’s THRIVE 2024 celebrations.',
      role:'Personal recognition',period:'2024',
      image:'assets/work-125435.webp',alt:'Sree Nikhil with his Above and Beyond recognition and award',imageCaption:'Original supplied LinkedIn post and award photographs.',
      sections:[['The milestone','Above & Beyond recognition at THRIVE 2024. The supplied image shows the award and recognition moment.'],['The perspective','A meaningful reminder to keep taking ownership, learning, and contributing to the team.']],
      result:'This personal award is separate from company-level partner awards shown elsewhere in the portfolio.',next:'enterprise'
    }
  };
  const dialog = $('#case-dialog');
  const explorerDialog = $('#explorer-dialog');
  let returnFocus = null;
  function showDialog(target) {
    returnFocus = document.activeElement;
    target.showModal();
    document.body.classList.add('modal-open');
    target.scrollTop = 0;
  }
  function renderCase(id, open = true) {
    const c = cases[id]; if (!c) return;
    $('#case-label').textContent = c.label;
    const sectionHTML = c.sections.map(([title, body]) => `<section><h3>${escapeHTML(title)}</h3>${Array.isArray(body) ? `<ul>${body.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : `<p>${escapeHTML(body)}</p>`}</section>`).join('');
    const imageHTML = c.image ? `<div class="case-hero"><figure><img src="${c.image}" alt="${escapeHTML(c.alt)}"><figcaption>${escapeHTML(c.imageCaption)}</figcaption></figure></div>` : '';
    const galleryHTML = c.gallery ? `<div class="case-gallery">${c.gallery.map(item => `<figure><img src="${item.src}" alt="${escapeHTML(item.alt)}" loading="lazy"><figcaption>${escapeHTML(item.caption)}</figcaption></figure>`).join('')}</div>` : '';
    const statsHTML = c.stats ? `<div class="case-results-row">${c.stats.map(([value, label]) => `<div><strong>${escapeHTML(value)}</strong><span>${escapeHTML(label)}</span></div>`).join('')}</div>` : '';
    $('#case-content').innerHTML = `<div class="case-header"><span class="eyebrow">${escapeHTML(c.period)}</span><h2 id="case-title">${escapeHTML(c.title)}</h2><p>${escapeHTML(c.intro)}</p></div>${imageHTML}<div class="case-body"><div class="case-meta"><div><span>MY ROLE</span><p>${escapeHTML(c.role)}</p></div><div><span>CONTEXT</span><p>${escapeHTML(c.period)}</p></div></div><div class="case-sections">${sectionHTML}</div>${galleryHTML}<div class="case-results"><h3>Results & evidence</h3>${statsHTML}<p>${escapeHTML(c.result)}</p></div><button class="case-next" data-next="${c.next}">Next: ${escapeHTML(cases[c.next].title)} <span>↗</span></button></div>`;
    if (open) showDialog(dialog);
    else { dialog.scrollTop = 0; $('.close-dialog', dialog).focus({ preventScroll: true }); }
  }
  $$('[data-project]').forEach(button => button.addEventListener('click', () => renderCase(button.dataset.project)));
  dialog.addEventListener('click', event => { const next = event.target.closest('[data-next]'); if (next) renderCase(next.dataset.next, false); });
  [dialog, explorerDialog].forEach(target => {
    $('.close-dialog', target).addEventListener('click', () => target.close());
    target.addEventListener('click', event => { const r = target.getBoundingClientRect(); if (event.target === target && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) target.close(); });
    target.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true }); });
  });
  $$('[data-certificate]').forEach(button => button.addEventListener('click', () => {
    const content = button.dataset.certificate === 'content';
    const title = content ? 'Content Creation: Strategy and Tools' : 'Marketing Tools: Automation';
    $('#case-label').textContent = 'LEARNING / CERTIFICATE OF COMPLETION';
    $('#case-content').innerHTML = `<div class="case-standalone"><h2 id="case-title">${title}</h2><p>LinkedIn Learning · Completed ${content ? '7' : '6'} October 2026. Certificate of course completion supplied by Sree Nikhil.</p><img src="assets/certificate-${content ? 'content' : 'automation'}.webp" alt="${title} certificate of completion"></div>`;
    showDialog(dialog);
  }));

  const stages = [
    ['INSIGHT', 'Start with a better question.', 'Collect the business context, audience needs, and source material. A useful brief starts with what we can actually support.', 'An evidence-led creative brief'],
    ['STRATEGY', 'Find the idea worth sharing.', 'Choose the audience, the problem, and the point of view. Use AI to explore alternatives; use judgment to select the most relevant direction.', 'One clear message and a channel plan'],
    ['CREATION', 'Give the idea a clear form.', 'Develop copy, visual directions, and supporting assets. Check the facts, refine the language, and make the brand feel consistent.', 'A reviewed set of campaign assets'],
    ['EXECUTION', 'Connect the moving parts.', 'Coordinate stakeholders, formats, approvals, and timing. Prepare the campaign for the channel and the audience it needs to reach.', 'An approved, coordinated campaign'],
    ['OPTIMISATION', 'Learn from what happened.', 'Review the available channel evidence in its proper context. Separate observations from assumptions, then decide what the next iteration should improve.', 'A focused learning and improvement plan']
  ];
  let stageIndex = 0;
  function setStage(index, focus = false) {
    stageIndex = (index + stages.length) % stages.length;
    const [label, title, copy, output] = stages[stageIndex];
    $$('.workflow-tabs button').forEach((button, i) => { button.setAttribute('aria-selected', String(i === stageIndex)); button.tabIndex = i === stageIndex ? 0 : -1; });
    $('#stage-panel').setAttribute('aria-labelledby', `stage-${stageIndex}`);
    $('#stage-label').textContent = `0${stageIndex + 1} / ${label}`;
    $('#stage-title').textContent = title; $('#stage-copy').textContent = copy; $('#stage-output').textContent = output;
    $('#next-stage').innerHTML = `${stageIndex === 4 ? 'Back to insight' : 'Next stage'} <span>→</span>`;
    if (!reduced.matches) {
      $('.metal-sphere').style.transform = `rotateY(${stageIndex % 2 === 0 ? -12 : 12}deg) rotateX(5deg)`;
      $('.orbit-one').style.transform = `rotate(${-30 + stageIndex * 15}deg)`;
      $('.orbit-two').style.transform = `rotate(${40 - stageIndex * 12}deg)`;
      $('.orbit-three').style.transform = `rotate(${100 + stageIndex * 17}deg)`;
    }
    if (focus) $(`#stage-${stageIndex}`).focus();
  }
  $$('.workflow-tabs button').forEach(button => {
    button.addEventListener('click', () => setStage(Number(button.dataset.stage)));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      setStage(event.key === 'Home' ? 0 : event.key === 'End' ? 4 : stageIndex + (event.key === 'ArrowRight' ? 1 : -1), true);
    });
  });
  $('#next-stage').addEventListener('click', () => setStage(stageIndex + 1, true));

  const directions = {
    data: { angle:'Same KPI. Different answers?', context:'Data & analytics leaders', problem:'Teams compare performance using different metric definitions.', message:'Build trust in the definitions before asking people to trust the dashboard.', format:'A practical LinkedIn carousel with a metric-definition checklist.', next:'Invite readers to review calculation, scope, source, and ownership for one important KPI.' },
    finance: { angle:'Make the exceptions visible.', context:'Finance leaders', problem:'Manual reconciliation makes it harder to focus on the exceptions that need attention.', message:'Show how a clearer reconciliation process supports review and control, without inventing savings or ROI.', format:'An executive roundtable invitation supported by a short problem–approach narrative.', next:'Invite a discussion about reconciliation challenges and the current review process.' },
    hr: { angle:'The experience between the meetings.', context:'HR & people leaders', problem:'Employee communication and participation can become fragmented across touchpoints.', message:'Connect the communication journey so people understand what is happening and how to participate.', format:'A coordinated internal email and social communication sequence.', next:'Make the event, action, owner, and participation deadline clear.' }
  };
  const renderDirection = () => {
    const d = directions[$('#audience').value];
    $('#explorer-result').innerHTML = `<div class="explorer-full"><span>CAMPAIGN ANGLE / ${escapeHTML(d.context.toUpperCase())}</span><h3>${escapeHTML(d.angle)}</h3></div><div><span>BUSINESS CONTEXT</span><p>${escapeHTML(d.problem)}</p></div><div><span>CORE MESSAGE</span><p>${escapeHTML(d.message)}</p></div><div><span>FORMAT</span><p>${escapeHTML(d.format)}</p></div><div><span>NEXT ACTION</span><p>${escapeHTML(d.next)}</p></div>`;
  };
  renderDirection();
  $('#audience').addEventListener('change', renderDirection);
  $('#open-explorer').addEventListener('click', () => showDialog(explorerDialog));

  let toastTimeout;
  const toast = text => { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 3500); };
  $('#copy-email').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('tksreenikhil19@gmail.com'); toast('Email address copied.'); }
    catch (_) { toast('Email: tksreenikhil19@gmail.com — select the address above to copy.'); }
  });
})();
