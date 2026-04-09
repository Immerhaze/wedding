'use client';

import React, { useEffect, useRef, useState } from 'react';

// ── Static wedding photos (served from /public) ──
const STATIC_PHOTOS = [
  { id: 'static_1',  src: '/assets/weddingpics/03-06-26-1.jpg' },
  { id: 'static_2',  src: '/assets/weddingpics/03-06-26-12.jpg' },
  { id: 'static_3',  src: '/assets/weddingpics/03-06-26-13.jpg' },
  { id: 'static_4',  src: '/assets/weddingpics/03-06-26-22.jpg' },
  { id: 'static_5',  src: '/assets/weddingpics/03-06-26-23.jpg' },
  { id: 'static_6',  src: '/assets/weddingpics/03-06-26-24.jpg' },
  { id: 'static_7',  src: '/assets/weddingpics/03-06-26-26.jpg' },
  { id: 'static_8',  src: '/assets/weddingpics/03-06-26-31.jpg' },
  { id: 'static_9',  src: '/assets/weddingpics/03-06-26-33.jpg' },
  { id: 'static_10', src: '/assets/weddingpics/03-06-26-34.jpg' },
  { id: 'static_11', src: '/assets/weddingpics/03-06-26-36.jpg' },
  { id: 'static_12', src: '/assets/weddingpics/03-06-26-38.jpg' },
  { id: 'static_13', src: '/assets/weddingpics/03-06-26-42.jpg' },
  { id: 'static_14', src: '/assets/weddingpics/03-06-26-48.jpg' },
  { id: 'static_15', src: '/assets/weddingpics/03-06-26-54.jpg' },
  { id: 'static_16', src: '/assets/weddingpics/03-06-26-59.jpg' },
  { id: 'static_17', src: '/assets/weddingpics/03-06-26-60.jpg' },
  { id: 'static_18', src: '/assets/weddingpics/03-06-26-62.jpg' },
  { id: 'static_19', src: '/assets/weddingpics/03-06-26-67.jpg' },
  { id: 'static_20', src: '/assets/weddingpics/03-06-26-69.jpg' },
  { id: 'static_21', src: '/assets/weddingpics/03-06-26-88.jpg' },
  { id: 'static_22', src: '/assets/weddingpics/03-06-26-95.jpg' },
  { id: 'static_23', src: '/assets/weddingpics/03-06-26-108.jpg' },
  { id: 'static_24', src: '/assets/weddingpics/03-06-26-124.jpg' },
  { id: 'static_25', src: '/assets/weddingpics/03-06-26-131.jpg' },
  { id: 'static_26', src: '/assets/weddingpics/03-06-26-132.jpg' },
  { id: 'static_27', src: '/assets/weddingpics/03-06-26-134.jpg' },
  { id: 'static_28', src: '/assets/weddingpics/03-06-26-139.jpg' },
  { id: 'static_29', src: '/assets/weddingpics/03-06-26-142.jpg' },
  { id: 'static_30', src: '/assets/weddingpics/03-06-26-146.jpg' },
  { id: 'static_31', src: '/assets/weddingpics/03-06-26-155.jpg' },
  { id: 'static_32', src: '/assets/weddingpics/03-06-26-157.jpg' },
  { id: 'static_33', src: '/assets/weddingpics/03-06-26-161.jpg' },
  { id: 'static_34', src: '/assets/weddingpics/03-06-26-165.jpg' },
  { id: 'static_35', src: '/assets/weddingpics/03-06-26-175.jpg' },
  { id: 'static_36', src: '/assets/weddingpics/03-06-26-180.jpg' },
  { id: 'static_37', src: '/assets/weddingpics/03-06-26-187.jpg' },
  { id: 'static_38', src: '/assets/weddingpics/03-06-26-206.jpg' },
  { id: 'static_39', src: '/assets/weddingpics/03-06-26-221.jpg' },
  { id: 'static_40', src: '/assets/weddingpics/03-06-26-222.jpg' },
  { id: 'static_41', src: '/assets/weddingpics/03-06-26-227.jpg' },
  { id: 'static_42', src: '/assets/weddingpics/03-06-26-229.jpg' },
];

// ── Decorative diamond SVG ──
function Diamond() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#c9a84c]/60 flex-shrink-0">
      <rect x="1" y="1" width="10" height="10" transform="rotate(45 6 6)" stroke="currentColor" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

