import React, { useEffect, useMemo, useRef } from "react";

/**
 * Ultra-smooth 360° image player (imperative, no per-frame React re-render).
 */
export default function RingAuto360({
  folder = "/assets/ring",
  prefix = "ring",
  startIndex = 1,
  frames,
  ext = "png",
  fps = 24,
  width = 360,
  height = 360,
  alt = "Rotating ring",
  className = "",
  // Optional: start/stop control
  autoplay = true,
}) {
  // Build URLs once per prop set
  const urls = useMemo(() => {
    const base = folder.replace(/\/$/, "");
    return Array.from(
      { length: frames ?? 0 },
      (_, i) => `${base}/${prefix}${startIndex + i}.${ext}`
    );
  }, [folder, prefix, startIndex, frames, ext]);

  const imgRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const accRef = useRef(0);
  const frameRef = useRef(0);
  const runningRef = useRef(false);
  const visibleRef = useRef(true);      // document visibility
  const inViewRef = useRef(true);       // intersection visibility
  const decodedImagesRef = useRef([]);  // preloaded Image objects

  // Preload & decode all frames
  useEffect(() => {
    let cancelled = false;
    decodedImagesRef.current = [];

    async function loadAll() {
      if (!urls.length) return;
      // Prime a couple of neighbors quickly
      const prime = [0, 1 % urls.length, (urls.length - 1) % urls.length];
      const primeSet = new Set(prime);

      const loadOne = (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.loading = "eager";
          img.src = src;
          img.decode?.().catch(() => {})  // decode may reject, ignore
            .finally(() => resolve(img));
        });

      // Load prime frames first
      const primeImgs = await Promise.all(prime.map(i => loadOne(urls[i])));
      if (cancelled) return;
      primeImgs.forEach((img, idx) => (decodedImagesRef.current[prime[idx]] = img));

      // Fill the rest
      const promises = [];
      for (let i = 0; i < urls.length; i++) {
        if (primeSet.has(i)) continue;
        promises.push(
          loadOne(urls[i]).then(img => {
            decodedImagesRef.current[i] = img;
          })
        );
      }
      await Promise.all(promises);
      if (cancelled) return;

      // Set initial src once preloaded at least the first frame
      const tag = imgRef.current;
      if (tag) {
        tag.src = urls[0];
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [urls]);

  // rAF loop (imperative; no setState per frame)
  useEffect(() => {
    if (!urls.length) return;
    const interval = 1000 / Math.max(1, fps);

    const tick = (t) => {
      if (!runningRef.current) return;
      if (!lastTimeRef.current) lastTimeRef.current = t;

      // If not visible or not in view, skip advancing frames
      if (!visibleRef.current || !inViewRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;
      accRef.current += dt;

      // Advance as many frames as needed to catch up
      if (accRef.current >= interval) {
        const steps = Math.floor(accRef.current / interval);
        accRef.current -= steps * interval;

        const len = urls.length;
        if (len > 0) {
          frameRef.current = (frameRef.current + steps) % len;
          const tag = imgRef.current;
          const decoded = decodedImagesRef.current[frameRef.current];
          if (tag) {
            // If decoded exists, use it; otherwise fallback to URL (still okay)
            if (decoded?.src) tag.src = decoded.src;
            else tag.src = urls[frameRef.current];
          }
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

    // Page visibility
    const onVis = () => {
      visibleRef.current = !document.hidden;
      if (visibleRef.current && autoplay) {
        // reset cadence
        lastTimeRef.current = 0;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    // Intersection (pause when off-screen)
    const target = imgRef.current?.parentElement || imgRef.current;
    let observer;
    if (target && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          inViewRef.current = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.01 }
      );
      observer.observe(target);
    } else {
      inViewRef.current = true; // fallback
    }

    if (autoplay) start();

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      observer?.disconnect();
      stop();
    };
  }, [urls, fps, autoplay]);

  const style = {
    width,
    height,
    display: "inline-block",
    userSelect: "none",
    // Helps the browser allocate compositing resources early
    willChange: "contents",
  };

  return (
    <div className={className} style={style} role="img" aria-label={alt}>
      <img
        ref={imgRef}
        alt={alt}
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
