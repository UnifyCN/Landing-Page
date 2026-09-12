# Unify Landing Page — CLAUDE.md

Marketing + content site for **Unify Social** — a newcomer settlement app for Canada (unifysocial.ca). This is a content-heavy, interaction-light Astro site. Not a full web app.

---

## Persona

You are an incredibly talented, experienced polyglot with decades of practice in software architecture, systems design, development, UI/UX, and copywriting. Bring that lens to every change here — structure, typography, copy, and micro-interactions all matter on a landing page.

---

## Stack

- **Astro 6** — `output: 'server'` with View Transitions (`ClientRouter` in BaseLayout)
- **Tailwind CSS v4** — via `@tailwindcss/vite`. Design tokens live in `@theme` inside `src/styles/global.css`. No JS config file.
- **Cloudflare Workers** — `@astrojs/cloudflare` adapter, deployed via Wrangler. CI in `.github/workflows/deploy.yml` (push to `main`).
- **Resend** — transactional email for forms.
- **Cloudflare Turnstile** — spam protection on forms.
- **Zod** — input validation in API routes.
- **Sanity CMS** — fully wired. Project `j4gu2dbr`, dataset `production`. Studio scaffold lives in `studio/` (deployed at `unify-landing.sanity.studio`). Frontend client in `src/lib/sanity/`. Body content rendered via `@portabletext/to-html`.
- **Playwright** — dev dependency for visual QA (MCP server configured in `.mcp.json`).
- **PostHog** — analytics (MCP available, not yet instrumented in code).
- **Google Analytics 4** — gtag.js (`G-RDVF45T3GX`) wired in `BaseLayout.astro` head, gated on `import.meta.env.PROD` (no localhost dev traffic). Auto pageview is disabled (`send_page_view: false`) and a manual `page_view` is fired on every `astro:page-load` — required because `<ClientRouter />` navigations are client-side and GA4's default tracking would only ever count the initial load.
- **Node >= 22.12.0** (see `package.json`).

---

## Commands

| Command                 | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Dev server at http://localhost:4321       |
| `npm run build`         | Production build                          |
| `npm run preview`       | Preview prod build locally                |
| `npm run generate-types`| Wrangler types for Cloudflare env         |
| `npm run test:e2e`      | Playwright e2e smoke tests                |
| `npm run test:e2e:ui`   | Playwright tests in interactive UI mode   |
| `npx wrangler deploy`   | Deploy to Cloudflare Workers              |
| `cd studio && npx sanity dev`    | Local Studio at http://localhost:3333    |
| `cd studio && npx sanity deploy` | Deploy Studio to unify-landing.sanity.studio |
| `npx playwright screenshot http://localhost:4321 /tmp/out.png --viewport-size="1440,900" --full-page` | Visual QA snapshot |

---

## Project Structure

```text
src/
├── pages/
│   ├── index.astro              # Homepage — imports sections in order
│   ├── about.astro
│   ├── community.astro
│   ├── contact.astro
│   ├── partners.astro
│   ├── partners/[slug].astro    # Static detail pages from src/lib/partners.ts
│   ├── resources.astro
│   ├── resources/               # Resource detail pages
│   ├── api/
│   │   ├── contact.ts           # POST /api/contact
│   │   └── partner-inquiry.ts   # POST /api/partner-inquiry
│   └── blog/
│       ├── index.astro          # Blog index — fetches from Sanity, sorts by publishedAt desc
│       └── [slug].astro         # Blog detail — renders Portable Text + dual-format tables
├── layouts/
│   └── BaseLayout.astro         # html shell, fonts, Navbar/Footer, View Transitions
├── components/
│   ├── sections/                # Page sections (Hero, Problem, FAQ, CTABand, etc.)
│   ├── common/                  # Navbar, Footer
│   ├── blog/                    # PostCard, PostNav
│   └── ui/                      # shadcn-style primitives (empty for now)
├── content.config.ts            # Empty — content collections deprecated, blog moved to Sanity
├── lib/
│   ├── partners.ts              # Typed Partner[] (17 partners)
│   ├── resources.ts             # Typed resources list
│   ├── sanity/                  # createClient + urlFor + GROQ queries + typed results
│   └── utils.ts
└── styles/
    ├── global.css               # Tailwind v4 + @theme tokens + grain overlay + fonts
    └── prose.css                # Blog post typography (incl. table styles)
studio/                          # Sanity Studio v3 (deployed at unify-landing.sanity.studio)
├── sanity.config.ts             # Plugins: structureTool, visionTool, table, media
├── structure.ts                 # Custom desk structure with iframe preview pane
└── schemaTypes/
    ├── index.ts
    └── post.ts                  # Blog post schema (title, slug, body w/ table support, etc.)
scripts/
└── migrate-blog-to-sanity.mjs   # One-time migration (markdown → Sanity); kept for reference
public/
├── fonts/                       # Self-hosted Aileron (300/400/600/700)
├── assets/logo, screenshots, demos, blobs, illustrations, images/partners, images/about, images/blog
└── app-store-badge-en.svg
```

