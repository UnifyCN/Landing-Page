// Generic Sanity blog-post creator. Reads a JSON content file, builds Portable
// Text, uploads the thumbnail, and writes the post. DRAFT by default (review in
// Studio, then publish); pass --publish to publish immediately.
//
//   node scripts/create-post.mjs <post.json>                       # dry run, writes nothing
//   SANITY_WRITE_TOKEN=sk... node scripts/create-post.mjs <post.json> --commit            # creates a DRAFT
//   SANITY_WRITE_TOKEN=sk... node scripts/create-post.mjs <post.json> --commit --publish  # publishes
//   ... add --force to overwrite an existing published post at the same slug (guarded by default)
//
// JSON shape:
// {
//   "slug": "my-post-slug",
//   "title": "Full editorial H1",
//   "seoTitle": "Keyword-first <=60 chars",
//   "description": "Answer-first 140-160 chars",          // used for both meta + seoDescription if seoDescription omitted
//   "category": "banking-money",                          // REQUIRED, one value from src/lib/blog-categories.js
//   "seoDescription": "(optional) overrides description in the <title>/meta",
//   "keyTakeaway": "Answer-first 40-60 word summary",
//   "craReference": "(optional) e.g. T1 General, NR74",
//   "publishedAt": "(optional) ISO; defaults to now",
//   "order": 0,
//   "thumbnail": ".design-staging/my-thumb.png",          // local path, REQUIRED to publish
//   "body": [ {"h2":"..."}, {"p":"..."}, {"li":"plain"}, {"li":["bold lead","rest"]},
//             {"table":[["H1","H2"],["a","b"]]} ],
//   "faqs": [ {"q":"...","a":"..."} ]
// }

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { BLOG_CATEGORIES, isBlogCategory } from '../src/lib/blog-categories.js';

const args = process.argv.slice(2);
const jsonPath = args.find((a) => !a.startsWith('--'));
const COMMIT = args.includes('--commit');
const PUBLISH = args.includes('--publish');
const FORCE = args.includes('--force');
if (!jsonPath) {
  console.error('Usage: node scripts/create-post.mjs <post.json> [--commit] [--publish] [--force]');
  process.exit(1);
}
const post = JSON.parse(readFileSync(jsonPath, 'utf8'));

// ---- Portable Text builders ----
let kc = 0;
const key = () => `k${kc++}`;
const span = (text, marks = []) => ({ _type: 'span', _key: key(), text, marks });
function toBlocks(items = []) {
  return items.map((it) => {
    if (it.h2 != null) return { _type: 'block', _key: key(), style: 'h2', markDefs: [], children: [span(it.h2)] };
    if (it.h3 != null) return { _type: 'block', _key: key(), style: 'h3', markDefs: [], children: [span(it.h3)] };
    if (it.p != null) return { _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [span(it.p)] };
    if (it.li != null) {
      const c = Array.isArray(it.li) ? [span(it.li[0], ['strong']), span(' ' + it.li[1])] : [span(it.li)];
      return { _type: 'block', _key: key(), style: 'normal', listItem: 'bullet', level: 1, markDefs: [], children: c };
    }
    if (it.table != null) return { _type: 'table', _key: key(), rows: it.table.map((cells) => ({ _type: 'tableRow', _key: key(), cells })) };
    throw new Error('Unknown body item: ' + JSON.stringify(it));
  });
}

function lengthWarnings() {
  const w = [];
  if ((post.seoTitle || '').length > 60) w.push(`seoTitle ${post.seoTitle.length} > 60`);
  const d = post.seoDescription || post.description || '';
  if (d.length < 140 || d.length > 160) w.push(`description ${d.length} out of 140-160`);
  if (post.keyTakeaway) {
    const words = post.keyTakeaway.trim().split(/\s+/).filter(Boolean).length;
    if (words < 35 || words > 75) w.push(`keyTakeaway ${words} words (aim 40-60)`);
  }
  if (!post.thumbnail) w.push('no thumbnail (REQUIRED to publish)');
  for (const f of ['slug', 'title', 'description', 'body']) if (!post[f]) w.push(`missing required field: ${f}`);
  if (!post.category) w.push('missing required field: category');
  else if (!isBlogCategory(post.category)) {
    w.push(`missing required field: category ("${post.category}" is not one of ${BLOG_CATEGORIES.map((c) => c.value).join(', ')})`);
  }
  return w;
}

