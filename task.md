# Scrum Redesign — Wired.com Theme

## Status
- [x] Design system: Barlow Condensed + IBM Plex Mono + Barlow, white bg, editorial
- [x] styles.css rewritten
- [x] lib/utils.ts (cn)
- [x] ui/button.tsx
- [x] ui/badge.tsx
- [x] ui/dialog.tsx
- [ ] ui/input.tsx
- [ ] ui/textarea.tsx
- [ ] ui/select.tsx
- [ ] Sidebar.tsx (minimal, editorial)
- [ ] StickyCard.tsx (cleaner)
- [ ] TaskModal.tsx (use Dialog, shadcn)
- [ ] pages/board.tsx
- [ ] pages/index.tsx (dashboard)
- [ ] pages/timeline.tsx
- [ ] app.tsx

## Design Decisions
- White/off-white (#fafaf8) bg, stark black accents
- Barlow Condensed for all headings/buttons (ALL CAPS display)
- IBM Plex Mono for labels, metadata, numbers
- Barlow regular for body
- Border: thin 1px zinc-200, minimal radius (1-2px)
- No colored backgrounds in UI chrome — colour lives ONLY on sticky notes
- Sticky notes: muted paper tones, subtle shadow
- Column headers: just uppercase mono label + count
- Sidebar: white, thin right border, editorial nav
