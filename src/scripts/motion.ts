// Movimiento de la web: scroll suave, apariciones, vídeo, carrusel y transiciones.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
root.classList.add('motion-ready');
const motion = root.classList.contains('js-motion');
const finePointer = matchMedia('(pointer: fine)').matches;
const EASE = 'expo.out';

/* ---------- Cortina entre páginas ---------- */
const curtain = document.querySelector<HTMLElement>('.curtain')!;
function leaveTo(href: string) {
  try { sessionStorage.setItem('sp-nav', '1'); } catch {}
  if (!motion) { location.href = href; return; }
  gsap.set(curtain, { transformOrigin: 'bottom', pointerEvents: 'auto' });
  gsap.to(curtain, { scaleY: 1, duration: 0.7, ease: 'expo.inOut', onComplete: () => { location.href = href; } });
}
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('a');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  const samePage = url.pathname === location.pathname;
  if (url.hash && samePage) {
    e.preventDefault();
    const el = document.querySelector(url.hash);
    if (el) lenis ? lenis.scrollTo(el as HTMLElement, { duration: 1.6 }) : el.scrollIntoView();
    return;
  }
  e.preventDefault();
  leaveTo(url.href);
});
function arrive(): Promise<void> {
  return new Promise((resolve) => {
    if (!root.classList.contains('is-arriving')) return resolve();
    gsap.set(curtain, { transformOrigin: 'top', scaleY: 1 });
    root.classList.remove('is-arriving');
    gsap.to(curtain, { scaleY: 0, duration: 0.9, ease: 'expo.inOut', delay: 0.05, onComplete: resolve });
  });
}
addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(curtain, { scaleY: 0 }); root.classList.remove('is-arriving'); } });

/* ---------- Scroll suave ---------- */
let lenis: Lenis | null = null;
if (motion) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el) requestAnimationFrame(() => lenis!.scrollTo(el as HTMLElement, { immediate: true }));
  }
}

