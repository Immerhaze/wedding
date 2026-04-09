'use client';

import React from 'react';

export default function NavBar() {
  const dateLabel = '7 de Marzo · 2026';

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[#c9a84c]/10 bg-[#080808]/90"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)',
      }}
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="h-14 sm:h-16 flex items-center justify-between">

          {/* Left — signature */}
          <span className="text-white/50 text-xs sm:text-sm tracking-widest font-light select-none uppercase">
            Con amor · Nicolás
          </span>

          {/* Right — scrolling date */}
          <div className="relative w-44 sm:w-60 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#080808] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#080808] to-transparent z-10" />
            <div className="flex whitespace-nowrap animate-marquee-smooth">
              <span className="mx-6 text-[#c9a84c]/70 text-xs sm:text-sm tracking-[0.3em] uppercase font-light">
                {dateLabel} — {dateLabel} — {dateLabel} —
              </span>
              <span className="mx-6 text-[#c9a84c]/70 text-xs sm:text-sm tracking-[0.3em] uppercase font-light">
                {dateLabel} — {dateLabel} — {dateLabel} —
              </span>
            </div>
          </div>

        </nav>
      </div>
    </header>
  );
}
