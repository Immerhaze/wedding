'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * RingAuto360 (PNG sequence, mobile-optimized)
 *
 * - Adaptive frames/FPS on small screens and when prefers-reduced-motion.
 * - Starts animating right after priming 2–3 frames (no need to wait for all).
 * - Pauses when offscreen or tab is hidden.
 * - Skips redundant <img>.src assignments to reduce churn on iOS.
 *
 * Usage:
 * <RingAuto360 folder="/assets/ring" prefix="ring" frames={96} ext="png" fps={30} />
 */
export default function RingAuto360({
  folder = '/assets/ring',
  prefix = 'ring',
  startIndex = 1,
  frames = 96,
  ext = 'png',
  fps = 24,
  width = '100%',
  height = '100%',
  alt = 'Rotating ring',
  className = '',
  autoplay = true,
}) {
  // Normalize width/height to CSS strings
  const norm = (v) => (typeof v === 'number' ? `${v}px` : v);

  // ---- Adaptive perf knobs (computed on mount & on media changes) ----
  const [effective, setEffective] = useState(() => ({
    frames,
    fps: Math.max(1, fps),
  }));

  useEffect(() => {
    const mSmall = window.matchMedia?.('(max-width: 640px)');
    const mReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');

    const recalc = () => {
      const isSmall = !!mSmall?.matches;
      const prefersReduced = !!mReduce?.matches;

      // Dial down on small screens; even more if the user prefers reduced motion
      const targetFrames = prefersReduced ? Math.min(frames, 24) : isSmall ? Math.min(frames, 48) : frames;
      const targetFps = prefersReduced ? Math.min(12, fps) : isSmall ? Math.min(18, fps) : fps;

      setEffective({
        frames: Math.max(1, targetFrames | 0),
        fps: Math.max(1, targetFps | 0),
      });
    };

    recalc();
    mSmall?.addEventListener?.('change', recalc);
    mReduce?.addEventListener?.('change', recalc);
    return () => {
      mSmall?.removeEventListener?.('change', recalc);
      mReduce?.removeEventListener?.('change', recalc);
    };
  }, [frames, fps]);

  // ---- Build sequence URLs based on effective frames ----
  const urls = useMemo(() => {
    const base = folder.replace(/\/$/, '');
    const len = Math.max(0, effective.frames);
    return Array.from({ length: len }, (_, i) => `${base}/${prefix}${startIndex + i}.${ext}`);
  }, [folder, prefix, startIndex, effective.frames, ext]);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const accRef = useRef(0);
  const frameRef = useRef(0);
  const runningRef = useRef(false);
  const visibleRef = useRef(true);
  const inViewRef = useRef(true);
  const decodedImagesRef = useRef([]);

  // ---- Start/stop helpers (no per-frame React renders) ----
  const start = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    lastTimeRef.current = 0;
    accRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    runningRef.current = false;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  // ---- Animation loop ----
  const tick = (t) => {
    if (!runningRef.current) return;
    const interval = 1000 / Math.max(1, effective.fps);

    if (!lastTimeRef.current) lastTimeRef.current = t;

    // If page hidden or offscreen, keep the rAF but skip work
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
        const next = (frameRef.current + steps) % len;
        if (next !== frameRef.current) {
          frameRef.current = next;
          const tag = imgRef.current;
          const decoded = decodedImagesRef.current[next];
          if (tag) {
            const nextSrc = decoded?.src || urls[next];
            // Avoid redundant src changes (important on iOS)
            if (tag.src !== nextSrc) tag.src = nextSrc;
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  // ---- Preload & prime decode (start animation ASAP) ----
  useEffect(() => {
    let cancelled = false;
    decodedImagesRef.current = [];

    if (!urls.length) return;

    const prime = [0, 1 % urls.length, (urls.length - 1) % urls.length];
    const primeSet = new Set(prime);

    const loadOne = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = src;
        // decode() may reject on some browsers; fail-soft
        img.decode?.().catch(() => {}).finally(() => resolve(img));
      });

    (async () => {
      // Prime 2–3 frames first
      const primeImgs = await Promise.all(prime.map((i) => loadOne(urls[i])));
      if (cancelled) return;

      // Store primed frames
      primeImgs.forEach((img, idx) => (decodedImagesRef.current[prime[idx]] = img));

      // Set initial frame & launch animation immediately (don’t wait for all)
      if (imgRef.current) imgRef.current.src = urls[0];
      if (autoplay) {
        start();
      }

      // Load the rest lazily in the background
      await Promise.all(
        urls.map(async (u, i) => {
          if (primeSet.has(i)) return;
          const img = await loadOne(u);
          if (!cancelled) decodedImagesRef.current[i] = img;
        })
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [urls, autoplay]);

  // ---- Page/tab visibility + viewport visibility ----
  useEffect(() => {
    const onVis = () => {
      visibleRef.current = !document.hidden;
      // Reset time accumulator so we don’t “catch up” too hard after tab switch
      if (visibleRef.current) {
        lastTimeRef.current = 0;
        accRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const target = containerRef.current || imgRef.current;
    if (!target || !('IntersectionObserver' in window)) {
      inViewRef.current = true;
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        inViewRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.01, rootMargin: '120px' } // generous prefetch window
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => stop();
  }, []);

  const style = {
    width: norm(width),
    height: norm(height),
    display: 'inline-block',
    userSelect: 'none',
    // Hint to the browser that the <img> content changes frequently
    contain: 'strict',
  };

  return (
    <div ref={containerRef} className={className} style={style} role="img" aria-label={alt}>
      <img
        ref={imgRef}
        alt={alt}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          pointerEvents: 'none',
          // Help iOS avoid accidental long-press / selection
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      />
    </div>
  );
}
