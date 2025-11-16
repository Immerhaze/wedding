'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

// 👇 Flip this to true on the wedding day
const GUEST_UPLOAD_ENABLED = false;

// --- EXIF ORIENTATION (JPEG) ---
async function getJpegOrientation(file) {
  // Solo JPEG; otras extensiones no traen este flag útil
  if (!/jpe?g$/i.test(file.name || '')) return 1;
  const buf = await file.slice(0, 128 * 1024).arrayBuffer();
  const view = new DataView(buf);

  // SOI 0xFFD8
  if (view.getUint16(0, false) !== 0xFFD8) return 1;

  let offset = 2;
  const len = view.byteLength;
  while (offset + 4 <= len) {
    const marker = view.getUint16(offset, false); offset += 2;
    const size = view.getUint16(offset, false);   offset += 2;
    if (marker === 0xFFE1) { // APP1 -> EXIF
      // "Exif\0\0"
      if (view.getUint32(offset, false) !== 0x45786966) return 1;
      const tiffOff = offset + 6;
      const little = view.getUint16(tiffOff, false) === 0x4949;
      const getU16 = (p) => view.getUint16(p, little);
      const getU32 = (p) => view.getUint32(p, little);

      const firstIFD = tiffOff + getU32(tiffOff + 4);
      const entries = getU16(firstIFD);
      for (let i = 0; i < entries; i++) {
        const p = firstIFD + 2 + i * 12;
        const tag = getU16(p);
        if (tag === 0x0112) { // Orientation
          const val = getU16(p + 8);
          return val || 1;
        }
      }
      return 1;
    } else if ((marker & 0xFFF0) !== 0xFFE0) {
      // Llegamos a otro segmento (no APPn)
      break;
    } else {
      offset += size - 2;
    }
  }
  return 1;
}

function drawOriented(ctx, img, w, h, orientation) {
  // Ajusta canvas + transform según EXIF
  // Orientaciones comunes: 1 (normal), 6 (90° CW), 8 (270°), 3 (180°)
  switch (orientation) {
    case 6: // 90 cw
      ctx.canvas.width = h;
      ctx.canvas.height = w;
      ctx.translate(h, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, 0, 0, w, h);
      break;
    case 8: // 270 cw
      ctx.canvas.width = h;
      ctx.canvas.height = w;
      ctx.translate(0, w);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(img, 0, 0, w, h);
      break;
    case 3: // 180
      ctx.canvas.width = w;
      ctx.canvas.height = h;
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, 0, 0, w, h);
      break;
    default: // 1
      ctx.canvas.width = w;
      ctx.canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
  }
}

// toBlob fallback para Safari viejito
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