export default function Gallery() {
  const [lightboxIdx, setLightboxIdx]   = useState(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [gridVisible, setGridVisible]   = useState(false);

  const headerRef = useRef(null);
  const gridRef   = useRef(null);

  // ── Lightbox keyboard navigation ──
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape')     setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i + 1) % STATIC_PHOTOS.length);
      if (e.key === 'ArrowLeft')  setLightboxIdx((i) => (i - 1 + STATIC_PHOTOS.length) % STATIC_PHOTOS.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx]);

  // ── Scroll lock when lightbox is open ──
  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIdx]);

  // ── Reveal header on scroll into view ──
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHeaderVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Trigger staggered photo animation when grid enters view ──
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setGridVisible(true); obs.disconnect(); } },
      { threshold: 0.02 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Lightbox helpers ──
  const closeLightbox = () => setLightboxIdx(null);
  const prevPhoto = (e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + STATIC_PHOTOS.length) % STATIC_PHOTOS.length); };
  const nextPhoto = (e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % STATIC_PHOTOS.length); };

  return (
    <section
      id="gallery"
      className="relative w-full bg-[#080808] text-neutral-200 pt-24 pb-32 overflow-hidden"
    >
      {/* Subtle grain texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Top divider line */}
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Warm ambient glow behind header */}
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.07)_0%,transparent_70%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Section Header ── */}
        <header
          ref={headerRef}
          className={`mb-20 md:mb-28 text-center transition-all duration-1000 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <p className="text-[#c9a84c] tracking-[0.55em] text-[10px] sm:text-[11px] uppercase font-light mb-6 select-none">
            Sofia &amp; Joaquin · 7 de Marzo 2026
          </p>

          <h2 className="font-serif font-light text-[3.2rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] tracking-tight leading-[1.05] mb-8">
            Nuestros{' '}
            <em className="not-italic italic font-light">Momentos</em>
          </h2>

          {/* Decorative rule */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-[#c9a84c]/40" />
            <Diamond />
            <div className="h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-[#c9a84c]/40" />
          </div>

          <p className="text-neutral-600 text-xs tracking-[0.35em] uppercase select-none">
            Una historia contada en imágenes
          </p>
        </header>

        {/* ── Masonry photo grid ── */}
        <div
          ref={gridRef}
          className="columns-2 sm:columns-2 md:columns-3 [column-fill:balance]"
          style={{ fontSize: 0, columnGap: '3px' }}
        >
          {STATIC_PHOTOS.map((ph, idx) => (
            <figure
              key={ph.id}
              onClick={() => setLightboxIdx(idx)}
              className={`mb-[3px] break-inside-avoid relative overflow-hidden cursor-zoom-in group ${
                gridVisible ? 'animate-photo-in' : 'opacity-0'
              }`}
              style={{
                breakInside: 'avoid',
                WebkitColumnBreakInside: 'avoid',
                animationDelay: gridVisible ? `${Math.min(idx * 40, 900)}ms` : undefined,
              }}
            >
              <img
                src={ph.src}
                alt="Wedding photo"
                loading="lazy"
                className="block w-full h-auto object-cover select-none
                  brightness-90 saturate-[0.8]
                  group-hover:brightness-100 group-hover:saturate-100
                  scale-100 group-hover:scale-[1.04]
                  transition-all duration-500 ease-out will-change-transform"
                style={{ contentVisibility: 'auto' }}
              />
              {/* Hover overlay */}
              <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-400" />
            </figure>
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center animate-lb-in"
          style={{ backgroundColor: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={closeLightbox}
        >
          {/* Photo counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/30 text-[11px] tracking-[0.4em] uppercase select-none">
            {lightboxIdx + 1} &nbsp;/&nbsp; {STATIC_PHOTOS.length}
          </div>

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/90 transition-colors text-lg"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* Prev button */}
          <button
            onClick={prevPhoto}
            className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center text-white/30 hover:text-white/80 transition-colors"
            aria-label="Foto anterior"
          >
            <svg width="18" height="32" viewBox="0 0 18 32" fill="none">
              <path d="M16 2L2 16l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Photo */}
          <img
            src={STATIC_PHOTOS[lightboxIdx]?.src}
            alt="Wedding photo"
            className="max-w-[84vw] max-h-[86vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {/* Next button */}
          <button
            onClick={nextPhoto}
            className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center text-white/30 hover:text-white/80 transition-colors"
            aria-label="Foto siguiente"
          >
            <svg width="18" height="32" viewBox="0 0 18 32" fill="none">
              <path d="M2 2l14 14L2 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Keyboard hint */}
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/15 text-[10px] tracking-widest uppercase hidden sm:block select-none">
            ← → para navegar · Esc para cerrar
          </p>
        </div>
      )}
    </section>
  );
}
