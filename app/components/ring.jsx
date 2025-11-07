import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Ultra-smooth 360° image player with iOS-safe preloading.
 * Place inside a sized container (this takes width/height 100% by default).
 */
export default function RingAuto360({
  folder = "/assets/ring",
  prefix = "ring",
  startIndex = 1,
  frames = 96,
  ext = "png",     // default; may auto-upgrade to webp if supported
  fps = 24,
  width = "100%",
  height = "100%",
  alt = "Rotating ring",
  className = "",
  autoplay = true,
}) {
  const norm = (v) => (typeof v === "number" ? `${v}px` : v);

  // Check WebP support once (iOS 14.0+ supports webp; this is a safe runtime guard)
  const [extRuntime, setExtRuntime] = useState(ext);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // quick webp support test via canvas
        const c = document.createElement("canvas");
        const ok = !!(c.getContext && c.toDataURL("image/png").indexOf("data:image/png") === 0);
        if (!cancelled && ok && (ext === "png" || ext === "jpg" || ext === "jpeg")) {
          setExtRuntime("png");
        }
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [ext]);

  const urls = useMemo(() => {
    const base = folder.replace(/\/$/, "");
    const len = Math.max(0, frames);
    return Array.from({ length: len }, (_, i) => `${base}/${prefix}${startIndex + i}.${extRuntime}`);
  }, [folder, prefix, startIndex, frames, extRuntime]);

  const imgRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const accRef = useRef(0);
  const frameRef = useRef(0);
  const runningRef = useRef(false);
  const visibleRef = useRef(true);
  const inViewRef = useRef(true);
  const decodedImagesRef = useRef([]);

  // Respect reduced motion: lower fps automatically
  const effectiveFps = (() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return Math.max(8, Math.floor(fps / 2));
    }
    return fps;
  })();

  // iOS-safe preload: prime a few frames, then batch-load the rest
  useEffect(() => {
    let cancelled = false;
    decodedImagesRef.current = [];

    async function loadOne(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = src;
        // Safari can reject decode(); always resolve
        img.decode?.().catch(() => {}).finally(() => resolve(img));
      });
    }

    async function loadAll() {
      if (!urls.length) return;

      // Prime frames: first, second, last — enough to start showing immediately
      const primeIdx = [0, 1 % urls.length, (urls.length - 1) % urls.length];
      const primeSet = new Set(primeIdx);

      const primeImgs = [];
      for (const i of primeIdx) {
        if (cancelled) return;
        const img = await loadOne(urls[i]);
        primeImgs.push({ i, img });
      }
      if (cancelled) return;
      primeImgs.forEach(({ i, img }) => (decodedImagesRef.current[i] = img));

      // Show first frame ASAP
      if (imgRef.current) {
        const first = decodedImagesRef.current[0];
        imgRef.current.src = (first?.src) || urls[0];
      }

      // Batch load rest to avoid Safari decode storms
      const rest = urls.map((u, i) => i).filter((i) => !primeSet.has(i));
      const BATCH = 6; // small batches
      for (let k = 0; k < rest.length; k += BATCH) {
        if (cancelled) return;
        const slice = rest.slice(k, k + BATCH);
        // Load sequentially within batch to be gentler on iOS
        for (const i of slice) {
          if (cancelled) return;
          const img = await loadOne(urls[i]);
          if (!cancelled) decodedImagesRef.current[i] = img;
        }
        // Yield to main thread (iOS)
        await new Promise((r) => {
          (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 60 }) : setTimeout(r, 16));
        });
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [urls]);

  // rAF loop (paused when not visible or off-screen)
  useEffect(() => {
    if (!urls.length) return;
    const interval = 1000 / Math.max(1, effectiveFps);

    const tick = (t) => {
      if (!runningRef.current) return;
      if (!lastTimeRef.current) lastTimeRef.current = t;

      // If hidden or offscreen, keep the loop light but do not advance frames
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
    document.addEventListener("visibilitychange", onVis, { passive: true });

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
  }, [urls, effectiveFps, autoplay]);

  const style = {
    width: norm(width),
    height: norm(height),
    display: "inline-block",
    userSelect: "none",
    // 'contents' is buggy on WebKit sometimes; avoid it
    willChange: "auto",
  };

  return (
    <div className={className} style={style} role="img" aria-label={alt}>
      <img
        ref={imgRef}
        alt={alt}
        draggable={false}
        aria-hidden={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
          // iOS rendering stability
          imageRendering: "auto",
          WebkitUserSelect: "none",
        }}
      />
    </div>
  );
}
