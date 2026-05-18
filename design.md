# Scrum — Design Direction

## Vibe
Dark, focused workspace. Sticky notes pop against a deep charcoal/dark background — the contrast makes the board feel alive and tactile.

## Colors
- Background: `#0f1117` (near-black)
- Surface/sidebar: `#1a1d27`
- Column header bg: `#1e2130`
- Border/divider: `#2a2d3e`
- Text primary: `#e8eaf0`
- Text muted: `#6b7280`
- Accent/primary: `#6366f1` (indigo)
- Sticky note colors (classic paper):
  - Yellow: `#fef08a` / `#fde047`
  - Pink: `#fbcfe8` / `#f9a8d4`
  - Blue: `#bfdbfe` / `#93c5fd`
  - Green: `#bbf7d0` / `#86efac`
  - Orange: `#fed7aa` / `#fdba74`
  - Purple: `#e9d5ff` / `#d8b4fe`
- Note text: `#1f2937` (dark on light note)
- Priority: high=`#ef4444`, medium=`#f59e0b`, low=`#22c55e`

## Typography
- Font: Poppins (Google Fonts)
- Display: 700 weight
- Body: 400/500 weight
- Code/mono: system monospace

## Layout
- Left sidebar: fixed 220px wide, dark
- Main area: scrollable kanban columns horizontally
- Columns: ~280px wide each, vertical scroll per column
- Header: 56px tall

## Motion
- Cards: subtle scale/shadow on drag
- Modal: fade + slide up
- Column drag-over: highlight glow

## Sticky Notes
- Paper texture feel: slight box-shadow, slight rotation on hover (±1deg)
- Rounded corners: 2px (more square, like real notes)
- Dog-ear fold in top-right corner (CSS pseudo-element)
- Handwritten-style font for note title: Poppins 500
