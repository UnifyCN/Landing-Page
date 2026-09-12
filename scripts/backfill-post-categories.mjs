// One-off backfill: set `category` on every blog post that predates the field.
// The map below covers all 41 posts published as of 2026-09-12. Tie-break rule
// (same as the Studio field description): audience wins - a post written for
// international students goes under `international-students` even when its
// subject is banking, housing, or jobs.
//
// Usage:
//   node scripts/backfill-post-categories.mjs             # dry run: validates the map, prints a summary
//   SANITY_WRITE_TOKEN=sk... node scripts/backfill-post-categories.mjs --commit
//   # or with the logged-in Sanity CLI user (no token to mint):
//   cd studio && npx sanity exec ../scripts/backfill-post-categories.mjs --with-user-token -- --commit
//
// Idempotent: only patches posts whose stored category differs. Also patches an
// open draft of the same post so a later publish does not wipe the value.
// Any published post missing from the map is reported and left untouched.

import { createClient } from '@sanity/client';
import { BLOG_CATEGORIES, isBlogCategory } from '../src/lib/blog-categories.js';

// slug -> category value. Slugs are the LIVE Sanity slugs.
const MAP = {
  // Jobs & careers
  'teer-0-and-teer-1-jobs-in-canada-what-they-are-and-why-they-matter': 'jobs-careers',
  'teer-categories-explained-teer-0-1-2-3-4-5-jobs-canada': 'jobs-careers',
  'the-easiest-skilled-jobs-to-transition-into-teer-3-for-pr-purposes-in-canada': 'jobs-careers',
  'what-actually-counts-as-skilled-work-in-canada-10-jobs-newcomers-always-miss': 'jobs-careers',
  'when-is-it-worth-switching-to-a-skilled-job-in-canada-a-simple-roadmap-for-newcomers': 'jobs-careers',
  'best-platforms-for-career-guidance-for-immigrants-in-canada': 'jobs-careers',
  'internships-and-work-integrated-learning-for-newcomers-in-canada-how-to-get-your-first-canadian-work-experience': 'jobs-careers',
  'sector-specific-training-programs-for-newcomers-in-canada-what-is-the-fast-track-to-in-demand-industries': 'jobs-careers',
  'women-focused-career-programs-for-newcomers-in-canada-targeted-employment-support': 'jobs-careers',
  'mentoring-and-professional-networks-for-newcomers-in-canada-how-to-build-your-canadian-career-network': 'jobs-careers',
  'language-for-work-programs-in-canada-beyond-linc-what-newcomers-actually-need': 'jobs-careers',
  'pre-arrival-career-programs-for-newcomers-how-to-start-your-job-search-before-you-land-in-canada': 'jobs-careers',

  // Housing & renting
  'how-to-rent-your-first-apartment-in-canada-as-a-newcomer-with-no-credit-history': 'housing-renting',

  // Immigration & status
  'how-to-get-a-sin-number-in-canada-newcomer-guide': 'immigration-status',
  'teer-4-and-5-jobs-in-canada-which-pr-pathways-still-accept-them': 'immigration-status',
  'how-entry-level-jobs-can-lead-to-permanent-residency-pr-in-canada': 'immigration-status',
  'how-to-get-pr-in-canada-lmia-and-pnp-for-international-workers': 'immigration-status',
  'canada-immigration-citizenship-guide': 'immigration-status',
  'how-to-immigrate-to-canada-in-2026': 'immigration-status',

  // Banking & money
  'tfsa-vs-rrsp-for-newcomers-to-canada-which-to-open-first': 'banking-money',
  'how-to-build-credit-in-canada-as-a-newcomer': 'banking-money',

  // Healthcare
  'how-to-find-a-family-doctor-in-bc-as-a-newcomer': 'healthcare',
  'bc-msp-wait-period-for-newcomers-how-to-stay-covered-during-the-gap': 'healthcare',

  // Taxes & government benefits
  'how-is-foreign-income-taxed-in-canada': 'taxes-benefits',
  'key-tax-refund-forms-for-newcomers-in-canada-a-guide': 'taxes-benefits',
  'how-to-file-taxes-when-you-moved-to-canada-mid-year-split-year-residency': 'taxes-benefits',
  'reporting-foreign-income-as-a-canadian-newcomer-what-must-you-declare': 'taxes-benefits',
  'how-do-newcomers-file-their-first-tax-return-in-canada-step-by-step-guide': 'taxes-benefits',
  'when-newcomers-can-claim-full-non-refundable-tax-credits-in-canada-the-90-rule-explained': 'taxes-benefits',

  // Driving & transportation
  'bc-drivers-license-for-newcomers-icbc-exchange-guide': 'driving-transportation',

  // Foreign experience & credentials
  'credential-recognition-in-canada-a-step-by-step-guide-for-internationally-trained-professionals': 'credentials',
  'bridging-programs-for-newcomers-in-canada-the-path-from-international-credentials-to-canadian-employment': 'credentials',

  // International students (audience wins the tie-break)
  'how-do-international-students-build-credit-in-canada': 'international-students',
  'how-does-health-insurance-work-for-international-students-in-canada': 'international-students',
  'how-can-international-students-find-a-part-time-job-in-canada': 'international-students',
  'how-do-international-students-open-a-bank-account-in-canada': 'international-students',
  'how-do-international-students-find-safe-affordable-housing-in-canada': 'international-students',
  'what-should-international-students-do-in-their-first-week-in-canada': 'international-students',
  '5-mistakes-international-students-make-when-applying-for-co-ops-at-sfu': 'international-students',
  'how-to-get-your-first-internship-in-canada-as-an-international-student': 'international-students',

  // Others
  'how-to-get-a-cell-phone-plan-in-canada-as-a-newcomer': 'others',
};