---

## UI / UX — Skill Stacking (READ THIS)

For **any** frontend or UI design work on this project, ALWAYS invoke BOTH skills together:

- `frontend-design`
- `ui-ux-pro-max`

This is non-negotiable. No UI work happens without both skills active. Stack them up front, then apply.

### Supporting Skills Worth Knowing

- `design-review` — designer's eye QA on implemented UI
- `plan-design-review` — review design plans before coding
- `web-design-guidelines` — audit against Web Interface Guidelines
- `qa` / `qa-only` / `gstack` / `browse` — headless browser QA against the dev server
- `investigate` / `systematic-debugging` — bug root-cause work
- `simplify` — post-implementation dead-code / duplication sweep
- `review` — pre-landing PR review (use before opening a PR)
- `posthog-analytics` / `posthog-instrumentation` — when wiring analytics events or dashboards
- `ship` / `land-and-deploy` — for merge + Cloudflare deploy workflows

### Design Direction (do NOT drift)

- Editorial and bold. Asymmetric composition, strong typographic hierarchy, fluid type via `clamp()`, physical micro-interactions.
- Warm and human — not cold minimal, not flashy. Nothing should feel sharp, mechanical, or corporate.
- Avoid generic AI-looking UI.
- The homepage has been deliberately redesigned beyond the Framer original — do NOT revert to Framer's layout or copy without explicit request.
- Dark mode: out of scope. Never in scope.
- Match Framer (unifysocial.ca) closely on desktop and mobile for pages that came from Framer; flag ambiguous mobile layouts, don't approximate silently.
- **Responsive at every width — non-negotiable.** Every page, section, and component must look and work correctly across mobile (≤809px), tablet (810–1399px), desktop (≥1400px), AND every in-between width. No layout breaks, awkward wraps, overflow, cropped content, or unreadable type at *any* viewport in the 320px–1920px range. Test by resizing the browser continuously, not just at the three named breakpoints. Prefer fluid type (`clamp()`), fluid spacing, and intrinsic layouts (`auto-fit` / `minmax` / `flex-wrap`) over fixed pixel jumps. When you ship a UI change, the verification step must include a continuous resize check, not just three discrete screenshots.

---

## Core Rules

### Astro

- Default to server-rendered HTML. Avoid unnecessary client JS.
- Use islands ONLY when interactivity is needed (FAQ accordion, form handler, mobile menu, product overview tabs).
- View Transitions are wired globally — preserve them. Navbar uses `transition:persist`; body bg swap is handled via `astro:before-swap` in BaseLayout.
- **All static pages must `export const prerender = true`** so they bake to HTML at build time and are served from the Cloudflare CDN edge. The repo had every page hitting the worker on every request before this — TTFB on every navigation. Currently prerendered: `/`, `/about`, `/community`, `/contact`, `/partners` (+ all `/partners/[slug]` via `getStaticPaths`), `/resources` (+ all `/resources/[slug]`). SSR retained for `/blog/*` (live Sanity fetch) and `/api/*`. There are no local `/privacy` or `/terms` routes — the Footer links those to external Notion pages, see the Footer section below.
- **Anything that binds to the DOM at load time must wrap in `astro:page-load`**, not run at module top-level. With ClientRouter, module scripts only execute once on initial load — on subsequent View Transition navigations the new DOM exists but the old handler/observer is still attached to the detached previous DOM, leaving the feature dead. Pattern: wrap the setup in a function, register with `document.addEventListener("astro:page-load", initFn)`, and add a data-attribute guard on the root element (e.g. `el.dataset.fooBound === 'true'`) so it doesn't double-bind on the initial load (where both the inline script body and the page-load event fire). This trap has bit, in order: scroll-reveal observers (CTABand), the FAQ accordion click handler (`FAQ.astro`), and **Turnstile widget rendering on both forms** — Turnstile's `api.js` auto-renders `.cf-turnstile` divs only on initial DOM-ready, so `ContactForm.astro` and `BecomePartner.astro` explicitly call `window.turnstile.render()` from inside their `astro:page-load` init function whenever the widget div has no rendered `<iframe>` child yet.

