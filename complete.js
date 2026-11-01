/* FABIO V1.1: native motion, event-driven, entirely optional. No animation library. */
(() => {
  'use strict';
  const all = selector => [...document.querySelectorAll(selector)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;
  try { if (sessionStorage.getItem('fabio-quiet') === 'true') body.classList.add('quiet'); } catch (_) {}
  const head = document.querySelector('header');
  const menu = document.querySelector('#menu');
  const motionButton = document.querySelector('#motion');
  const still = () => reduce.matches || body.classList.contains('quiet');
  const pictures = all('.work picture,.hero-art-link,.essay-chapter>a,.hero-satellites a,.artist-main-photo');
  const titles = all('.narrative-title');
  const targets = [...pictures, ...titles];
  const seen = new WeakSet(), active = new Set(), animations = new Set();
  let frame = 0;

  all('.photo-study input').forEach(input => input.addEventListener('input', () => {
    input.closest('.photo-study').querySelector('.before-after').style.setProperty('--split', input.value + '%');
  }));
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    body.classList.toggle('menu-open', open);
    document.querySelector('main').inert = open;
    document.querySelector('footer').inert = open;
  });
  document.querySelector('#nav').addEventListener('click', event => {
    if (event.target.closest('a') && menu.getAttribute('aria-expanded') === 'true') menu.click();
  });

  function enter(element) {
    if (seen.has(element) || still() || !element.animate) return;
    seen.add(element);
    const title = element.classList.contains('narrative-title');
    const animation = element.animate([
      { opacity: .15, clipPath: title ? 'inset(0 0 85% 0)' : 'inset(18% 0 18% 0)', translate: title ? '0 28px' : '0 65px' },
      { opacity: 1, clipPath: 'inset(0 0 0 0)', translate: '0 0' }
    ], { duration: title ? 1100 : 1350, easing: 'cubic-bezier(.18,.8,.2,1)' });
    animations.add(animation);
    animation.onfinish = () => animations.delete(animation);
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { active.add(entry.target); enter(entry.target); }
      else active.delete(entry.target);
    });
    schedule();
  }, { threshold: .08 }) : null;
  targets.forEach(element => observer?.observe(element));
  const connection = document.querySelector('.connections');

  function paint() {
    frame = 0;
    head.classList.toggle('day', scrollY > innerHeight * .7);
    if (still()) return;
    active.forEach(element => {
      if (element.classList.contains('narrative-title')) return;
      const rect = element.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight));
      if (element.classList.contains('hero-art-link')) {
        element.style.transform = `translateY(${progress * -35}px) scale(${1 + Math.max(0, -progress) * .035})`;
      } else {
        element.style.setProperty('--drift', (-progress * (innerWidth < 600 ? 12 : 32)).toFixed(1) + 'px');
      }
    });
    if (connection) {
      const rect = connection.parentElement.getBoundingClientRect();
      connection.style.setProperty('--connection', Math.max(0, Math.min(1, (innerHeight - rect.top) / (rect.height * .78))));
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
  function stop() {
    animations.forEach(animation => animation.cancel()); animations.clear();
    targets.forEach(element => { element.style.removeProperty('--drift'); element.style.removeProperty('transform'); });
    connection?.style.removeProperty('--connection');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function updateMotion() {
    stop();
    motionButton?.setAttribute('aria-pressed', String(still()));
    if (motionButton) motionButton.textContent = still() ? 'Animations réduites' : 'Réduire les animations';
    schedule();
  }
  motionButton?.addEventListener('click', () => {
    body.classList.toggle('quiet');
    try { sessionStorage.setItem('fabio-quiet', String(body.classList.contains('quiet'))); } catch (_) {}
    updateMotion();
  });
  reduce.addEventListener('change', updateMotion);

  // Select white/black against the continuous grayscale gradient, measuring the full text box.
  function contrast() {
    if (!body.classList.contains('home-light')) return;
    const height = body.getBoundingClientRect().height;
    const stops = [[0, 8], [.2, 34], [.4, 97], [.6, 168], [.8, 232], [1, 255]];
    const luminance = value => (value /= 255) <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    function gray(progress) {
      for (let i = 1; i < stops.length; i++) {
        if (progress <= stops[i][0]) return stops[i - 1][1] + (stops[i][1] - stops[i - 1][1]) * (progress - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      }
      return 255;
    }
    all('main h2,main p,main .caption,main .view,main .text-link,main .scroll').forEach(element => {
      if (element.closest('.hero-copy,.universe-portal,.approach-transition,.artist-opening,.essay-chapter:nth-child(odd),.universe-hero,.artist-portrait,.contact-section')) return;
      const rect = element.getBoundingClientRect();
      const low = luminance(gray((rect.top + scrollY) / height));
      const high = luminance(gray((rect.bottom + scrollY) / height));
      const white = 1.05 / (high + .05), black = (low + .05) / .05;
      const backing = Math.max(white, black) < 4.5;
      element.style.color = backing ? 'black' : white > black ? 'white' : 'black';
      element.style.backgroundColor = backing ? 'white' : '';
    });
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { contrast(); schedule(); }, { passive: true });
  addEventListener('load', () => { contrast(); schedule(); });
  addEventListener('pageshow', () => { targets.forEach(element => observer?.observe(element)); contrast(); schedule(); });
  addEventListener('pagehide', () => { observer?.disconnect(); stop(); });
  contrast(); updateMotion();
})();

// Contact is intentionally inactive until an approved server endpoint is configured.
document.querySelector('#contact-form')?.addEventListener('submit', event => event.preventDefault());

/* V2.1: validated editorial titles on navigation and detail pages. */
(()=>{const works=window.FABIO_WORKS||[];for(const w of works){const id=String(w.asset).padStart(2,'0');document.querySelectorAll('nav a[href="vue-'+id+'.html"]').forEach(a=>a.textContent=w.title);if(location.pathname.endsWith('/vue-'+id+'.html')){const h=document.querySelector('.detail-grid h1'),p=document.querySelector('.detail-grid .lede');if(h)h.textContent=w.title;if(p)p.textContent=w.description;document.title=w.title+' — FABIO ART';}}})();

/* V2.1: pointer-controlled spotlight; disabled for reduced motion. */
(()=>{const hero=document.querySelector('.home-light .hero');if(!hero||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;hero.addEventListener('pointermove',e=>{if(document.body.classList.contains('quiet')||matchMedia('(prefers-reduced-motion:reduce)').matches)return;const r=hero.getBoundingClientRect();hero.style.setProperty('--spot-x',(e.clientX-r.left)+'px');hero.style.setProperty('--spot-y',(e.clientY-r.top)+'px');},{passive:true});})();

/* V2.1: gallery captions use the same approved titles. */
(()=>{for(const w of window.FABIO_WORKS||[]){const id=String(w.asset).padStart(2,'0');document.querySelectorAll('.work a[href="vue-'+id+'.html"] .caption span').forEach(el=>el.textContent=w.title);}})();

/* TEST: le defilement pilote le ruban, sans boucle d'animation permanente. */
(()=>{const section=document.querySelector('.fabio-ribbon-section'),track=section?.querySelector('.fabio-ribbon-track');if(!track)return;const reduced=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:700px)');let pending=false;function update(){pending=false;if(reduced.matches||mobile.matches||document.body.classList.contains('quiet')){track.style.removeProperty('--ribbon-x');return}const r=section.getBoundingClientRect(),range=Math.max(1,r.height+innerHeight),progress=Math.max(0,Math.min(1,(innerHeight-r.top)/range)),overflow=Math.max(0,track.scrollWidth-innerWidth);track.style.setProperty('--ribbon-x',(-overflow*progress).toFixed(1)+'px')}function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduced.addEventListener('change',schedule);mobile.addEventListener('change',schedule);document.querySelector('#motion')?.addEventListener('click',schedule);update()})();

/* TEST — mouvements controles par le pointeur et le defilement. */
(()=>{const depth=document.querySelector('.fabio-depth-demo'),expand=document.querySelector('.fabio-expand-demo'),layer=document.querySelector('.fabio-layer-demo');if(!depth&&!expand&&!layer)return;const reduce=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');let pending=false;const enabled=()=>!reduce.matches&&!document.body.classList.contains('quiet');if(depth){depth.addEventListener('pointermove',e=>{if(!enabled()||!fine.matches)return;const r=depth.getBoundingClientRect(),x=((e.clientX-r.left)/r.width-.5)*65,y=((e.clientY-r.top)/r.height-.5)*45;depth.querySelectorAll('.fabio-depth-card').forEach(card=>{const k=Number.parseFloat(getComputedStyle(card).getPropertyValue('--depth-factor'))||1;card.style.setProperty('--depth-x',(x*k).toFixed(1)+'px');card.style.setProperty('--depth-y',(y*k).toFixed(1)+'px')})},{passive:true});depth.addEventListener('pointerleave',()=>depth.querySelectorAll('.fabio-depth-card').forEach(card=>{card.style.removeProperty('--depth-x');card.style.removeProperty('--depth-y')}))}function paint(){pending=false;const ok=enabled();if(expand){const r=expand.getBoundingClientRect(),p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height*.4)));expand.style.setProperty('--expand-width',ok?(68+32*p).toFixed(1)+'%':'90%')}if(layer){const r=layer.getBoundingClientRect(),p=Math.max(-1,Math.min(1,(r.top+r.height/2-innerHeight/2)/innerHeight));const title=layer.querySelector('.fabio-layer-stage h2'),photo=layer.querySelector('.fabio-layer-stage a');if(title)title.style.setProperty('--layer-text',ok?(p*65).toFixed(1)+'px':'0px');if(photo)photo.style.setProperty('--layer-photo',ok?(-p*36).toFixed(1)+'px':'0px')}}function schedule(){if(!pending){pending=true;requestAnimationFrame(paint)}}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduce.addEventListener('change',schedule);document.querySelector('#motion')?.addEventListener('click',schedule);paint()})();

/* TEST — fondu pilotable au clavier, a la souris ou au toucher. */
(()=>{const range=document.getElementById('fabio-parker-range'),box=document.querySelector('.fabio-parker-comparison');if(!range||!box)return;function update(){box.style.setProperty('--parker-mix',(Number(range.value)/100).toFixed(2))}range.addEventListener('input',update);update()})();
