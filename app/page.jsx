'use client'

import { useRef, useState, useef } from "react";
import NavBar from "./components/navbar";
import RingAuto360 from "./components/ring";
import Gallery from "./components/gallery";

export default function Home() {
  const ref = useRef()
  const handleStart = () => {
    document.getElementById("game").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };




function ScrollableIframe({ src, title }) {
  const iframeRef = useRef(null);
  const [active, setActive] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* The game iframe */}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="w-full h-full border-0"
        style={{
          overflow: "hidden",
          pointerEvents: active ? "auto" : "none",
        }}
      />

      {/* Overlay when not active */}
      {!active && (
        <div
          className="absolute inset-0 cursor-pointer bg-transparent flex items-center justify-center"
          onClick={() => setActive(true)}
        >
          <span className="text-lg font-semibold text-white bg-black/60 px-4 py-2 rounded">
            Click to Play
          </span>
        </div>
      )}

      {/* Exit button when active */}
      {active && (
        <button
          onClick={() => setActive(false)}
          className="absolute top-2 right-2 z-10 bg-black/70 text-white px-3 py-1 rounded hover:bg-black/90"
        >
          Exit
        </button>
      )}
    </div>
  );
}





  return (
<main className="max-w-screen w-screen min-h-screen overflow-x-hidden">
  <NavBar />

  {/* HERO */}
  <section className="w-full h-screen flex items-center justify-center">
    <div className="text-center">
      <span className="block text-[clamp(2rem,15vw,10rem)]">Sofia</span>
      <span className="block text-[clamp(2rem,15vw,10rem)]">&</span>
      <span className="block text-[clamp(2rem,15vw,10rem)]">Joaquin</span>
    </div>
    <RingAuto360
      className="absolute self-center"
      folder="/assets/ring"
      prefix="ring"
      startIndex={1}
      frames={96}
      ext="png"
      fps={30}
      width={"60%"}
      height={"60%"}
      alt="Gold ring rotating 360°"
    />
  </section>

  {/* GAME */}
  <section className="game w-full h-screen bg-green-400" id="game">
    <div className="game__card bg-green-800 h-full">
      <ScrollableIframe src="/game/index.html" title="Memory Walk" />
    </div>
  </section>

  <Gallery/>
</main>

  );
}
