# Qaser Almaraya — Next.js

Next.js 15 (App Router) port of the Qaser Almaraya website. Arabic-first, RTL, with a runtime
Arabic→English toggle.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build    # static export into out/  (next.config.mjs sets output:'export')
```

Remove `output: 'export'` from `next.config.mjs` if you want SSR / a Node server instead.

## Layout

| Path | What |
|---|---|
| `app/layout.js` | html lang/dir, fonts, loads the i18n dictionaries from `public/` |
| `app/page.js` | renders `<Site />` |
| `app/site.css` | global styles carried over from the design (`.qa-*` classes, tokens, keyframes) |
| `components/Site.jsx` | the whole site: internal page state (home / flights / careers / faq / about / terms / privacy / contact), the apply-modal flow, and the language toggle |
| `components/Icon.jsx` | Lucide glyph subset used by the design |
| `components/AchievementSpread.jsx` | achievements gallery (was a design-system component) |
| `components/MascotLoader.jsx` | Skylo page-transition loader |
| `public/assets/` | logos, mascot renders, photography, flags, company profile PDF |
| `public/qa-i18n*.js` | Arabic→English dictionaries (UI, body copy, full Terms & Privacy) |

## Notes for the next developer

- **Routing** is currently internal state in `Site.jsx` (one page component, `go(id)` switches).
  Splitting into real routes (`app/flights/page.js` …) is the natural next step — lift the shared
  header/footer into `layout.js` and move each `{isX ? … : null}` block into its own route file.
- **Styling** is inline style objects, carried over from the design so nothing shifted during the
  port. Migrate to CSS Modules / Tailwind at your convenience.
- **i18n** is a runtime DOM text swap (`applyLang` in `Site.jsx`). For production, move the
  dictionaries into `next-intl` message catalogs keyed by id and delete that effect.
- **Forms** (job application, contact) are client-only. Wire `submitApply` and the contact submit to
  API routes; the application posts up to 3 files (CV + cover letter required, work samples optional).
- **Job openings, FAQ, packages, visa data** are the consts at the top of `Site.jsx` — move them to a
  CMS or `/api` when convenient.
- Baked-in Arabic text lives inside the hero banner and achievement photography, so those images do
  not translate; English artwork is needed for a full English experience.

Contact: info@almarayagroup.com · sales@almarayagroup.com · 6393 · +964 784 999 9600 
