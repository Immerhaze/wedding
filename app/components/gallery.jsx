'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const GUEST_UPLOAD_ENABLED = true;

// ── Static wedding photos (served from /public, no Supabase needed) ──
// To add more: copy file to public/assets/weddingpics/ and add an entry here.
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

// ── EXIF orientation helper (for iPhone uploads) ──
async function getJpegOrientation(file) {
  if (!/jpe?g$/i.test(file.name || '')) return 1;
  const buf = await file.slice(0, 128 * 1024).arrayBuffer();
  const view = new DataView(buf);
  if (view.getUint16(0, false) !== 0xFFD8) return 1;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset, false); offset += 2;
    const size   = view.getUint16(offset, false); offset += 2;
    if (marker === 0xFFE1) {
      if (view.getUint32(offset, false) !== 0x45786966) return 1;
      const tiffOff = offset + 6;
      const little  = view.getUint16(tiffOff, false) === 0x4949;
      const getU16  = (p) => view.getUint16(p, little);
      const getU32  = (p) => view.getUint32(p, little);
      const firstIFD = tiffOff + getU32(tiffOff + 4);
      const entries  = getU16(firstIFD);
      for (let i = 0; i < entries; i++) {
        const p = firstIFD + 2 + i * 12;
        if (getU16(p) === 0x0112) return getU16(p + 8) || 1;
      }
      return 1;
    } else if ((marker & 0xFFF0) !== 0xFFE0) {
      break;
    } else {
      offset += size - 2;
    }
  }
  return 1;
}

function drawOriented(ctx, img, w, h, orientation) {
  switch (orientation) {
    case 6: ctx.canvas.width = h; ctx.canvas.height = w; ctx.translate(h, 0); ctx.rotate(Math.PI / 2);  ctx.drawImage(img, 0, 0, w, h); break;
    case 8: ctx.canvas.width = h; ctx.canvas.height = w; ctx.translate(0, w); ctx.rotate(-Math.PI / 2); ctx.drawImage(img, 0, 0, w, h); break;
    case 3: ctx.canvas.width = w; ctx.canvas.height = h; ctx.translate(w, h); ctx.rotate(Math.PI);      ctx.drawImage(img, 0, 0, w, h); break;
    default: ctx.canvas.width = w; ctx.canvas.height = h; ctx.drawImage(img, 0, 0, w, h);
  }
}

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.82) {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => resolve(b), type, quality);
    } else {
      const dataURL = canvas.toDataURL(type, quality);
      const bin = atob(dataURL.split(',')[1]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      resolve(new Blob([arr], { type }));
    }
  });
}

// ── Decorative diamond SVG ──
function Diamond() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#c9a84c]/60 flex-shrink-0">
      <rect x="1" y="1" width="10" height="10" transform="rotate(45 6 6)" stroke="currentColor" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

