# Biblia Sacra (React Edition)

A modern, distraction-free Catholic Bible reading application built with React, Vite, TypeScript, and Tailwind CSS.

## Features

- **73-Book Catholic Scripture Canon**:
  - Full Old Testament (46 books including Deuterocanonical books) and New Testament (27 books).
  - Multiple translations: Douay-Rheims Bible (DRB), Catholic Public Domain Version (CPDV), World English Bible Catholic Edition (WEB), and King James Version with Deuterocanon (KJV/D).
  - Support for custom JSON Bible endpoints.
  - Direct verse jump search with comprehensive aliases (e.g., `John 3:16`, `Ps 23`, `Gen 1`, `1 Cor 13`).

- **Voice Audio Reader (TTS)**:
  - Continuous narration using Web SpeechSynthesis API.
  - Floating player bar with verse-level playback controls, speed cycler (0.75x–2.0x), and voice selection.
  - Real-time active verse highlighting and auto-scrolling.
  - Background audio anchor, screen wake-lock, and MediaSession integration.
  - Automatic continuation across chapter boundaries.

- **Quote Studio & Image Generator**:
  - Export customizable scripture cards in 1:1, 9:16 (Stories/Reels), and 16:9 aspect ratios.
  - Palette presets, typography styling, custom colors, and background photo options.
  - One-click copy image to clipboard and PNG file download.
  - Dynamic random inspiration verse picker.

- **Study Tools, Notes & Highlights**:
  - 5 liturgical highlight colors (yellow, green, blue, pink, purple).
  - Personal reflections with Markdown formatting support.
  - Category tagging, search, and filtering.
  - Export and import study notes to/from Markdown (`.md`) files.
  - Dictionary and Wikipedia scripture word lookup.

- **Customization & Atmospheric Themes**:
  - 14 handcrafted themes including AMOLED Black, Pure White, Golden Parchment, Ancient Scroll, and Royal Amethyst.
  - 8 live animated atmospheric background effects (Night Sky, Living Waters, Divine Aureole, Candlelight, and more).
  - Adjustable reading width, font size, line spacing, and Google Fonts support.

- **Offline Storage & Cloud Sync**:
  - IndexedDB storage for offline reading and 73-book Catholic Bible bulk downloads.
  - Firebase Authentication and Cloud Firestore synchronization.
  - Full JSON backup export and import.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run lint
```
