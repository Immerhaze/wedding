import React from "react";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left: brand / menu */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-white/5 active:scale-[0.99] transition"
            aria-label="Open navigation"
          >
            <span className="i-lucide-menu w-4 h-4" aria-hidden />
            <span className="tracking-wide">Open nav</span>
          </button>

          {/* Right: date */}
          <div className="text-right">
            <h2 className="text-white font-bold tracking-wider text-sm sm:text-base md:text-xl leading-none">
              Marzo 7, 2026
            </h2>
          </div>
        </div>
      </div>
    </header>
  );
}