### Tailwind v4

- All tokens live in `@theme` inside `src/styles/global.css`. Never introduce a `tailwind.config.js`.
- Never use arbitrary values (`mt-[96px]`, `text-[13.5px]`). If a value is missing from the scale, add it to `@theme` first.
- Use `@layer` only for custom component/utility classes. Don't redeclare tokens there.
- One global stylesheet imported via `BaseLayout`. Don't add per-component `@import "tailwindcss"`.

### CMS — Sanity (live)

- **Blog is fully on Sanity.** Project `j4gu2dbr`, dataset `production`. Editors author posts at `unify-landing.sanity.studio`.
- **Studio code** lives in `studio/` inside this repo. Redeploy with `cd studio && npx sanity deploy`.
- **Frontend** uses `@sanity/client` (read-only, `useCdn: true`) + `@sanity/image-url` + `@portabletext/to-html`.
- **All GROQ queries** belong in `src/lib/sanity/queries.ts` — never inline them in pages/components.
- **All query result types** in `src/lib/sanity/types.ts`. No `any` in shared code.
- **Sorting**: posts sort by `publishedAt desc` so the newest published post is always the featured slot. The `order` field is unused (kept in schema for backwards compat with migrated docs).
- **Categories**: `post.category` is a required single-value string (10 options). The canonical list lives in `src/lib/blog-categories.js` (plain JS so the Studio schema, the frontend, and the Node scripts all import the same file - never add a second list). Values are stored in Sanity; renaming one needs a backfill (`scripts/backfill-post-categories.mjs` is the pattern). `/blog` renders one chip per category and pre-applies `?category=` server-side (canonical stays `/blog`); posts with a missing/unknown value fall back to `others`. Tie-break rule for editors and the automation: audience wins - a post for international students is `international-students` even if it is about banking or jobs.
- **Body field** allows `block`, `image`, and `table` types. Tables use `@sanity/table` plugin (cells = plain strings, first row = header).
- **Migrated tables** (from the original markdown) use `@portabletext/markdown` shape (cells with nested Portable Text + `headerRows` count). The renderer in `src/pages/blog/[slug].astro` detects format via `typeof rows[0].cells[0] === 'string'` and handles both.
- **Studio plugins installed**: `@sanity/table` (table editor), `sanity-plugin-media` (media library), `sanity-plugin-iframe-pane` (live preview pane). Live preview shows the **published** version — drafts won't render until published. Full draft preview = future task.
- **Empty-state safety**: `src/pages/blog/index.astro` guards against 0 / 1 posts (empty message + conditional grid).
- **MCP for Sanity work**: use `list_sanity_rules`, then `astro` + `groq` rules, then `get_schema`. Don't guess GROQ.

### Forms / API

- Two endpoints only: `POST /api/contact`, `POST /api/partner-inquiry`.
- Flow: Zod validate → Turnstile siteverify → Resend send.
- Graceful degradation: if `TURNSTILE_SECRET_KEY` or `RESEND_API_KEY` are absent, the endpoint skips that step and returns success. Safe for local dev without keys.
- Do NOT introduce auth, a database, or new API routes unless explicitly requested.
- `from` address must be `contact@noreply.unifysocial.ca` — the verified subdomain in Resend. `@unifysocial.ca` root is NOT verified and will 403.
- Turnstile tokens are one-time use. After any non-success response, client JS must call `window.turnstile.reset()`. Both `ContactForm.astro` and `BecomePartner.astro` already do this.
- Turnstile widget config (site key `0x4AAAAAADBIS8MIXH2FQDoH`) is shared by both forms. Allowed hostnames live in CF dashboard → Turnstile → "Unify Landing Page" widget: currently `unifysocial.ca` and `unify-landing-page.wild-recipe-8e20.workers.dev`. If www starts showing "Unable to connect to website", add `www.unifysocial.ca` there.

