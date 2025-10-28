import React, { useEffect, useMemo, useRef, useState } from "react";

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
}) {
  // Build URLs once
  const urls = useMemo(() => {
    const base = folder.replace(/\/$/, "");
    return Array.from({ length: frames }, (_, i) => `${base}/${prefix}${startIndex + i}.${ext}`);
  }, [folder, prefix, startIndex, frames, ext]);

  const [frame, setFrame] = useState(0);

  // Preload images (quick neighbor-first, then the rest)
  const preloaded = useRef(new Map());
  const preload = (idx) => {
    if (preloaded.current.has(idx)) return;
    const img = new Image();
    img.src = urls[idx];
    preloaded.current.set(idx, img);
  };

  useEffect(() => {
    if (urls.length === 0) return;
    // prime current + neighbors
    preload(0);
    preload(1 % urls.length);
    preload((urls.length - 1) % urls.length);

    const idle = ((cb) => setTimeout(0));
    const id = idle(() => {
      for (let i = 0; i < urls.length; i++) preload(i);
    });
    return () => {
      const cancel = ((tid) => clearTimeout(tid));
      cancel(id);
    };
  }, [urls]);

  // Autoplay using rAF at target FPS
  useEffect(() => {
    if (urls.length <= 1) return;
    let raf= null;
    let last = 0;
    const interval = 1000 / fps;

    const tick = (t) => {
      if (!last) last = t;
      const dt = t - last;
      if (dt >= interval) {
        last = t;
        setFrame((f) => (f + 1) % urls.length);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf == null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
    };

    const onVis = () => {
      if (document.hidden) stop();
      else {
        last = 0; // reset cadence
        start();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, [urls.length, fps]);

  const style= {
    width,
    height,
    display: "inline-block",
    userSelect: "none",
  };

  return (
    <div className={className} style={style} role="img" aria-label={alt}>
      <img
        src={urls[frame]}
        alt={alt}
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
