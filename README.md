# Digital Bookshelf

A PWA to catalog your media. Phase 1 covers **Music** (album level, with songs) and **Video Games**, stored locally in IndexedDB via Dexie (cloud sync comes in Phase 2).

## Tech Stack
- Svelte 5 (+ runes) + Vite
- Tailwind CSS v4
- Dexie (IndexedDB)
- PWA (vite-plugin-pwa), deployable on Vercel

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # preview the production build (service worker active)
```

## Features (Phase 1)
- Landing page grid of media types + sidebar with dark mode toggle
- Media pages: cards in responsive grid (min 2 columns), sectioned as **Currently Playing/Listening**, **Upcoming**, **Finished/Abandoned**
- Status colors: finished = green, current = red, abandoned = grey, upcoming = yellow
- Games: name, image URL (auto-fetched preview), genre, rating (0–10 in 0.5 steps), date started/finished, platform (mobile/PS4/PC), review
- Music: album name, cover art URL, artist, genre, rating, date listened, review, plus embedded song lists (each song: name, rating, date listened, status, review)
- Cards open an edit modal with "Save and close" / "Discard changes and close"; `dateAdded` is set automatically and not exposed to the user
- Lora (serif) + Inter (sans), accent color #366D99

## Project layout
```
src/
  App.svelte                       hash-based routing shell
  app.css                          Tailwind + theme (fonts, accent, dark variant)
  lib/
    db.js                          Dexie schema, status metadata, sorting, CRUD
    store.svelte.js                reactive live queries + dark mode (runes)
    components/
      Sidebar.svelte  Landing.svelte
      MediaPage.svelte             sectioned card grid per media type
      RecordCard.svelte            compact card (image, name, rating, status)
      RecordModal.svelte           edit dialog (image preview, fields, review)
      SongsEditor.svelte           song list inside albums
```

## Deployment (Vercel)
Import the repo into Vercel as a Vite project — `npm run build` with `dist/` output is auto-detected. The PWA manifest and service worker are generated at build time.

## Phase 2 note
Dexie Cloud sync is intentionally not configured yet; the Dexie schema in `src/lib/db.js` is already structured so it can be added without breaking phase 1 data.
