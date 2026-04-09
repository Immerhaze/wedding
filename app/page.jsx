'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import NavBar from './components/navbar';
import RingAuto360 from './components/ring';
import Gallery from './components/gallery';

// ─── Game iframe wrapper (untouched) ───────────────────────────────────────
function ScrollableIframe({ src, title }) {
  const iframeRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === 'Escape' && setActive(false);
    window.addEventListener('keydown', onKey, { passive: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  useEffect(() => {
    if (!active || !iframeRef.current) return;
    const t = setTimeout(() => { try { iframeRef.current.focus(); } catch {} }, 30);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => {
    const handler = (e) => { if (e.data === 'GAME_FINISHED') setActive(false); };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const onBlurFrame = useCallback(() => {}, []);

  return (
    <div
      className={[
        'relative w-full h-full rounded-2xl overflow-hidden shadow-xl',
        'min-h-[60vh]',
        'supports-[min-height:60svh]:min-h-[60svh]',
        'supports-[min-height:60dvh]:min-h-[60dvh]',
        active ? 'overscroll-contain touch-pan-x touch-pan-y' : '',
      ].join(' ')}
      style={{ WebkitOverflowScrolling: 'auto', overscrollBehavior: active ? 'contain' : undefined }}
    >
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="w-full h-full border-0 outline-none block"
        allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write; xr-spatial-tracking; accelerometer; gyroscope"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-modals"
        allowFullScreen
        loading="eager"
        aria-live="off"
        tabIndex={active ? 0 : -1}
        style={{
          overflow: 'hidden',
          pointerEvents: active ? 'auto' : 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          touchAction: active ? 'none' : 'auto',
          overscrollBehavior: 'none',
        }}
        onBlur={onBlurFrame}
      />
      {!active && (
        <button
          type="button"
          className="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-[1px] flex items-center justify-center"
          onClick={() => setActive(true)}
          aria-label="Activar juego"
        >
          <span className="text-base sm:text-lg md:text-xl font-semibold text-white bg-black/60 px-4 py-2 rounded-lg shadow">
            Presiona para jugar
          </span>
        </button>
      )}
      {active && (
        <button
          onClick={() => setActive(false)}
          className="absolute top-3 right-3 z-10 bg-black/70 text-white px-3 py-1 rounded-md hover:bg-black/90 text-sm"
          aria-label="Salir del juego"
        >
          Salir
        </button>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const ampRef = useRef(null);
  const [ringPx, setRingPx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Loading progress
  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += 2;
      if (p >= 100) { p = 100; clearInterval(id); setTimeout(() => setLoading(false), 400); }
      setProgress(p);
    }, 40);
    return () => clearInterval(id);
  }, []);

  // Size the ring to the "&" glyph
  useEffect(() => {
    if (!ampRef.current) return;
    const el = ampRef.current;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setRingPx(Math.ceil(Math.max(r.width, r.height) * 0.92));
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    let ro;
    if ('ResizeObserver' in window) { ro = new ResizeObserver(measure); ro.observe(el); }
    return () => { window.removeEventListener('resize', measure); ro?.disconnect(); };
  }, []);

  return (
    <main className="w-screen max-w-screen overflow-x-hidden">

      {/* ══════════════════════════════════════════
          LOADING SCREEN
      ══════════════════════════════════════════ */}
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#080808]">

          {/* Outer decorative static ring */}
          <svg
            aria-hidden
            viewBox="0 0 260 260"
            className="absolute w-[260px] h-[260px] opacity-[0.12]"
          >
            <circle cx="130" cy="130" r="124" stroke="#c9a84c" strokeWidth="0.6" fill="none" />
            <circle cx="130" cy="130" r="116" stroke="#c9a84c" strokeWidth="0.3" fill="none" />
          </svg>

          {/* Spinning text ring */}
          <svg viewBox="0 0 200 200" className="absolute w-[240px] h-[240px] animate-spin-slow">
            <defs>
              <path id="loaderCircle" d="M 100,100 m -75,0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
            </defs>
            <text fill="#c9a84c" fontSize="11" letterSpacing="4">
              <textPath href="#loaderCircle">
                SOFIA • JOAQUIN • SOFIA • JOAQUIN • SOFIA • JOAQUIN •
              </textPath>
            </text>
          </svg>

          {/* Center counter */}
          <div className="relative flex flex-col items-center gap-1">
            <span className="font-serif font-light text-white/85 text-4xl sm:text-5xl tracking-widest">
              {progress}
              <span className="text-xl text-white/30 ml-0.5">%</span>
            </span>
            <span className="text-[#c9a84c]/40 text-[8px] tracking-[0.6em] uppercase select-none">
              Cargando
            </span>
          </div>
        </div>
      )}

      <NavBar />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        className={[
          'relative w-full flex items-center justify-center overflow-hidden',
          'min-h-[100vh]',
          'supports-[min-height:100svh]:min-h-[100svh]',
          'supports-[min-height:100dvh]:min-h-[100dvh]',
        ].join(' ')}
        aria-label="Hero"
      >
        {/* Background */}
        <div aria-hidden className="absolute inset-0 -z-10">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#080808_0%,#0d0d14_50%,#080808_100%)]" />
          {/* Warm radial glow (behind ring) */}
          <div className="absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_44%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
          {/* Top gold bloom */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-3xl opacity-25 bg-[#c9a84c]" />
        </div>

        {/* Names */}
        <div className="relative flex flex-col items-center text-center px-4">
          <h1 className="leading-[0.9] font-serif font-light tracking-wide">
            <span className="block text-white/95
              text-[4.2rem] sm:text-[5.5rem] md:text-[6rem] lg:text-[7.5rem] xl:text-[9.5rem]">
              Sofia
            </span>

            <span
              ref={ampRef}
              className="block italic text-[#c9a84c]/75 leading-[1.1]
                text-[4.2rem] sm:text-[5.5rem] md:text-[6rem] lg:text-[7.5rem] xl:text-[9.5rem]"
            >
              &
            </span>

            <span className="block text-white/95
              text-[4.2rem] sm:text-[5.5rem] md:text-[6rem] lg:text-[7.5rem] xl:text-[9.5rem]">
              Joaquin
            </span>
          </h1>

          {/* Date */}
          <p className="mt-7 text-[#c9a84c]/45 text-[9px] sm:text-[11px] tracking-[0.55em] uppercase font-light select-none">
            7 · 03 · 2026
          </p>
        </div>

        {/* 360° Ring */}
        <div className=" pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="relative opacity-85"
            style={{
              width:  ringPx ? `${ringPx}px` : undefined,
              height: ringPx ? `${ringPx}px` : undefined,
              minWidth: '120px', minHeight: '120px',
              maxWidth: '70vw',  maxHeight: '70vw',
            }}
          >
            <RingAuto360 src="/assets/ring/ring360.webm" alt="Gold ring rotating 360°" className="absolute inset-0" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
        >
          <svg width="16" height="9" viewBox="0 0 16 9" fill="none" className="text-[#c9a84c]/30">
            <path d="M1 1l7 7 7-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          GAME
      ══════════════════════════════════════════ */}
      <section
        id="game"
        className={[
          'relative w-full px-0 py-10 sm:py-14 overflow-x-hidden overflow-y-visible',
          'min-h-[100vh]',
          'supports-[min-height:100svh]:min-h-[100svh]',
          'supports-[min-height:100dvh]:min-h-[100dvh]',
        ].join(' ')}
        aria-label="Game"
      >
        {/* Background — kept exactly as original */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#080808_0%,#0f172a_40%,#080808_100%)]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_1.2px)] [background-size:24px_24px]" />
        </div>

        {/* Header */}
        <div className="mx-auto max-w-4xl px-4 mt-8 mb-16 text-center">
          <p className="text-[#c9a84c]/60 tracking-[0.55em] text-[9px] sm:text-[10px] uppercase font-light mb-4 select-none">
            Minijuego
          </p>
          <h2 className="font-serif font-light text-white/90 text-3xl sm:text-4xl tracking-wide">
            Memory Walk
          </h2>
          {/* Thin rule */}
          <div className="flex items-center justify-center gap-4 mt-4 mb-5">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
            <div className="w-1 h-1 rounded-full bg-[#c9a84c]/40" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-white/45 max-w-lg mx-auto">
            Toca el área del juego para activar los controles · Usa las flechas para jugar · Esc para salir
          </p>
        </div>

        {/* Iframe — completely untouched */}
        <div className="relative left-1/2 -translate-x-1/2 w-[100vw]">
          <div className={[
            'w-[100vw]',
            'h-[min(80vh,85vh)]',
            'supports-[height:85svh]:h-[min(80vh,85svh)]',
            'supports-[height:88dvh]:h-[min(80vh,88dvh)]',
            'sm:h-[min(85vh,88vh)]',
            'sm:supports-[height:88svh]:h-[min(85svh,88svh)]',
            'sm:supports-[height:90dvh]:h-[min(85vh,90dvh)]',
          ].join(' ')}>
            <ScrollableIframe src="/game/index.html" title="Memory Walk" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          GALLERY (untouched — user approved)
      ══════════════════════════════════════════ */}
      <Gallery />

    </main>
  );
}