function summary() {
  const mode = PUBLISH ? 'PUBLISH' : 'DRAFT';
  console.log(`\n[${mode}] ${post.title}`);
  console.log(`  slug:        ${post.slug}  ->  _id ${PUBLISH ? post.slug : 'drafts.' + post.slug}`);
  console.log(`  seoTitle:    ${(post.seoTitle || '(falls back to title)')} (${(post.seoTitle || '').length} chars)`);
  console.log(`  description: ${(post.seoDescription || post.description || '').length} chars`);
  console.log(`  category:    ${post.category || '(none)'}`);
  if (post.keyTakeaway) console.log(`  keyTakeaway: ${post.keyTakeaway.trim().split(/\s+/).length} words`);
  console.log(`  body:        ${(post.body || []).length} items (${(post.body || []).filter((b) => b.h2 != null).length} H2)`);
  console.log(`  faqs:        ${(post.faqs || []).length}`);
  console.log(`  thumbnail:   ${post.thumbnail || '(none)'}`);
  const w = lengthWarnings();
  console.log(w.length ? `\n  WARNINGS:\n   - ${w.join('\n   - ')}` : '\n  All checks pass.');
  return w;
}

async function commit() {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) { console.error('ERROR: set SANITY_WRITE_TOKEN to commit.'); process.exit(1); }
  if (!post.thumbnail) { console.error('ERROR: thumbnail is required.'); process.exit(1); }
  const client = createClient({ projectId: 'j4gu2dbr', dataset: 'production', apiVersion: '2024-01-01', token, useCdn: false });

  if (PUBLISH && !FORCE) {
    const existing = await client.fetch(
      `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id}`,
      { slug: post.slug },
    );
    if (existing?._id) {
      console.error(`ERROR: a published post already exists at slug "${post.slug}" (${existing._id}). Refusing to overwrite. Pass --force to override.`);
      process.exit(1);
    }
  }

  console.log('Uploading thumbnail...');
  const asset = await client.assets.upload('image', readFileSync(post.thumbnail), { filename: `${post.slug}.png` });

  const publishedAt = post.publishedAt || new Date().toISOString();
  const doc = {
    _id: PUBLISH ? post.slug : `drafts.${post.slug}`,
    _type: 'post',
    title: post.title,
    slug: { _type: 'slug', current: post.slug },
    description: post.description,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription || post.description,
    category: post.category,
    keyTakeaway: post.keyTakeaway,
    ...(post.craReference ? { craReference: post.craReference } : {}),
    publishedAt,
    updatedAt: publishedAt,
    order: post.order ?? 0,
    faqs: (post.faqs || []).map((f) => ({ _type: 'faq', _key: key(), question: f.question ?? f.q, answer: f.answer ?? f.a })),
    body: toBlocks(post.body),
    thumbnail: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
  };
  const res = await client.createOrReplace(doc);
  console.log(`\n${PUBLISH ? 'Published' : 'Draft created'}: ${res._id}`);
  if (PUBLISH) console.log(`Live at: https://unifysocial.ca/blog/${post.slug}`);
  else console.log(`Review in Studio (unify-landing.sanity.studio), then publish.`);
}

const warnings = summary();
if (COMMIT) {
  if (warnings.some((w) => w.startsWith('missing required'))) { console.error('\nRefusing to write: required fields missing.'); process.exit(1); }
  await commit();
} else {
  console.log('\nDry run. Re-run with --commit (DRAFT) or --commit --publish (live).');
}
