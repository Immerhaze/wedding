'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import NavBar from './components/navbar';
import RingAuto360 from './components/ring';
import Gallery from './components/gallery';

// Robust iOS / iPadOS detection (for copy text only)
const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function ScrollableIframe({ src, title }) {
  const iframeRef = useRef(null);
  const [active, setActive] = useState(false);

  // ESC to exit on desktop
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === 'Escape' && setActive(false);
    window.addEventListener('keydown', onKey, { passive: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  // Focus frame when activated
  useEffect(() => {
    if (!active || !iframeRef.current) return;
    const t = setTimeout(() => {
      try {
        iframeRef.current.focus();
      } catch {}
    }, 30);
    return () => clearTimeout(t);
  }, [active]);

  // NEW: Listen for game-finished message from iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data === "GAME_FINISHED") {
        setActive(false); // Restore overlay + scrolling
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const onBlurFrame = useCallback(() => {
    // optionally setActive(false)
  }, []);

  return (
    <div
      className={[
        "relative w-full h-full rounded-2xl overflow-hidden shadow-xl",
        "min-h-[60vh]",
        "supports-[min-height:60svh]:min-h-[60svh]",
        "supports-[min-height:60dvh]:min-h-[60dvh]",
        active ? "overscroll-contain touch-pan-x touch-pan-y" : "",
      ].join(" ")}
      style={{
        WebkitOverflowScrolling: "auto",
        overscrollBehavior: active ? "contain" : undefined,
      }}
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
          overflow: "hidden",
          pointerEvents: active ? "auto" : "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          touchAction: active ? "none" : "auto",
          overscrollBehavior: "none",
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


export default function Home() {
  const ampRef = useRef(null);
  const [ringPx, setRingPx] = useState(0);
  const [loading, setLoading] = useState(true);
const [progress, setProgress] = useState(0);

// Fake real preloading logic (you can later preload images)
useEffect(() => {
  let p = 0;
  const interval = setInterval(() => {
    p += 2;
    if (p >= 100) {
      p = 100;
      clearInterval(interval);
      setTimeout(() => setLoading(false), 300); // smooth fade
    }
    setProgress(p);
  }, 40);

  return () => clearInterval(interval);
}, []);


  // Size the 360° ring to the "&" glyph
  useEffect(() => {
    if (!ampRef.current) return;
    const SCALE = 0.92;
    const el = ampRef.current;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const size = Math.ceil(Math.max(r.width, r.height) * SCALE);
      setRingPx(size);
    };

    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize, { passive: true });

    let ro;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, []);

  return (
    
    <main className="w-screen max-w-screen overflow-x-hidden">
      {/* LOADING SCREEN */}
{/* FULLSCREEN LOADING SCREEN */}
{loading && (
  <div
    className="
      fixed inset-0 z-[9999] flex items-center justify-center
      bg-[#0b0b10] transition-opacity duration-700
    "
  >
    <div className="relative w-64 h-64 flex items-center justify-center">
      
      {/* ROTATING CIRCLE TEXT */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 animate-spin-slow">
        <defs>
          <path
            id="loaderCircle"
            d="
              M 100, 100
              m -75, 0
              a 75,75 0 1,1 150,0
              a 75,75 0 1,1 -150,0
            "
          />
        </defs>

        <text fill="white">
          <textPath
            href="#loaderCircle"
            className="tracking-[0.3em] text-[14px]"
          >
            SOFIA • JOAQUIN • SOFIA • JOAQUIN • SOFIA • JOAQUIN •
          </textPath>
        </text>
      </svg>

      {/* CENTER PERCENTAGE */}
      <span className="text-white text-3xl font-semibold">
        {progress}%
      </span>

    </div>
  </div>
)}

      <NavBar />

      {/* HERO */}
      <section
        className={[
          'relative w-full flex items-center justify-center overflow-hidden',
          // full-height fallbacks: vh → svh → dvh
          'min-h-[100vh]',
          'supports-[min-height:100svh]:min-h-[100svh]',
          'supports-[min-height:100dvh]:min-h-[100dvh]',
        ].join(' ')}
        aria-label="Hero"
      >
        {/* Background */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_60%),linear-gradient(180deg,#0b0b10_0%,#151521_50%,#0b0b10_100%)]" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl opacity-40 bg-[#f8d776]" />
        </div>

       <div className="relative flex flex-col items-center gap-2 text-center px-4">
  <h1 className="leading-none font-semibold tracking-tight">
    {/* Sofia */}
    <span
      className="
        block text-white drop-shadow
        text-[4rem]      /* mobile */
        sm:text-[5rem]   /* bigger phones */
        md:text-[5rem]     /* tablets */
        lg:text-[7rem]     /* desktop */
        xl:text-[9rem]     /* big screens */
      "
    >
      Sofia
    </span>

    {/* & */}
    <span
      ref={ampRef}
      className="
        block text-white/90 drop-shadow leading-none
         text-[4rem]      /* mobile */
        sm:text-[5rem]   /* bigger phones */
        md:text-[5rem]     /* tablets */
        lg:text-[7rem]     /* desktop */
        xl:text-[9rem]     /* big screens */
      "
    >
      &
    </span>

    {/* Joaquin */}
    <span
      className="
        block text-white drop-shadow
        text-[4rem]      /* mobile */
        sm:text-[5rem]   /* bigger phones */
        md:text-[5rem]     /* tablets */
        lg:text-[7rem]     /* desktop */
        xl:text-[9rem]     /* big screens */
      "
    >
      Joaquin
    </span>
  </h1>
</div>



        {/* 360° Ring */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="relative opacity-90"
            style={{
              width: ringPx ? `${ringPx}px` : undefined,
              height: ringPx ? `${ringPx}px` : undefined,
              minWidth: '120px',
              minHeight: '120px',
              maxWidth: '70vw',
              maxHeight: '70vw',
            }}
          >
            <RingAuto360
  src="/assets/ring/ring360.webm"
  alt="Gold ring rotating 360°"
  className="absolute inset-0"
/>

          </div>
        </div>
      </section>

      {/* GAME */}
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
        {/* Background */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b0b10_0%,#0f172a_40%,#0b0b10_100%)]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_1.2px)] [background-size:24px_24px]" />
        </div>

        <div className="mx-auto max-w-4xl px-4 mt-8 mb-16 text-white/90">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center">Play “Memory Walk”</h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/80 text-center">
            Toca el área del juego para activar los controles. Presiona “Exit” para liberar el puntero.
            Usa solo las flechas para jugar.
          </p>
        </div>

        {/* Full-bleed wrapper to keep exact 100vw without side scroll */}
        <div className="relative left-1/2 -translate-x-1/2 w-[100vw]">
          <div
            className={[
              'w-[100vw]',
              // Height clamp with fallbacks
              'h-[min(80vh,85vh)]',
              'supports-[height:85svh]:h-[min(80vh,85svh)]',
              'supports-[height:88dvh]:h-[min(80vh,88dvh)]',
              'sm:h-[min(85vh,88vh)]',
              'sm:supports-[height:88svh]:h-[min(85svh,88svh)]',
              'sm:supports-[height:90dvh]:h-[min(85vh,90dvh)]',
            ].join(' ')}
          >
            <ScrollableIframe src="/game/index.html" title="Memory Walk" />
          </div>
        </div>
      </section>

      {/* GALLERY */}
     <section className="relative w-full px-4 py-12 sm:py-16 bg-black">
  <Gallery />
</section>

    </main>
  );
}
