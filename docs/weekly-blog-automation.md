# Weekly Blog Automation - Runbook (executed by the Sunday cloud routine)

You are running unattended in a Claude Code cloud routine. There is NO human to
ask. Do NOT use AskUserQuestion. Follow every step in order. If a hard step
fails, jump to "On failure" and stop. The design rationale is in
`docs/superpowers/specs/2026-07-11-weekly-seo-blog-automation-design.md`.

Credentials arrive as environment variables (already set on the routine):
`SANITY_WRITE_TOKEN`, `GCP_SA_KEY_B64`, `GSC_SITE_URL`, `PEXELS_API_KEY`,
`RESEND_API_KEY`, `NOTIFY_TO_EMAIL`. All commands run from the repo root.

## Steps

0. **Install deps (from the repo root):** `npm install --include=dev` (--include=dev so the devDependencies the scripts need are installed even under NODE_ENV=production; `npm install` rather than `npm ci` avoids lockfile-strictness surprises)

1. **Fetch GSC demand:** `node scripts/gsc-fetch.mjs`
   - Verify `/tmp/gsc-latest.json` exists and its `queries` array is non-empty.
   - If it fails or is empty: go to "On failure" with that error. Do NOT publish blind.

2. **List existing posts:** `node scripts/list-post-slugs.mjs` (writes `/tmp/existing-posts.json`).

3. **Pick ONE topic.** Read `/tmp/gsc-latest.json` and apply the opportunity logic
   from `.claude/skills/creating-seo-blog-posts/SKILL.md`:
   - **Expand:** clusters ranking near page 1 (position ~8-20) with impressions but no dedicated post.
   - **Gap:** a strong adjacent theme we have NOT covered. A real gap will not appear in GSC,
     so do a quick web search to confirm real demand and a winnable SERP
     (NOT canada.ca/CRA/IRCC head-term dominated).
   - Dedup against `/tmp/existing-posts.json` and the `/teer` cluster. Cross-link, do not cannibalize.
   - Choose a keyword-first, hyphenated `slug`. It MUST NOT match any slug in `/tmp/existing-posts.json`.

4. **Write the post JSON** to `/tmp/<slug>.json` in the shape documented in the skill,
   hitting the field targets: `title`, `seoTitle` (<=60 chars), `description` (140-160),
   `category` (ONE value from `src/lib/blog-categories.js`; audience wins the tie-break, so a
   post for international students is `international-students`), `keyTakeaway` (40-60 words),
   3-4 `faqs`, H2 `body` with short paragraphs, bullets, and a comparison table where useful. Ground every factual claim in a primary source
   (canada.ca / CRA / IRCC / reputable survey) and name the source in-copy. No em dashes.
   Set `"thumbnail": "/tmp/<slug>-thumb.png"` (generated next).

5. **Advisory fact-check (does NOT block publishing).** Re-read each factual claim in the
   draft and confirm it traces to the cited primary source. Build a `factCheck` list of
   `"<claim> - <source>"` strings for the email. If a claim cannot be verified, soften or
   cut it in the JSON, but still proceed to publish.

6. **Pick a photo and generate the thumbnail** (headline max 2 lines):
   a. Fetch photo candidates from Pexels with a concise topic query (relevant nouns; bias
      toward people and Canadian / settlement contexts):
      ```bash
      node scripts/fetch-pexels.mjs "<topic query, e.g. person budgeting finance>" 8 /tmp/pexels
      ```
   b. **LOOK at the candidates** in `/tmp/pexels/cand-*.jpg` (read the image files) and read
      `/tmp/pexels/candidates.json`. Pick the ONE most relevant to the topic and most on-brand
      (warm, human, professional). REJECT anything irrelevant, cheesy, low quality, or that shows
      another country's documents/currency (e.g. US tax forms on a Canada post). If none are
      acceptable, re-run `fetch-pexels.mjs` with a better query.
   c. Composite the chosen photo (the overlay keeps text readable over any image):
      ```bash
      THUMB_BG="/tmp/pexels/cand-<N>.jpg" \
      THUMB_EYEBROW="<the category label, e.g. Banking & money>" \
      THUMB_HEADLINE=$'<Line one>\n<Line two>' \
      THUMB_OUT="/tmp/<slug>-thumb.png" \
      node scripts/generate-post-thumbnail.mjs
      ```
   If Pexels fails entirely, omit `THUMB_BG` to fall back to the white text card, then continue.

7. **Dry-run the post, then publish:**
   ```bash
   node scripts/create-post.mjs /tmp/<slug>.json                       # dry run, review warnings
   node scripts/create-post.mjs /tmp/<slug>.json --commit --publish    # go live
   ```
   - If the dry run shows a `missing required` warning, fix the JSON before publishing.
   - If publish exits non-zero (e.g. slug guard fires), go to "On failure".

8. **Advisory live check (does NOT gate success; publishing already succeeded if step 7 exited 0).**
   Wait about 90 seconds (Sanity's CDN lags), then `curl -s https://unifysocial.ca/blog/<slug>` and
   confirm the `<title>` is the `seoTitle` and the page contains the key-takeaway callout and
   `FAQPage` JSON-LD. If it has not propagated yet, note "live check pending" in the email. Do NOT
   treat a miss here as a failure and do NOT go to "On failure" - the post is already published.

9. **Notify success:** write `/tmp/notify.json`:
   ```json
   { "status":"published","title":"<title>","slug":"<slug>",
     "url":"https://unifysocial.ca/blog/<slug>","topicReason":"<one line: the GSC/search signal>",
     "factCheck":["<claim> - <source>", "..."] }
   ```
   then `node scripts/notify-run.mjs`.

## On failure

Write `/tmp/notify.json`:
```json
{ "status":"failed","error":"<what failed and the error text>" }
```
then run `node scripts/notify-run.mjs` and STOP. Never leave a half-written or
overwritten post. Publishing is all-or-nothing.
