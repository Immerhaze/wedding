'use client'

import React, { useEffect, useState } from 'react'

export default function NavBar() {
  const [dateLabel, setDateLabel] = useState('') // avoid SSR mismatch

  // Format wedding date once mounted
  useEffect(() => {
    try {
      const fmt = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      let formatted = fmt.format(new Date('2026-03-07'))
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
      setDateLabel(formatted)
    } catch {
      setDateLabel('07/03/2026')
    }
  }, [])

  return (
   <header
  className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/90"
  style={{
    paddingTop: 'max(env(safe-area-inset-top), 0px)',
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // refuerzo por si falla Tailwind
  }}
  role="banner"
>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="h-14 sm:h-16 flex items-center justify-between">
          
          {/* LEFT SIDE - Signature */}
          <span className="text-white text-sm sm:text-base font-semibold tracking-wide select-none">
            Con <span className="text-red-400">❤️</span> por Nicolás
          </span>

          {/* RIGHT SIDE - Scrolling wedding date */}
        {/* RIGHT SIDE - Smooth infinite marquee */}
<div className="relative w-48 sm:w-64 overflow-hidden">
  {/* Fade edges */}
  <div className="pointer-events-none absolute inset-0 z-10 " />

  {/* Marquee wrapper (double content for seamless loop) */}
  <div className="flex whitespace-nowrap animate-marquee-smooth">
    <span className="mx-4 text-white font-semibold text-sm sm:text-base tracking-wide">
      {dateLabel} — {dateLabel} — {dateLabel} — 
    </span>
    <span className="mx-4 text-white font-semibold text-sm sm:text-base tracking-wide">
      {dateLabel} — {dateLabel} — {dateLabel} — 
    </span>
  </div>
</div>


        </nav>
      </div>
    </header>
  )
}
