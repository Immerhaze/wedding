'use client'

import { useRef, useState, useEffect } from 'react'
import NavBar from './components/navbar'
import RingAuto360 from './components/ring'
import Gallery from './components/gallery'

function ScrollableIframe({ src, title }) {
  const iframeRef = useRef(null)
  const [active, setActive] = useState(false)

  return (
    <div className="relative w-full h-full min-h-[60svh] rounded-2xl overflow-hidden shadow-xl">
      {/* Game iframe */}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
        loading="lazy"
        style={{
          overflow: 'hidden',
          pointerEvents: active ? 'auto' : 'none',
        }}
      />

      {/* Overlay when not active */}
      {!active && (
        <button
          type="button"
          className="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-[1px] flex items-center justify-center"
          onClick={() => setActive(true)}
          aria-label="Click to activate game"
        >
          <span className="text-base sm:text-lg md:text-xl font-semibold text-white bg-black/60 px-4 py-2 rounded-lg shadow">
            Click to Play
          </span>
        </button>
      )}

      {/* Exit button when active */}
      {active && (
        <button
          onClick={() => setActive(false)}
          className="absolute top-3 right-3 z-10 bg-black/70 text-white px-3 py-1 rounded-md hover:bg-black/90 text-sm"
        >
          Exit
        </button>
      )}
    </div>
  )
}

export default function Home() {
  const handleStart = () => {
    const el = document.getElementById('game')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // --- 🔽 Ring del mismo tamaño que el “&” (ligeramente menor para no cubrir) ---
  const ampRef = useRef(null)
  const [ringPx, setRingPx] = useState(0)

  useEffect(() => {
    if (!ampRef.current) return
    const SCALE = 0.92 // más pequeño que el “&” para minimizar solape
    const el = ampRef.current

    const measure = () => {
      const r = el.getBoundingClientRect()
      const size = Math.ceil(Math.max(r.width, r.height) * SCALE)
      setRingPx(size)
    }

    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize, { passive: true })

    let ro
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(measure)
      ro.observe(el)
    }

    return () => {
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
    }
  }, [])
  // --- 🔼 ---

  return (
    <main className="w-screen max-w-screen overflow-x-hidden">
      <NavBar />

      {/* HERO */}
      <section
        className="relative w-full min-h-[100svh] sm:min-h-screen flex items-center justify-center overflow-hidden"
        aria-label="Hero"
      >
        {/* Decorative background */}
        <div aria-hidden className="absolute inset-0 -z-10">
          {/* Gradient base */}
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_60%),linear-gradient(180deg,#0b0b10_0%,#151521_50%,#0b0b10_100%)]" />
          {/* Glow accents */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl opacity-40 bg-[#f8d776]" />
        </div>

        <div className="relative flex flex-col items-center gap-4 text-center px-4">
          <h1 className="leading-none font-semibold tracking-tight">
            <span className="block text-[clamp(5rem,9rem,12rem)] text-white drop-shadow">Sofia</span>
            <span
              ref={ampRef}
              className="block text-[clamp(4rem,7rem,10rem)] text-white/90 drop-shadow leading-none"
            >
              &
            </span>
            <span className="block text-[clamp(5rem,9rem,12rem)] text-white drop-shadow">Joaquin</span>
          </h1>
        </div>

        {/* 360° Ring behind text, responsive & sized to “&” */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="relative opacity-90"
            style={{
              width: ringPx ? `${ringPx}px` : undefined,
              height: ringPx ? `${ringPx}px` : undefined,
              // límites sanos para extremos
              minWidth: '120px',
              minHeight: '120px',
              maxWidth: '70vw',
              maxHeight: '70vw',
            }}
          >
            <RingAuto360
              className="absolute inset-0"
              folder="/assets/ring"
              prefix="ring"
              startIndex={1}
              frames={96}
              ext="png"
              fps={30}
              width="100%"
              height="100%"
              alt="Gold ring rotating 360°"
            />
          </div>
        </div>
      </section>

      {/* GAME */}
    {/* GAME */}
<section
  id="game"
  className="relative w-full min-h-[100svh] sm:min-h-screen px-0 py-10 sm:py-14 overflow-x-clip overflow-y-hidden"
  aria-label="Game"
>
  {/* Decorative background for game section */}
  <div aria-hidden className="absolute inset-0 -z-10">
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b0b10_0%,#0f172a_40%,#0b0b10_100%)]" />
    <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_1.2px)] [background-size:24px_24px]" />
  </div>

  {/* Texto/ayuda debajo, centrado y con padding normal */}
  <div className="mx-auto max-w-4xl px-4 mt-8 text-white/90">
    <h2 className="text-2xl sm:text-3xl font-semibold text-center">Play “Memory Walk”</h2>
    <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/80 text-center">
      Haga Click en el area del juego para activar los controles. Presione "salir" para liberar el mouse.
      Solo debe usar las flechas para jugar
    </p>
  </div>

  {/* FULL-BLEED WRAPPER: hace que el iframe use 100vw sin scroll horizontal */}
  <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen max-w-none">
    <div className="w-screen h-[min(80svh,85vh)] sm:h-[min(85svh,88vh)]">
      <ScrollableIframe src="/game/index.html" title="Memory Walk" />
    </div>
  </div>

</section>

      <section className="relative w-full px-4 py-12 sm:py-16">
      
        <Gallery />
      </section>
    </main>
  )
}
