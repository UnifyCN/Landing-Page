---
name: creating-seo-blog-posts
description: Use when writing, creating, or publishing a Unify blog post in Sanity, or turning Google Search Console data into blog ideas. Triggers - "write a blog post", "new blog post", "blog idea", "what should we write about", "GSC blog ideas", SEO content for the blog, publish to Sanity.
---

# Creating SEO Blog Posts (Unify)

## Overview

End-to-end pipeline for shipping a high-performing Unify blog post: mine Search Console for demand, pick a topic, write an SEO + AEO optimized post, generate an on-brand thumbnail, and create it in Sanity. **Default to a DRAFT for human review; publish only on explicit approval.**

Blog content lives in Sanity (project `j4gu2dbr`, dataset `production`), rendered by the SSR Astro route `src/pages/blog/[slug].astro`. Posts sort by `publishedAt desc`, so the newest published post is the featured slot. The renderer reads `seoTitle`, `seoDescription`, `keyTakeaway`, and `faqs` and emits a key-takeaway callout, a visible FAQ, and FAQPage JSON-LD (verify against the current renderer before relying on a field).

## The pipeline

1. **Get GSC data.** Ask the user to export Search Console → Performance → Queries + Pages (CSV/zip). Analyze for three things:
   - **Fix opportunities:** pages with high impressions + low CTR (a title/snippet rewrite, not a new post).
   - **Expand opportunities:** clusters where we rank near page 1 but lack a dedicated post.
   - **Gap opportunities (new posts):** strong themes adjacent to ours that we have NOT covered. A genuine gap will NOT appear in GSC (no content = no impressions), so validate its demand with a web search and confirm the SERP is winnable (NOT government-dominated head terms - canada.ca/CRA/IRCC own those).
2. **Propose + pick a topic.** Offer 2-3 data-backed ideas (AskUserQuestion) with demand evidence and winnability for each. Check the existing blog + `/teer` cluster first and cross-link rather than cannibalize.
3. **Write the post.** Match the existing blog voice: warm, human, editorial, practical. No em dashes (use hyphens). Ground claims in primary sources (canada.ca/CRA/IRCC, reputable surveys) and cite them. Hit the field targets below.
4. **Generate a thumbnail.** Edit `EYEBROW` / `HEADLINE_LINES` / `OUT` in `scripts/generate-post-thumbnail.mjs` and run it; review the PNG. (Or use a supplied photo.)
5. **Author the post JSON and create it.** Write a `<slug>.json` (shape below) and run `scripts/create-post.mjs` (dry-run, then `--commit`). It defaults to a DRAFT; pass `--publish` ONLY when the user has approved.
6. **Verify + index.** If published, curl the live URL and confirm the `<title>` is the seoTitle, the key-takeaway callout, the FAQ, and the FAQPage JSON-LD render; then tell the user to Request Indexing in GSC. If a draft, point them to Studio to review + publish.

## Field targets (Sanity `post` schema)

| Field | Target |
|---|---|
| `title` | Full editorial headline (the on-page H1). |
| `slug` | Lowercase, hyphenated, keyword-first, concise. **Do not rename after publishing** - a renamed slug bleeds ranking equity; if you must, add the old slug to `LEGACY_SLUG_REDIRECTS` in `blog/[slug].astro`. |
| `seoTitle` | The `<title>` tag. Keyword-first, <=60 chars. |
| `description` | **Required.** Answer-first, 140-160 chars. Used as the meta description and as the fallback for `seoDescription`. Always include it in the JSON. |
| `category` | **Required.** ONE value from `src/lib/blog-categories.js`: `jobs-careers`, `housing-renting`, `immigration-status`, `banking-money`, `healthcare`, `taxes-benefits`, `driving-transportation`, `credentials`, `international-students`, `others`. Drives the `/blog` filter chips and the card label. Audience wins the tie-break: a post written for international students is `international-students` even if it is about banking or jobs. |
| `seoDescription` | Optional. Overrides `description` for the meta when you want a different SERP line. |
| `keyTakeaway` | Answer-first summary, 40-60 words (renders as a callout; prime for snippets/AI). |
| `faqs[]` | 3-4 `{question, answer}` pairs (renders a visible FAQ + FAQPage JSON-LD). |
| `body` | H2 sections, short paragraphs, bullet lists, a comparison table where useful. |
| `thumbnail` | REQUIRED image (the blog grid + post header break without it). |
| `craReference` | Optional. Tax/legal forms reference shown in the post meta line, e.g. "NR74, T1 General". Use on tax/money posts. |
| `publishedAt` | Unique, current ISO timestamp to take the featured slot. Do NOT reuse an existing post's timestamp (sorting is by `publishedAt desc`). |
| `order` | Legacy/unused (sorting is by `publishedAt`). Set to 0. |

