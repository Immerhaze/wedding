'use client'

import React, { useEffect, useState } from 'react'

export default function NavBar() {
  const [dateLabel, setDateLabel] = useState('') // avoid SSR mismatch

  useEffect(() => {
    try {
      // Chile timezone + Spanish formatting
      const fmt = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const str = fmt.format(new Date())
      // Capitaliza la primera letra del mes
      setDateLabel(str.charAt(0).toUpperCase() + str.slice(1))
    } catch {
      // Fallback simple si Intl falla
      const d = new Date()
      setDateLabel(`${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`)
    }
  }, [])

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur"
      style={{
        // Respeta el notch en iOS
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
      }}
      role="banner"
    >
      {/* Skip link (accesibilidad) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-black/80 focus:px-3 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          className="h-14 sm:h-16 flex items-center justify-between gap-3"
          aria-label="Primary"
        >
          {/* Left: brand/menu */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/5 active:scale-[0.99] transition will-change-transform"
            aria-label="Abrir navegación"
            aria-haspopup="menu"
            aria-expanded="false"
            // iOS: evita gestos raros
            style={{ touchAction: 'manipulation' }}
          >
            {/* Icono fallback si la clase i-lucide-* no está disponible */}
            <svg
              aria-hidden="true"
              className="w-5 h-5 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="tracking-wide">Menú</span>
          </button>

          {/* Right: date */}
          <div className="text-right">
            <h2 className="text-white font-bold tracking-wider text-sm sm:text-base md:text-xl leading-none">
              {dateLabel || '\u00A0' /* reserva espacio y evita salto durante hidración */}
            </h2>
          </div>
        </nav>
      </div>
    </header>
  )
}