const COMMIT = process.argv.includes('--commit');
// SANITY_AUTH_TOKEN is what `sanity exec --with-user-token` injects.
const TOKEN = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN;

const client = createClient({
  projectId: 'j4gu2dbr',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
});

// ---- validate the map ----
const badValues = Object.entries(MAP).filter(([, v]) => !isBlogCategory(v));
if (badValues.length) {
  console.error('ERROR: unknown category value(s) in MAP:', badValues);
  process.exit(1);
}

// ---- fetch live state (published + drafts) ----
const docs = await client.fetch(
  `*[_type == "post" && defined(slug.current)]{ _id, "slug": slug.current, category }`,
);
const published = docs.filter((d) => !d._id.startsWith('drafts.'));
const drafts = new Map(docs.filter((d) => d._id.startsWith('drafts.')).map((d) => [d.slug, d]));

const missing = published.filter((d) => !MAP[d.slug]).map((d) => d.slug);
const stale = Object.keys(MAP).filter((slug) => !published.some((d) => d.slug === slug));

// ---- report ----
const counts = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c.value, 0]));
for (const v of Object.values(MAP)) counts[v]++;
console.log(`\nMapped ${Object.keys(MAP).length} slugs; ${published.length} published posts live.\n`);
for (const c of BLOG_CATEGORIES) console.log(`  ${String(counts[c.value]).padStart(3)}  ${c.label}`);

const todo = published.filter((d) => MAP[d.slug] && d.category !== MAP[d.slug]);
console.log(`\n${todo.length} post(s) need a patch (${published.length - todo.length} already correct).`);
if (missing.length) console.warn(`\nWARN ${missing.length} published post(s) not in MAP (left untouched):\n  - ${missing.join('\n  - ')}`);
if (stale.length) console.warn(`\nWARN ${stale.length} MAP slug(s) not found in Sanity:\n  - ${stale.join('\n  - ')}`);

if (!COMMIT) {
  console.log('\nDry run only. Re-run with --commit and SANITY_WRITE_TOKEN to apply.');
  process.exit(0);
}

// ---- commit ----
if (!TOKEN) {
  console.error('ERROR: set SANITY_WRITE_TOKEN (or run via `sanity exec --with-user-token`) to commit.');
  process.exit(1);
}
let ok = 0;
for (const doc of todo) {
  const category = MAP[doc.slug];
  const tx = client.transaction().patch(doc._id, (p) => p.set({ category }));
  const draft = drafts.get(doc.slug);
  if (draft && draft.category !== category) tx.patch(draft._id, (p) => p.set({ category }));
  await tx.commit();
  console.log(`set ${category.padEnd(22)} ${doc.slug}${draft ? '  (+draft)' : ''}`);
  ok++;
}
console.log(`\nDone. Patched ${ok}/${todo.length} posts.`);