### SEO

- Every page: proper `<title>`, meta description, semantic HTML (`<section>`, `<article>`, `<nav>`), correct heading hierarchy (one `<h1>`), clean URLs.
- Optimize for newcomer / immigrant / settlement keywords. Do NOT keyword-stuff or harm readability.

### Cloudflare Workers gotchas

- Use Web standards (`fetch`, `crypto.subtle`) — avoid Node-only APIs.
- Secrets via Wrangler (`wrangler secret put`) or `.dev.vars` locally. Access via `env` from `cloudflare:workers` (see `src/pages/api/contact.ts`).
- Watch bundle size. Prerender static routes with `export const prerender = true` where SSR isn't needed.

---

## Task Planning

Before coding:

1. Understand the architecture, identify files to touch, and propose a plan.
2. Get the plan approved before writing a single line of code.
3. State assumptions explicitly. Surface ambiguity — don't resolve silently.
4. If the task is large or vague, push back — break it down into smaller subtasks.

For multi-step work, state plan + verification per step:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

## Implementation

- No placeholder implementations. Build the thing.
- When using any external library you're not 100% sure about, web-search the latest syntax first (Astro 6, Tailwind v4, Sanity, Wrangler all move fast).
- Commit early and often. Break large tasks into logical milestones; commit after each is confirmed.
- Keep diffs focused. Avoid unrelated refactors.
- Build one section at a time. Verify with `npm run build` before moving on.

## Problem Solving

- Figure out the root cause instead of throwing random things at the wall.
- When stuck, use the `investigate` or `systematic-debugging` skill.

## Testing

Lean Playwright e2e smoke layer in `tests/` (config: `playwright.config.ts`). Run with `npm run test:e2e` (`:ui` for the debugger). It runs against `npm run dev` and gates the Cloudflare deploy — a failing test blocks the `deploy.yml` job.

It is **not** a full suite (this is a content-heavy, interaction-light site). It guards exactly two things: the **View-Transition re-binding bug class** (`tests/view-transitions.spec.ts` — islands wired via `astro:page-load` that have repeatedly broken on client-side nav) and the core interactive islands (smoke routes, FAQ accordion, mobile nav, both forms). No Turnstile/Resend network is hit — form tests assert render, binding-guard attributes, and Zod `fieldErrors` only.

**Rule:** when you add a new interactive island, or rename a binding-guard attribute (`data-nav-bound`, `data-faq-bound`, `data-cf-bound`, `data-bp-bound`, `data-ah-carousel-init`, `data-bf-bound` (blog filter), `data-rv-bound` (resources filter)), add or update its spec in the same change.

## Push Back

Say no if you see:

- Unnecessary complexity / over-engineering
- Unclear requirements
- CMS misuse or inline GROQ
- Breaking visual fidelity
- Bad SEO practices
- Silent mobile layout decisions

---

## Do NOT Implement

- React components or animation libraries (Framer Motion, motion/react, embla, carousel)
- `next/*` anything
- Dark mode
- Arbitrary Tailwind values — add tokens to `@theme`
- Inline GROQ queries in components/pages
- Dummy/placeholder logic

---

## Design System (extracted from Framer + extended for editorial redesign)

### Colors

- Brand/CTA: `#D84A29` → `var(--color-brand-red)` / `var(--color-brand)`
- Text/Ink: `#181818` → `var(--color-text)`
- Ink dark: `#171616` → `var(--color-ink)` (dark section backgrounds)
- Cream: `#ffffff` → `var(--color-cream)` (token kept for compatibility, value is now white — was previously `#FFFCF3`)
- Muted: `#575757` → `var(--color-muted)`
- White: `#FFFFFF`

### Fonts

- **Aileron** — self-hosted woff2 in `public/fonts/`. Light (300), Regular (400), SemiBold (600), Bold (700). Body + display.
- **Figtree** — Google Fonts. CTA buttons and UI elements only.

### Breakpoints

- Mobile: ≤809px — hamburger nav
- Tablet: 810–1399px — hamburger nav
- Desktop: ≥1400px — full inline nav
- Container max-width: 1600px

### Type scale (sections use fluid `clamp()` — do not override with fixed px)

