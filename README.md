<div align="center">
Interactive Wedding Experience
A side-scrolling, game-like e-invite built with Next.js and PixiJS
Not your typical wedding invitation — a fully interactive, scroll-driven narrative with animated sprites, cinematic transitions and a mobile-first immersive layout.
🔗 Live Experience · 🛠 Stack
</div>

✨ Overview
A one-of-a-kind e-invite for my little sister's wedding. Instead of a static page, I built a side-scrolling interactive experience where each chapter of the couple's story unfolds as the user scrolls — animated sprites, parallax backgrounds, environmental transitions and real-time interaction.

Think of it as a browser-native mini-game that happens to be a wedding invitation.

📸 Screenshots

Screenshots and a short GIF pending — add to /public/screenshots/ and reference them here:

1.png — opening scene with animated title
2.png — short demo of scroll-driven progression
3.png — one of the interactive moments


🎯 Features

Scroll-driven narrative — horizontal, chapter-by-chapter storytelling tied to scroll position.
PixiJS rendering — hardware-accelerated 2D canvas for animated sprites and cinematic effects.
Real-time interactions — characters and scenes respond to the user.
Mobile performance optimization — tuned asset loading, sprite sheet bundling, deferred rendering off-screen.
Cross-device compatibility — tested on iOS Safari, Android Chrome and desktop.
Audio cues (optional) — ambient music synchronized with scenes.

🛠 Tech Stack
LayerTechnologyFrameworkNext.js (App Router)RenderingPixiJS (WebGL 2D canvas)UI glueReactStylingCSS + PostCSSHostingVercel
🏗 Technical Highlights

PixiJS + React integration — custom hooks to bridge Pixi's imperative API with React's declarative lifecycle without forcing re-renders of the canvas.
Sprite sheet optimization — packed textures to minimize GPU memory and draw calls.
Scroll orchestration — scroll position mapped to scene timeline with debounced updates for smooth 60fps feel even on mid-range phones.
Lazy scene loading — only the active and adjacent scenes are mounted, keeping memory low on long experiences.
Mobile-first asset pipeline — responsive image variants served based on device pixel ratio and viewport.

🚀 Getting Started
bash# Clone and install
git clone https://github.com/Immerhaze/wedding.git
cd wedding
npm install

# Run dev server
npm run dev

# Build for production
npm run build
Open http://localhost:3000 and scroll to experience the story.
📂 Project Structure
wedding/
├── app/                 # Next.js routes and layout
├── public/              # Sprites, sprite sheets, audio, screenshots
├── components/          # React components (scene wrappers, controls)
├── lib/                 # Pixi setup, scroll orchestrator, asset loaders
└── styles/              # Global styles
📈 Status
✅ Shipped for the wedding. Live at wedding-two-pied.vercel.app.
👤 Author
Nicolas Romero — Frontend / Full-Stack Developer
Portfolio · LinkedIn · GitHub

<div align="center">
<sub>Built with ❤ for my sister, in Viña del Mar, Chile</sub>
</div>