export default function Gallery({
  initialPhotos = [],
  title = 'Galeria de Momentos',
  onUpload, // opcional; si no lo pasas, usamos POST /api/guest-photos
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(photos.length === 0);
  const inputRef = useRef(null);

  // Scroll / visibility
  const sectionRef = useRef(null);
  const [showFab, setShowFab] = useState(false);

  const openPicker = () => {
    if (!GUEST_UPLOAD_ENABLED) return;
    inputRef.current?.click();
  };

  // ===== compresión + corrección de orientación (iPhone) =====
  async function compressImage(file, maxSide = 2000, quality = 0.82) {
    // Orientación EXIF
    const orientation = await getJpegOrientation(file);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    // Safari-safe decode
    await new Promise((resolve, reject) => {
      if (img.decode) {
        img.decode().then(resolve).catch(() => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
        });
      } else {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
      }
    });

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const cw = Math.round(width * scale);
    const ch = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    ctx.imageSmoothingQuality = 'high';

    drawOriented(ctx, img, cw, ch, orientation);
    URL.revokeObjectURL(url);

    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    return blob;
  }

  // ===== API helper por defecto (si no pasas onUpload) =====
  const defaultUpload = useMemo(() => {
    return async (file) => {
      const form = new FormData();
      form.append('file', file);

      // 1) Subir
      const res = await fetch('/api/guest-photos', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Upload failed');

      const saved = json.saved; // { id, path, created_at }

      // 2) Refetch para conseguir la signedUrl de ese id
      const re = await fetch('/api/guest-photos', { cache: 'no-store' });
      const { photos: list } = await re.json();
      const hit = (list || []).find((p) => p.id === saved.id);

      return {
        id: saved.id,
        src: hit?.signedUrl || '',
        created_at: saved.created_at,
      };
    };
  }, []);

  const doUpload = onUpload || defaultUpload;

  // ===== Carga inicial =====
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/guest-photos', { cache: 'no-store' });
        const { photos: list } = await res.json();
        if (cancelled) return;
        const mapped = (list || []).map((p) => ({
          id: p.id,
          src: p.signedUrl,
          created_at: p.created_at,
        }));
        setPhotos(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (initialPhotos.length === 0) load();
    return () => { cancelled = true; };
  }, [initialPhotos.length]);

  // ===== Auto-refresh de URLs firmadas =====
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/guest-photos', { cache: 'no-store' });
        const { photos: list } = await res.json();
        const refreshed = {};
        (list || []).forEach((p) => { refreshed[p.id] = p.signedUrl; });
        setPhotos((prev) =>
          prev.map((ph) => (refreshed[ph.id] ? { ...ph, src: refreshed[ph.id] } : ph))
        );
      } catch (e) {
        console.warn('refresh signed URLs failed', e);
      }
    }, 8 * 60 * 1000); // 8 min
    return () => clearInterval(interval);
  }, []);

  // ===== Scroll watcher para mostrar/ocultar botón =====
  useEffect(() => {
    const handler = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const mid = window.innerHeight / 2;

      const shouldShow = rect.top < mid && rect.bottom > 80;
      setShowFab(shouldShow);
    };

    handler(); // al cargar

    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);

    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, []);

  // ===== handler de subida =====
  async function handleFileChange(e) {
    if (!GUEST_UPLOAD_ENABLED) return;

    const f = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;

    let localURL;
    try {
      setBusy(true);
      const blob = await compressImage(f);
      const compressed = new File([blob], `guest_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // pinta un “temp” local mientras sube
      localURL = URL.createObjectURL(compressed);
      const temp = { id: `temp_${Date.now()}`, src: localURL };
      setPhotos((p) => [temp, ...p]);

      const saved = await doUpload(compressed); // {id, src}
      setPhotos((p) => [saved, ...p.filter((x) => x.id !== temp.id)]);
    } catch (err) {
      console.error(err);
      alert('No se pudo procesar la foto. Inténtalo otra vez.');
      setPhotos((p) => p.filter((x) => !x.id.startsWith('temp_')));
    } finally {
      if (localURL) URL.revokeObjectURL(localURL);
      setBusy(false);
    }
  }

  const Grain = () => (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );

  return (
    <section
      id="guest-photos"
      ref={sectionRef}
      className="relative w-full bg-black text-neutral-200 py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4">
        <header className="mb-8 md:mb-12">
          <h2 className="text-center font-serif text-3xl md:text-5xl tracking-tight">{title}</h2>
          <p className="mt-2 text-center text-sm md:text-base text-neutral-400">
            Momentos capturados por ustedes 🖤
          </p>
        </header>

        <div className="relative">
          <Grain />

          {loading ? (
            <div className="py-16 grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 md:h-64 bg-white/5 animate-pulse rounded-sm" />
              ))}
            </div>
          ) : (
            <div
              className="
                columns-2 md:columns-3
                [column-gap:0] [column-fill:_balance]
              "
              style={{ fontSize: 0 }}
            >
              {photos.length === 0 && (
                <div className="text-center py-16 text-neutral-400" style={{ fontSize: '' }}>
                  Aún no hay fotos.
                </div>
              )}

              {photos.map((ph) => (
                <figure
                  key={ph.id}
                  className="mb-0 break-inside-avoid relative overflow-hidden group"
                  style={{
                    fontSize: '',
                    breakInside: 'avoid',
                    WebkitColumnBreakInside: 'avoid', // <- iOS Safari masonry estable
                  }}
                >
                  <img
                    src={ph.src}
                    alt="Guest photo"
                    loading="lazy"
                    className="block w-full h-auto object-cover select-none grayscale-[10%] hover:grayscale-0 transition duration-300 will-change-transform"
                    style={{ contentVisibility: 'auto' }}
                    onError={async () => {
                      try {
                        const res = await fetch('/api/guest-photos', { cache: 'no-store' });
                        const { photos: list } = await res.json();
                        const hit = (list || []).find((p) => p.id === ph.id);
                        if (hit?.signedUrl) {
                          setPhotos((prev) =>
                            prev.map((x) => (x.id === ph.id ? { ...x, src: hit.signedUrl } : x))
                          );
                        }
                      } catch {}
                    }}
                  />
                  <figcaption className="hidden md:flex items-center justify-center pointer-events-none absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/45 text-[11px] tracking-wide opacity-0 group-hover:opacity-100 transition">
                    #SofiayJoa
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB solo móvil + solo si la funcionalidad está activada */}
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

      {GUEST_UPLOAD_ENABLED && showFab && (
        <button
          onClick={openPicker}
          className="md:hidden fixed bottom-5 right-5 z-50 rounded-full px-5 py-4 shadow-xl border border-white/20 bg-white/90 text-black active:scale-95 transition"
          aria-label="Subir una foto"
          disabled={busy}
        >
          {busy ? 'Procesando…' : 'Subir foto'}
        </button>
      )}
    </section>
  );
}
