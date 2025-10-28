'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function Gallery({
  initialPhotos = [],
  title = 'Guest Gallery',
  onUpload, // opcional; si no lo pasas, usamos POST /api/guest-photos
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(photos.length === 0);
  const inputRef = useRef(null);

  const openPicker = () => inputRef.current?.click();

  // ===== util: compresión local antes de subir =====
  async function compressImage(file, maxSide = 2000, quality = 0.82) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    const { width, height } = img;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const cw = Math.round(width * scale);
    const ch = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, cw, ch);
    URL.revokeObjectURL(url);

    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    );
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

  // ===== Carga inicial (si no vienen initialPhotos) =====
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

  // ===== Auto-refresh de URLs firmadas (evita expiración mientras navegan) =====
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

  // ===== handler de subida =====
  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;

    try {
      setBusy(true);
      const blob = await compressImage(f);
      const compressed = new File([blob], `guest_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // pinta un “temp” local mientras sube
      const localURL = URL.createObjectURL(compressed);
      const temp = { id: `temp_${Date.now()}`, src: localURL };
      setPhotos((p) => [temp, ...p]);

      const saved = await doUpload(compressed); // {id, src}
      setPhotos((p) => [saved, ...p.filter((x) => x.id !== temp.id)]);
      URL.revokeObjectURL(localURL);
    } catch (err) {
      console.error(err);
      alert('No se pudo procesar la foto. Inténtalo otra vez.');
      // limpia el temp si quedó
      setPhotos((p) => p.filter((x) => !x.id.startsWith('temp_')));
    } finally {
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
    <section id="guest-photos" className="relative w-full bg-[#0a0a0a] text-neutral-200 py-16 md:py-24">
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
                  style={{ fontSize: '' }}
                >
                  <img
                    src={ph.src}
                    alt="Guest photo"
                    loading="lazy"
                    className="block w-full h-auto object-cover select-none grayscale-[10%] hover:grayscale-0 transition duration-300 will-change-transform"
                    style={{ contentVisibility: 'auto' }}
                    onError={async () => {
                      // Si una firmada caducó individualmente, intentamos refrescar solo esta.
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

      {/* FAB solo móvil */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={openPicker}
        className="md:hidden fixed bottom-5 right-5 z-50 rounded-full px-5 py-4 shadow-xl border border-white/20 bg-white/90 text-black active:scale-95 transition"
        aria-label="Subir una foto"
        disabled={busy}
      >
        {busy ? 'Procesando…' : 'Subir foto'}
      </button>
    </section>
  );
}