- H1: 80px / 80px
- H2: 60px / 68px
- H3: 44px / 52px
- H4: 32px / 40px
- H5: 24px / 32px
- Body: 24 / 20 / 16 / 14px

### Tokens in `@theme`

- Tracking: `--tracking-display: -0.05em`, `--tracking-tight: -0.04em`, `--tracking-label: 0.08em`
- Easing: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (enter/reveal), `--ease-in-out`, `--ease-drawer`
- Nav: `--spacing-navbar: 67px`
- Radii: `--radius-btn: 6px`, `--radius-pill: 18px`, `--radius-cta: 12px`

### Global grain

`body::after` with SVG `fractalNoise` at opacity 0.028 — physical texture layer. Do not remove.

### Scroll animation pattern (use for all new sections)

Progressive enhancement — never set `opacity: 0` globally without a JS-gated class:

```css
.my-element { transition: opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out); }
.my-section.animate .my-element { opacity: 0; transform: translateY(24px); }
.my-section.animate.visible .my-element { opacity: 1; transform: translateY(0); }
```

```js
section.classList.add('animate');
// observer fires → section.classList.add('visible');
```

Do NOT use `animation-fill-mode: both` with a delay on scroll-triggered elements — it causes `opacity: 0` to persist before the animation starts, breaking static renders and slow-JS contexts.

---

## Navbar — Critical Design Notes

The navbar pill is a **liquid-glass** element — translucent white pill with real backdrop-blur, gradient sheen, gloss highlight, and layered shadows. The user's eye should still go TO the content inside the pill (logo, links, CTA) — the pill itself is depth, not focus.

- Background: `linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.5))` — translucent so blur reads through
- **Backdrop blur: `blur(14px) saturate(160%)`** — DO NOT raise to 22/180. Was originally `blur(22px) saturate(180%)` and that made the entire site lag on macOS/HiDPI because the GPU re-blurred the underlying viewport every scroll frame at 2× pixel density. Cost scales roughly with blur radius squared. After the AVIF image conversion (commit `ad885e5`) reduced competing main-thread work, we bumped from 8/140 → 14/160 — closer to the original feel, still ~50% cheaper than 22/180. If lag returns on lower-end Macs, drop back to 8/140.
- Border: `1px solid rgba(255,255,255,0.55)` — light edge, lifts the pill off the page
- Inset highlights: `inset 0 1px 0 0 rgba(255,255,255,0.8)` (top), `inset 0 -1px 0 0 rgba(255,255,255,0.2)` (bottom) — simulates light refraction through the glass
- Box shadow: layered `0 8px 24px -8px rgba(23,22,22,0.14), 0 2px 6px -2px rgba(23,22,22,0.08)` — soft elevation
- Top-gloss highlight via `::before` with `mix-blend-mode: overlay` and a 35%→0% white gradient — the "wet" look
- On scroll (`.is-scrolled`): background opacity bumps to 0.85→0.65 and shadows deepen slightly. Never becomes opaque.
- Logo height: `h-10` (40px), generous left padding inside the pill
- Logo is a plain `<div>`, NOT a link. Clicking does nothing. Asset: `/assets/logo/new-unify-logo-256.png` (the new starburst, regenerated from the trimmed master — see the Favicon set section for the regeneration workflow). The old `logo-with-name.{png,avif}` files in the same folder are vestigial.
- Logo and "Download Unify" CTA must NOT feel cramped — if anything feels tight, increase padding first
- CTA: `bg #171616`, `hover #D84A29`, transition `0.2s`, label "Download Unify" + `→`, links to App Store in a new tab
- Nav links (order): Home | About | Community | Partners | Blog | Resources | Contact
- Mobile: hamburger at ≤1399px, full overlay with stacked links + CTA

---

## Footer

White background, top + bottom hairline borders. Three-column grid at tablet+ (`2fr 1fr 1fr`).

