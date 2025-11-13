'use client';
import { useEffect, useRef } from 'react';

export default function RingPngSequence({
  folder = '/assets/ring',
  prefix = 'ring',
  frames = 96,
  ext = 'png',
  fps = 24,
  width = '100%',
  height = '100%',
  className = '',
  alt = 'Rotating ring',
}) {
  const imgRef = useRef(null);
  const frameRef = useRef(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);

  const urlsRef = useRef([]);

  useEffect(() => {
    const base = folder.replace(/\/$/, '');
    urlsRef.current = Array.from(
      { length: frames },
      (_, i) => `${base}/${prefix}${i + 1}.${ext}`
    );
  }, [folder, prefix, frames, ext]);

  useEffect(() => {
    let running = true;

    const interval = 1000 / fps;

    const tick = (t) => {
      if (!running) return;
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = t - lastTimeRef.current;
      if (dt >= interval) {
        lastTimeRef.current = t;
        const urls = urlsRef.current;
        if (urls.length && imgRef.current) {
          frameRef.current = (frameRef.current + 1) % urls.length;
          imgRef.current.src = urls[frameRef.current];
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fps]);

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        objectFit: 'contain',
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