export default function Gallery({ onUpload }) {
  const [guestPhotos, setGuestPhotos]   = useState([]);
  const photos = [...guestPhotos, ...STATIC_PHOTOS];
  const [busy, setBusy]                 = useState(false);
  const [lightboxIdx, setLightboxIdx]   = useState(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [gridVisible, setGridVisible]   = useState(false);
  const [showFab, setShowFab]           = useState(false);

  const inputRef  = useRef(null);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef   = useRef(null);

  // ── Lightbox keyboard navigation ──
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape')     setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i + 1) % photos.length);
      if (e.key === 'ArrowLeft')  setLightboxIdx((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, photos.length]);

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

  // ── Load guest photos from Supabase (fails silently — static photos always show) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/guest-photos', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const { photos: list } = await res.json();
        if (cancelled) return;
        setGuestPhotos((list || []).map((p) => ({ id: p.id, src: p.signedUrl, created_at: p.created_at })));
      } catch {
        // Supabase unavailable — static photos still show
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Refresh Supabase signed URLs every 8 min ──
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/guest-photos', { cache: 'no-store' });
        if (!res.ok) return;
        const { photos: list } = await res.json();
        const refreshed = Object.fromEntries((list || []).map((p) => [p.id, p.signedUrl]));
        setGuestPhotos((prev) => prev.map((ph) => refreshed[ph.id] ? { ...ph, src: refreshed[ph.id] } : ph));
      } catch {}
    }, 8 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Show/hide mobile FAB ──
  useEffect(() => {
    const handler = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setShowFab(rect.top < window.innerHeight / 2 && rect.bottom > 80);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);
    return () => { window.removeEventListener('scroll', handler); window.removeEventListener('resize', handler); };
  }, []);

  // ── Image compression + EXIF correction for uploads ──
  async function compressImage(file, maxSide = 2000, quality = 0.82) {
    const orientation = await getJpegOrientation(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await new Promise((resolve, reject) => {
      if (img.decode) {
        img.decode().then(resolve).catch(() => { img.onload = resolve; img.onerror = reject; });
      } else {
        img.onload = resolve; img.onerror = reject;
      }
    });
    const w = img.naturalWidth  || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    ctx.imageSmoothingQuality = 'high';
    drawOriented(ctx, img, Math.round(w * scale), Math.round(h * scale), orientation);
    URL.revokeObjectURL(url);
    return canvasToBlob(canvas, 'image/jpeg', quality);
  }

  const defaultUpload = useMemo(() => async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/guest-photos', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Upload failed');
    const saved = json.saved;
    const re = await fetch('/api/guest-photos', { cache: 'no-store' });
    const { photos: list } = await re.json();
    const hit = (list || []).find((p) => p.id === saved.id);
    return { id: saved.id, src: hit?.signedUrl || '', created_at: saved.created_at };
  }, []);

  const doUpload = onUpload || defaultUpload;

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    let localURL;
    try {
      setBusy(true);
      const blob = await compressImage(f);
      const compressed = new File([blob], `guest_${Date.now()}.jpg`, { type: 'image/jpeg' });
      localURL = URL.createObjectURL(compressed);
      const temp = { id: `temp_${Date.now()}`, src: localURL };
      setGuestPhotos((p) => [temp, ...p]);
      const saved = await doUpload(compressed);
      setGuestPhotos((p) => [saved, ...p.filter((x) => x.id !== temp.id)]);
    } catch (err) {
      console.error(err);
      alert('No se pudo procesar la foto. Inténtalo otra vez.');
      setGuestPhotos((p) => p.filter((x) => !x.id.startsWith('temp_')));
    } finally {
      if (localURL) URL.revokeObjectURL(localURL);
      setBusy(false);
    }
  }

  // ── Lightbox helpers ──
  const closeLightbox = () => setLightboxIdx(null);
  const prevPhoto = (e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + photos.length) % photos.length); };
  const nextPhoto = (e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % photos.length); };

  return (
    <section
      id="gallery"
      ref={sectionRef}
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
          {photos.map((ph, idx) => (
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
                onError={async () => {
                  if (ph.id.startsWith('static_')) return;
                  try {
                    const res = await fetch('/api/guest-photos', { cache: 'no-store' });
                    if (!res.ok) return;
                    const { photos: list } = await res.json();
                    const hit = (list || []).find((p) => p.id === ph.id);
                    if (hit?.signedUrl) {
                      setGuestPhotos((prev) => prev.map((x) => x.id === ph.id ? { ...x, src: hit.signedUrl } : x));
                    }
                  } catch {}
                }}
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
            {lightboxIdx + 1} &nbsp;/&nbsp; {photos.length}
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
            src={photos[lightboxIdx]?.src}
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

      {/* Upload file input */}
      {GUEST_UPLOAD_ENABLED && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Mobile FAB */}
      {GUEST_UPLOAD_ENABLED && showFab && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2
            px-5 py-3.5 rounded-full
            bg-white text-black text-sm font-medium tracking-wide
            shadow-[0_8px_32px_rgba(0,0,0,0.6)]
            border border-white/10
            active:scale-95 transition-transform disabled:opacity-50"
          aria-label="Subir una foto"
        >
          {busy ? 'Procesando…' : '+ Foto'}
        </button>
      )}
    </section>
  );
}