- **Brand column:** `/assets/logo/new-unify-logo-256.png` (the new starburst, same asset the navbar uses) at `h-14`, links to `/`. Tagline: "An all-in-one mobile companion for newcomers in Canada. Built in Vancouver, with newcomers, for newcomers." Below: row of 38px round social pills with hairline border that fill brand-red on hover.
- **Navigate column:** Home | About | Community | Blog | Contact (5 links — still narrower than the 7-link navbar; Community added on Day 3 of the SEO sprint to give the orphaned `/community` page an inbound link from every page on the site).
- **Legal column:** Privacy Policy and Terms of Service redirect to **Notion-hosted canonical pages** (URLs hardcoded in `src/components/common/Footer.astro` `legal[]`). They open in a new tab via `target="_blank" rel="noopener noreferrer"`. Don't re-add local `/privacy` or `/terms` routes — Notion is the single source of truth so legal copy doesn't drift across surfaces.
- **Bottom bar:** `© 2026 Unify Social` — plain text, no dash, NOT a link.

Socials:
- Instagram: https://www.instagram.com/unifysocial.ca/
- Facebook: https://www.facebook.com/p/Unify-Social-61570879043328/
- LinkedIn: https://www.linkedin.com/company/unify-social/posts/?feedView=all
- Twitter/X: https://x.com/unifysocialca

---

## Section Notes (homepage) — load-bearing, do not revert

Homepage flow: `Hero → Partners → Journey → FAQ`. No `Problem`, `ProductOverview`, or `CTABand` on the homepage. `Problem.astro` and `ProductOverview.astro` still exist on disk but are intentionally retired — do NOT re-import them. The dead vertical-timeline CSS inside `Journey.astro` is in the same bucket.