/* ---------- Precarga (solo portada, una vez por sesión) ---------- */
function preloader(): Promise<void> {
  const pre = document.querySelector<HTMLElement>('[data-preloader]');
  if (!pre) return Promise.resolve();
  let visto = false;
  try { visto = sessionStorage.getItem('sp-pre') === '1'; sessionStorage.setItem('sp-pre', '1'); } catch {}
  if (visto || !motion) { pre.remove(); return Promise.resolve(); }
  root.classList.remove('is-arriving');
  lenis?.stop();
  const n = pre.querySelector<HTMLElement>('[data-count]')!;
  const bar = pre.querySelector<HTMLElement>('[data-bar]')!;
  const o = { v: 0 };
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: () => { pre.remove(); lenis?.start(); resolve(); } })
      .to(o, { v: 100, duration: 2, ease: 'power2.inOut', onUpdate: () => { n.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
      .to(bar, { scaleX: 1, duration: 2, ease: 'power2.inOut' }, 0)
      .to(pre.querySelectorAll('[data-pre-fade]'), { opacity: 0, duration: 0.4 }, '+=0.15')
      .to(pre, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.1');
  });
}

/* ---------- Apariciones ---------- */
function intro() {
  if (!motion) return;

  // Titulares: líneas que suben desde una máscara
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const enHero = el.closest('[data-hero]');
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.lines, {
          yPercent: 110, duration: 1.4, ease: EASE, stagger: 0.09,
          delay: enHero ? 0.1 : 0,
          scrollTrigger: enHero ? undefined : { trigger: el, start: 'top 88%' },
        });
      },
    });
  });

  // Bloques que aparecen
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    const enHero = el.closest('[data-hero]');
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.2, ease: EASE,
      delay: enHero ? 0.5 + Number(el.dataset.reveal || 0) * 0.1 : Number(el.dataset.reveal || 0) * 0.08,
      scrollTrigger: enHero ? undefined : { trigger: el, start: 'top 90%' },
    });
  });

  // Párrafo que se "entinta" palabra a palabra al bajar
  document.querySelectorAll<HTMLElement>('[data-ink]').forEach((el) => {
    SplitText.create(el, {
      type: 'words', autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(self.words, { opacity: 0.14 }, {
          opacity: 1, ease: 'none', stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
        });
      },
    });
  });

  // Líneas horizontales que se dibujan
  gsap.utils.toArray<HTMLElement>('[data-draw]').forEach((el) => {
    gsap.fromTo(el, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 1.6, ease: EASE, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  // Titular del hero: cada línea sube desde su máscara
  const lineas = document.querySelectorAll('[data-hero] .ln-i');
  gsap.set('[data-hero] .hero-h', { visibility: 'visible' });
  if (lineas.length) gsap.fromTo(lineas, { yPercent: 110 }, { yPercent: 0, duration: 1.5, ease: EASE, stagger: 0.1, delay: 0.1 });

  // Piezas de la galería: se descubren de abajo arriba y la pantalla sube un poco
  gsap.utils.toArray<HTMLElement>('[data-card-reveal]').forEach((el) => {
    const st = { trigger: el, start: 'top 88%' };
    gsap.fromTo(el, { clipPath: 'inset(22% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: EASE, scrollTrigger: st });
    gsap.from(el.querySelector('.pantalla'), { y: 70, opacity: 0, duration: 1.6, ease: EASE, delay: 0.1, clearProps: 'transform,opacity', scrollTrigger: st });
  });

  // Paralaje genérico
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---------- Hero: el vídeo sale de la píldora del titular y se abre a pantalla completa ---------- */
function heroVideo() {
  const hero = document.querySelector<HTMLElement>('[data-hero-pin]');
  if (!hero || !motion) return;
  const vid = hero.querySelector<HTMLElement>('[data-hero-vid]')!;
  const pill = hero.querySelector<HTMLElement>('[data-pill]')!;
  const video = vid.querySelector('video');
  const cinta = hero.querySelector('[data-cinta]');
  const txt = hero.querySelector('.hero-txt');
  const linea = pill.closest<HTMLElement>('.ln-i')!;
  // Recorte que coincide exactamente con la píldora (medida sin la animación de entrada)
  const clip = () => {
    const prev = linea.style.transform;
    linea.style.transform = 'none';
    const p = pill.getBoundingClientRect(), h = hero.getBoundingClientRect();
    linea.style.transform = prev;
    return `inset(${p.top - h.top}px ${h.right - p.right}px ${h.bottom - p.bottom}px ${p.left - h.left}px round ${p.height / 2}px)`;
  };
  gsap.set(vid, { clipPath: clip() });
  gsap.to(vid, { opacity: 1, duration: 0.9, delay: 1.2, ease: 'power2.out' });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: () => '+=' + innerHeight * 1.4, pin: true, scrub: 1, invalidateOnRefresh: true },
  });
  tl.fromTo(vid, { clipPath: () => clip() }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1, ease: 'power2.inOut' }, 0)
    .fromTo(video, { scale: 1.35 }, { scale: 1, duration: 1, ease: 'power2.inOut' }, 0)
    .to(txt, { scale: 0.92, opacity: 0.4, duration: 1, ease: 'power2.inOut' }, 0)
    .to({}, { duration: 0.4 });
  if (cinta) tl.to(cinta, { autoAlpha: 1, duration: 0.3 }, 0.8);
}

/* ---------- Cabecera: color según el fondo que tiene debajo; se oculta al bajar ---------- */
const head = document.querySelector<HTMLElement>('[data-head]');
let ultimoY = scrollY;
let pendiente = false;
function cabecera() {
  pendiente = false;
  if (!head) return;
  let tono = 'light';
  for (const el of document.elementsFromPoint(innerWidth / 2, 34)) {
    if (head.contains(el)) continue;
    const t = el.closest<HTMLElement>('[data-tone]');
    if (t) { tono = t.dataset.tone!; break; }
  }
  root.classList.toggle('head-dark', tono === 'dark');
  const y = scrollY;
  if (Math.abs(y - ultimoY) > 6) { root.classList.toggle('head-hidden', y > ultimoY && y > 200); ultimoY = y; }
}
const pedirCabecera = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(cabecera); } };
addEventListener('scroll', pedirCabecera, { passive: true });
addEventListener('resize', pedirCabecera);

