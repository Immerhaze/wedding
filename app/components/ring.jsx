import React, { useEffect, useMemo, useRef } from "react";

/**
 * Ultra-smooth 360° image player (imperative, no per-frame React re-render).
 * Fully responsive when placed inside a sized container (width/height 100%).
 */
export default function RingAuto360({
  folder = "/assets/ring",
  prefix = "ring",
  startIndex = 1,
  frames = 96,
  ext = "png",
  fps = 24,
  width = "100%",   // ✅ por defecto toma el 100% del contenedor
  height = "100%",  // ✅ por defecto toma el 100% del contenedor
  alt = "Rotating ring",
  className = "",
  autoplay = true,
}) {
  // Normalize width/height to CSS strings
  const norm = (v) => (typeof v === "number" ? `${v}px` : v);

  const urls = useMemo(() => {
    const base = folder.replace(/\/$/, "");
    const len = Math.max(0, frames);
    return Array.from({ length: len }, (_, i) => `${base}/${prefix}${startIndex + i}.${ext}`);
  }, [folder, prefix, startIndex, frames, ext]);

  const imgRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const accRef = useRef(0);
  const frameRef = useRef(0);
  const runningRef = useRef(false);
  const visibleRef = useRef(true);
  const inViewRef = useRef(true);
  const decodedImagesRef = useRef([]);

  // Preload & decode
  useEffect(() => {
    let cancelled = false;
    decodedImagesRef.current = [];

    async function loadAll() {
      if (!urls.length) return;

      const prime = [0, 1 % urls.length, (urls.length - 1) % urls.length];
      const primeSet = new Set(prime);

      const loadOne = (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.loading = "eager";
          img.src = src;
          img.decode?.().catch(() => {}).finally(() => resolve(img));
        });

      const primeImgs = await Promise.all(prime.map((i) => loadOne(urls[i])));
      if (cancelled) return;
      primeImgs.forEach((img, idx) => (decodedImagesRef.current[prime[idx]] = img));

      await Promise.all(
        urls.map(async (u, i) => {
          if (primeSet.has(i)) return;
          const img = await loadOne(u);
          if (!cancelled) decodedImagesRef.current[i] = img;
        })
      );
      if (cancelled) return;

      if (imgRef.current) imgRef.current.src = urls[0];
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [urls]);

  // rAF loop
  useEffect(() => {
    if (!urls.length) return;
    const interval = 1000 / Math.max(1, fps);

    const tick = (t) => {
      if (!runningRef.current) return;
      if (!lastTimeRef.current) lastTimeRef.current = t;

      if (!visibleRef.current || !inViewRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;
      accRef.current += dt;

      if (accRef.current >= interval) {
        const steps = Math.floor(accRef.current / interval);
        accRef.current -= steps * interval;

        const len = urls.length;
        if (len > 0) {
          frameRef.current = (frameRef.current + steps) % len;
          const tag = imgRef.current;
          const decoded = decodedImagesRef.current[frameRef.current];
          if (tag) tag.src = decoded?.src || urls[frameRef.current];
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const start = () => {
      if (rafRef.current == null) {
        runningRef.current = true;
        lastTimeRef.current = 0;
        accRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      runningRef.current = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const onVis = () => {
      visibleRef.current = !document.hidden;
      if (visibleRef.current && autoplay) lastTimeRef.current = 0;
    };
    document.addEventListener("visibilitychange", onVis);

    const target = imgRef.current?.parentElement || imgRef.current;
    let observer;
    if (target && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          inViewRef.current = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.01, rootMargin: "100px" }
      );
      observer.observe(target);
    } else {
      inViewRef.current = true;
    }

    if (autoplay) start();

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      observer?.disconnect();
      stop();
    };
  }, [urls, fps, autoplay]);

  const style = {
    width: norm(width),
    height: norm(height),
    display: "inline-block",
    userSelect: "none",
    willChange: "contents",
  };

  return (
    <div className={className} style={style} role="img" aria-label={alt}>
      <img
        ref={imgRef}
        alt={alt}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