- **Hero** — white bg, two-column (`1fr 480px` desktop). Rating pill, single plain-string H1 "The all-in-one newcomer settlement app" (no styled spans / italic brand-red word), sub, App Store badge CTA, 5-avatar social-proof row, phone `learn-hero.avif` (`loading="eager"`). Staggered CSS-keyframe reveals. **No glow gradient behind the phone** — it sat under the navbar's `backdrop-filter` zone and caused scroll lag; drop-shadow only, do NOT re-add it.
- **Partners** — white bg, CSS-only marquee of 17 logos doubled for a seamless loop, mask-gradient fade edges, pauses on `:hover`, respects `prefers-reduced-motion`. Each logo is an `<a>` to `/partners/[slug]` — the array is `import { partners } from "../../lib/partners"` (same source as `PartnersGrid.astro`, so the slug, logo path, and name come from one place). The duplicated loop set carries **both** `aria-hidden="true"` and `tabindex="-1"` (an `aria-hidden` element that's still focusable is an a11y violation); first set is focusable with a `:focus-visible` brand-red ring.
- **Journey ("Key Benefits")** — white bg, eyebrow "Core Features" + centered H2. **Four** feature blocks: Checklist (cream `#f5eeda`) / AI Companion (blue-grey `#e9ecf6`, reversed) / Community (peach `#f5e6d2`) / Learn (yellow-green `#ecf0c2`, reversed). Each card holds a transcoded H.264 phone demo from `public/assets/demos/` (`checklist-tab-demo.mp4`, `ai-tab-demo.mp4`, `social-tab-demo.mp4`, `learn-tab-demo.mp4`) — sources are HEVC `.mov` originals, transcoded with macOS `avconvert --preset Preset1920x1080` (no ffmpeg needed). Each `<video>`'s `poster=` MUST point to the demo's actual frame 0 at `public/assets/demos/posters/<demo-name>.avif` — when poster pixels match the first decoded frame the play-start swap is invisible; an off-brand screenshot poster (the prior state) produced a visible flash. Regenerate posters whenever a demo is re-recorded: AVFoundation Swift one-liner (`AVAssetImageGenerator.copyCGImage(at: .zero …)`) → PNG → Sharp `avif({ quality: 55 })`. The Community card's `transform: scale(1.09)` applies to the poster too, so a frame-0 extract stays matched automatically. **Card `aspect-ratio` MUST match each clip's native ratio** so `object-fit: cover` never crops the phone — base is 3:4 (matches the first three 810×1080 clips); `--learn` overrides to `4 / 5` for its 864×1080 clip. At desktop **≥1280px** the grid switches from `1fr 1fr` to `auto minmax(0, 560px)` + `justify-content: center` (reversed swaps the columns) so the text+card pair sits as a centred unit and the middle gap collapses to just `column-gap`. Community gets two extra knobs: `.feature-text { max-width: 26rem }` to keep its short heading from floating away from the card, and `transform: scale(1.09); transform-origin: top center` on its `.feature-card-img` to crop the ~92px of empty whitespace below the phone in the `social-tab-demo` recording (until that clip is re-framed to fill the frame the way the other three do). IntersectionObserver reveal wired through `astro:page-load`.
- **FAQ** — white bg, native `<details>` accordion with JS-driven `max-height` animation and a dark `+`-to-`X` toggle (not a chevron). 5 questions; Q&A copy lives in `src/components/sections/faqs-data.ts`.
- **CTABand** — dark (`var(--color-ink)`) band used on About/Community/Contact/Partners, **NOT the homepage**. "Stop guessing. / Start settling." headline, brand-red "Download the App Now" button, scroll fade-up via IntersectionObserver.

---

## MCP / External Tooling

- **Playwright MCP** (`.mcp.json`) — headless visual QA. Restart Claude Code after changes to `.mcp.json`.
- **Sanity MCP** — use `list_sanity_rules`, `get_schema`, `search_docs` before writing any Sanity code. `astro` rule + `groq` rule are the ones to load here.
- **PostHog MCP** — scoped to "Default project" in org "Unify Social" (id `019a94a4-9861-0000-3b1e-bd4e8d515177`). Project timezone: America/Vancouver. Person-on-events mode is on.

---

## Environment Variables

Form endpoints gracefully skip steps when keys are absent — local dev works without any of these.

`.dev.vars` (never commit):

```
RESEND_API_KEY=re_...
TURNSTILE_SECRET_KEY=...
CONTACT_TO_EMAIL=contact@unifysocial.ca
```

For production: `wrangler secret put <NAME>` or Cloudflare dashboard. As of 2026-05-13, `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` are set on the production worker; `CONTACT_TO_EMAIL` is unset and falls back to the `contact@unifysocial.ca` default in `src/pages/api/contact.ts:63`.

---

## Infrastructure

- **Domain**: `unifysocial.ca` + `www.unifysocial.ca`, registered at **CanSpace** (keep auto-renew + Registrar Lock on). Both proxied to the worker.
- **DNS host**: Cloudflare (zone `unifysocial.ca`). Nameservers `graham.ns.cloudflare.com` + `ulla.ns.cloudflare.com` must stay set at CanSpace — reverting them takes the site down.
- **Hosting**: Cloudflare Worker `unify-landing-page`, bound to apex + www via Custom Domains. Test URL isolated from DNS: `https://unify-landing-page.wild-recipe-8e20.workers.dev`.
- **Sanity Studio**: hosted separately at `unify-landing.sanity.studio` (project `j4gu2dbr`, dataset `production`).
- Email DNS (Google Workspace MX + Resend SPF/DKIM/DMARC) and the GSC verification TXT live in the Cloudflare zone — recoverable from the Cloudflare dashboard if needed.

If the site goes down, check: (1) CF zone status is "Active", (2) the two CF nameservers are still set at CanSpace, (3) the worker has both Custom Domains bound, (4) `wrangler tail` is clean.

---

## Favicon set

All favicons regenerate from one master: `public/assets/logo/new-unify-logo.png` (1024×1024 starburst, transparent, content-trimmed to `public/assets/logo/new-unify-logo-tight.png`).

Outputs in `public/`: `favicon-32.png`, `favicon-96.png`, `favicon-192.png`, `apple-touch-icon.png` (180×180), `favicon.ico` (multi-resolution, built with `npx png-to-ico`), `site.webmanifest`. Link tags are declared in `src/layouts/BaseLayout.astro`. Do NOT add a `favicon.svg` back.

**To swap the logo**: replace `new-unify-logo.png`, re-trim with the Sharp script from commit `712a5f8`, regenerate each size with `sips -Z <n>` and the ICO with `png-to-ico`, then request indexing in Google Search Console.

---

## Section Notes — other pages

- **Contact** (`src/pages/contact.astro`) — `bodyBg="#171616"`. ContactHero → ContactForm → CTABand. Form posts to `/api/contact`; success state hides the form and shows `.cf-success`.
- **Partners** (`src/pages/partners.astro`) — `bodyBg="#171616"`. PartnersHero → PartnerTestimonials → PartnersGrid → BecomePartner → CTABand. Static detail pages `/partners/[slug].astro` generated from `src/lib/partners.ts` (typed `Partner`, 17 partners). BecomePartner posts to `/api/partner-inquiry`.
- **Community** (`src/pages/community.astro`) — `bodyBg="#171616"`. CommunityHero → CommunityStats → CommunityGallery → CommunityEventCTA → CTABand.
- **Resources** (`src/pages/resources.astro` + `resources/[slug].astro`) — resources are typed objects in `src/lib/resources.ts` (6 entries), each with a `youtubeId` that is the **11-character video ID only, never a full URL**. Cards derive thumbnails; `[slug].astro` derives the embed iframe. Embed src: `https://www.youtube-nocookie.com/embed/{youtubeId}?rel=0&modestbranding=1&enablejsapi=1` — keep all three deliberate choices (`nocookie` domain, `rel=0&modestbranding=1`, `enablejsapi=1`). IDs are case-sensitive with confusable glyphs — transcribe carefully and verify the player renders.
- **About** (`src/pages/about.astro`) — `bodyBg="#FFFFFF"`. AboutHero → AboutProblem → AboutValues → AboutOutro → CTABand. No `AboutFounders` (rolled into AboutHero — 2-photo crossfade carousel + founders copy). AboutHero top padding is intentionally tight; don't re-inflate. Reveal animations are finely tuned (AboutValues = opacity-only letter sweep; AboutOutro = per-word slide-up, NOT per-letter — per-letter caused mid-animation jank) — check git history before retiming.

---

## Key Principle

Content-heavy, interaction-light. Preserve low JS, fast load, strong SEO. Don't code against Astro's strengths.

---

## SEO Infrastructure

SEO machinery (sitemap, robots, canonical/og/twitter meta, JSON-LD schemas, edge redirects, OG card) shipped in SEO Sprint v2 (May 2026). Full architecture, schema map, footguns, and the Day 15 / Day 30 check-in triggers live in [`docs/seo-retro.md`](docs/seo-retro.md) — read it before touching anything SEO-related.

### Weekly blog automation (July 2026)

A durable **cloud routine** (Claude Code on the web, Sunday `31 8 * * 0` PT) pulls Google Search Console demand via the Search Analytics API, writes a post, picks a Pexels photo for the thumbnail, and **hard auto-publishes** to Sanity, then emails a summary. It is unattended (no `AskUserQuestion`). Full design + runbook + one-time setup live in [`docs/weekly-blog-automation.md`](docs/weekly-blog-automation.md), [`docs/weekly-blog-automation-setup.md`](docs/weekly-blog-automation-setup.md), and `docs/superpowers/{specs,plans}/2026-07-11-*` — read those before touching the automation. The human-facing skill is `.claude/skills/creating-seo-blog-posts`.

- **Scripts:** `scripts/{gsc-fetch,list-post-slugs,fetch-pexels,notify-run,update-thumbnail}.mjs`. `create-post.mjs` has a slug-overwrite guard (refuses to `--publish` over an existing published slug unless `--force`) and refuses to commit without a valid `category`.
- **`generate-post-thumbnail.mjs` has two modes:** `THUMB_BG=<photo>` → photo + brand overlay (bottom scrim + logo/red-rule/eyebrow/white headline); no `THUMB_BG` → the original white text card (fallback). Env-driven: `THUMB_EYEBROW`, `THUMB_HEADLINE` (max 2 lines), `THUMB_OUT`.
- **Blog display images are `aspect-ratio: 16 / 9`** (post hero in `blog/[slug].astro`, featured slot in `blog/index.astro`). Do NOT reintroduce fixed pixel heights on `.post-hero-img` / `.bl-featured-img-wrap` — a fixed height with `aspect-ratio` set computes the *width* (e.g. `440px × 16/9 = 782px`) and overflows/crops the branded thumbnails. Grid columns holding these images use `minmax(0, 1fr)`.
- **Routine env** needs `SANITY_WRITE_TOKEN`, `GCP_SA_KEY_B64`, `GSC_SITE_URL=sc-domain:unifysocial.ca`, `PEXELS_API_KEY`, `RESEND_API_KEY`, `NOTIFY_TO_EMAIL`, plus allowed domains `api.sanity.io` / `api.resend.com` / `api.pexels.com` / `images.pexels.com`. The routine's **setup script must be empty** — it runs outside the cloned repo, so deps install in the runbook (`npm install --include=dev`), not the setup script.