/* ---------- Sala de trabajos: la pista se mueve de lado con el scroll o arrastrando ---------- */
function sala() {
  const sec = document.querySelector<HTMLElement>('[data-sala]');
  if (!sec || !motion) return;
  const pista = sec.querySelector<HTMLElement>('[data-pista]')!;
  const cartas = gsap.utils.toArray<HTMLElement>(sec.querySelectorAll('[data-carta]'));
  const ins = cartas.map((c) => c.querySelector<HTMLElement>('[data-carta-in]')!);
  const suelo = sec.querySelector<HTMLElement>('[data-suelo]');
  const nEl = sec.querySelector<HTMLElement>('[data-sala-n]');
  const mm = gsap.matchMedia();

  // Vídeo de tarjeta: se reproduce UNA vez cuando la tarjeta llega al centro; al salir se queda en el último
  // fotograma (igual que el póster). Sin bucle: el salto del final al principio se notaría.
  const vids = cartas.map((c) => c.querySelector<HTMLVideoElement>('[data-carta-video]'));
  let enJuego = -1;
  const enfocar = (k: number) => {
    if (k === enJuego) return;
    const prev = enJuego >= 0 ? vids[enJuego] : null;
    if (prev) { prev.pause(); if (prev.duration) prev.currentTime = prev.duration; }
    enJuego = k;
    const v = k >= 0 ? vids[k] : null;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
  };

  mm.add('(min-width: 1000px)', () => {
    sec.classList.add('live');
    // Distancia entre la primera y la última tarjeta: así la última acaba centrada
    const recorrido = () => {
      const ini = cartas[0], fin = cartas[cartas.length - 1];
      return fin.offsetLeft + fin.offsetWidth / 2 - (ini.offsetLeft + ini.offsetWidth / 2);
    };
    const factor = 1.25; // píxeles de scroll por píxel de desplazamiento lateral
    const tween = gsap.to(pista, {
      x: () => -recorrido(), ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + recorrido() * factor, pin: true, scrub: 0.8, invalidateOnRefresh: true },
    });

    // Giro 3D de cada tarjeta según su distancia al centro de la pantalla
    let actual = -1;
    const pintar = () => {
      const x = gsap.getProperty(pista, 'x') as number;
      let cerca = 0, min = Infinity;
      cartas.forEach((c, k) => {
        const centro = c.offsetLeft + c.offsetWidth / 2 + x;
        const d = (centro - innerWidth / 2) / innerWidth; // -1 … 1 aprox.
        const a = Math.abs(d);
        if (a < min) { min = a; cerca = k; }
        ins[k].style.transform = `perspective(1600px) translateZ(${-a * 260}px) rotateY(${gsap.utils.clamp(-48, 48, -d * 52)}deg)`;
        ins[k].style.opacity = String(gsap.utils.clamp(0.35, 1, 1.15 - a * 0.9));
      });
      if (suelo) suelo.style.backgroundPosition = `${x * 0.6}px 0`;
      if (nEl && cerca !== actual) { actual = cerca; nEl.textContent = String(cerca + 1).padStart(2, '0'); }
      enfocar(min < 0.12 ? cerca : -1);
    };
    gsap.ticker.add(pintar);

    // Arrastrar con el ratón mueve el scroll (y con él la pista)
    let arrastrando = false, movido = 0, x0 = 0, s0 = 0;
    const st = tween.scrollTrigger!;
    const abajo = (e: PointerEvent) => {
      if (e.button !== 0) return;
      arrastrando = true; movido = 0; x0 = e.clientX; s0 = scrollY;
      sec.classList.add('arrastrando');
    };
    const mover = (e: PointerEvent) => {
      if (!arrastrando) return;
      const dx = e.clientX - x0;
      movido = Math.max(movido, Math.abs(dx));
      const destino = gsap.utils.clamp(st.start, st.end, s0 - dx * factor);
      lenis ? lenis.scrollTo(destino, { immediate: true }) : scrollTo(0, destino);
    };
    const arriba = () => { arrastrando = false; sec.classList.remove('arrastrando'); };
    const clic = (e: MouseEvent) => { if (movido > 6) { e.preventDefault(); e.stopPropagation(); } };
    sec.addEventListener('pointerdown', abajo);
    addEventListener('pointermove', mover);
    addEventListener('pointerup', arriba);
    sec.addEventListener('click', clic, true);
    sec.addEventListener('dragstart', (e) => e.preventDefault());

    return () => {
      gsap.ticker.remove(pintar);
      sec.removeEventListener('pointerdown', abajo);
      removeEventListener('pointermove', mover);
      removeEventListener('pointerup', arriba);
      sec.removeEventListener('click', clic, true);
      ins.forEach((el) => { el.style.transform = ''; el.style.opacity = ''; });
      sec.classList.remove('live');
    };
  });

  // Móvil: la pista se desliza de forma nativa; el contador sigue a la tarjeta centrada
  mm.add('(max-width: 999px)', () => {
    const contar = () => {
      const centro = pista.scrollLeft + pista.clientWidth / 2;
      let cerca = 0, min = Infinity;
      cartas.forEach((c, k) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - centro);
        if (d < min) { min = d; cerca = k; }
      });
      if (nEl) nEl.textContent = String(cerca + 1).padStart(2, '0');
      enfocar(min < cartas[cerca].offsetWidth * 0.25 ? cerca : -1);
    };
    pista.addEventListener('scroll', contar, { passive: true });
    contar();
    return () => pista.removeEventListener('scroll', contar);
  });
}

/* ---------- Cursor con texto ("Arrastra" / "Ver caso") ---------- */
function cursor() {
  const c = document.querySelector<HTMLElement>('[data-cursor]');
  if (!c || !finePointer || !motion) return;
  const label = c.querySelector('span')!;
  root.classList.add('cursor-on');
  const xTo = gsap.quickTo(c, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
  let visible = false;
  addEventListener('mousemove', (e) => {
    xTo(e.clientX); yTo(e.clientY);
    const zona = (e.target as Element).closest<HTMLElement>('[data-cursor-text]');
    if (zona) {
      if (label.textContent !== zona.dataset.cursorText) label.textContent = zona.dataset.cursorText!;
      if (!visible) { visible = true; gsap.to(c, { scale: 1, opacity: 1, duration: 0.45, ease: EASE }); }
    } else if (visible) {
      visible = false; gsap.to(c, { scale: 0.4, opacity: 0, duration: 0.35, ease: 'power3.out' });
    }
  });
}

/* ---------- Arranque ---------- */
(async () => {
  await document.fonts.ready;
  await Promise.all([arrive(), preloader()]);
  intro();
  heroVideo();
  sala();
  cursor();
  ScrollTrigger.refresh();
  cabecera();
})();
