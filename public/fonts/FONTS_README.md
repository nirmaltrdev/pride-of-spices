# Pride of Spices — Font Asset Specifications

## Required Brand Font: Fonarto

According to the official Pride of Spices Brand Documentation:
- **Font Family:** Fonarto
- **Licensing:** Free for personal and commercial use without usage limitations.
- **Designer:** Arwan Sutanto / Locomotype Studio

## Installed Asset Files in this Directory (`public/fonts/`):
- `Fonarto.woff2` (Ultra-compressed modern web format, 20 KB)
- `Fonarto.woff` (Standard web format fallback, 26 KB)
- `Fonarto.ttf` (TrueType master font format, 44 KB)
- `FonartoXT.woff2` (Alternate decorative display format, 38 KB)
- `FonartoXT.woff` (Alternate decorative fallback format, 51 KB)
- `FonartoXT.ttf` (Alternate decorative master format, 83 KB)
- `Fonarto-License.txt` (Official author freeware license by Arwan Sutanto)

## Current Status:
- **RESOLVED & ACTIVE:** Physical binary font files are installed in `public/fonts/`.
- `@font-face` bindings in `src/index.css` are configured for `'Fonarto'` and `'Fonarto XT'`.
- `index.html` preloads `/fonts/Fonarto.woff2` for instantaneous, zero-FOUT rendering.
- All headings, typography design tokens, navigation, buttons, and form labels render in Fonarto.