AEO wins that get cited by AI: open with the answer, use stats with sources, comparison tables, and the FAQ. See the `ai-seo` and `seo-audit` skills for depth, and `docs/seo-audit-2026-06.md` for the data behind these targets.

## Authoring the post JSON

`scripts/create-post.mjs` reads a JSON file and builds the Portable Text for you - never hand-write Portable Text. Body items are objects with one key each:

```json
{
  "slug": "best-bank-for-newcomers-in-canada",
  "title": "Best Bank for Newcomers in Canada: How to Choose",
  "seoTitle": "Best Bank for Newcomers in Canada (2026)",
  "description": "Answer-first meta, 140-160 chars, names the reason to click.",
  "category": "banking-money",
  "keyTakeaway": "Answer-first 40-60 word summary that opens the post.",
  "craReference": "",
  "order": 0,
  "thumbnail": ".design-staging/best-bank-thumb.png",
  "body": [
    { "p": "Answer-first intro paragraph with a sourced stat." },
    { "h2": "A section heading" },
    { "li": ["Bold lead.", "rest of the bullet."] },
    { "li": "A plain bullet." },
    { "table": [["Header A", "Header B"], ["a1", "b1"], ["a2", "b2"]] }
  ],
  "faqs": [ { "q": "A natural-language question?", "a": "Answer-first reply." } ]
}
```

The post page already renders `<CTABand/>` at the bottom, so keep the closing soft - do not add a hard app CTA in the body.

## Creating it (token flow)

Writes need a fresh **Editor** token (manage.sanity.io → `j4gu2dbr` → API → Tokens). Keep it out of the chat via the clipboard:

```
# user copies the token, then in their own terminal / via the ! prefix:
! pbpaste > /tmp/stok

# dry run first (writes nothing):
node scripts/create-post.mjs <slug>.json

# create a DRAFT (default) for review:
SANITY_WRITE_TOKEN="$(tr -d '[:space:]' < /tmp/stok)" node scripts/create-post.mjs <slug>.json --commit

# only after the user approves: publish
SANITY_WRITE_TOKEN="$(tr -d '[:space:]' < /tmp/stok)" node scripts/create-post.mjs <slug>.json --commit --publish

# then: rm /tmp/stok ; user revokes the token
```

`create-post.mjs` uses `createOrReplace` (idempotent): a DRAFT writes `_id = drafts.<slug>`, publish writes `_id = <slug>`. Re-running with `--publish` after a draft promotes it. After a schema change (new field), redeploy Studio: `cd studio && npx sanity deploy`.

## Common mistakes

- Publishing without approval (default is `--commit` = DRAFT; only add `--publish` when asked).
- Missing thumbnail (required - generate one first).
- Title over 60 chars or not keyword-first (the reason the tax cluster underperformed).
- Em dashes anywhere (project rule - use hyphens).
- Inventing tax/immigration facts - verify against canada.ca and cite.
- Cannibalizing an existing post - check the blog + `/teer` cluster and cross-link instead.
- Renaming a slug after publish without a redirect (bleeds equity).
- Reusing a `publishedAt` timestamp (ambiguous featured slot).
- Omitting `description` from the JSON - it is the required field (`seoDescription` is only an optional override).
- Omitting `category` or inventing a value - `create-post.mjs` refuses to commit; use one of the listed values.

## Reference

- Scripts: `scripts/create-post.mjs` (canonical, JSON-driven), `scripts/generate-post-thumbnail.mjs` (thumbnail). `scripts/create-post-build-credit.mjs` is the original worked example. `scripts/seo-backfill.mjs` + `scripts/seo-m3-faq-backfill.mjs` are field-backfill patterns for existing posts.
- Context: `docs/seo-audit-2026-06.md`, `docs/seo-retro.md`.
- Related skills: `seo-audit`, `ai-seo`, `programmatic-seo`.
