// Canonical blog categories. Single source of truth for:
//   - the Sanity `post.category` dropdown  (studio/schemaTypes/post.ts)
//   - the /blog filter chips + card labels  (src/pages/blog/index.astro)
//   - scripts/create-post.mjs validation    (weekly blog automation)
//
// Plain JS (with JSDoc types) rather than TS so the Node scripts can import it
// without a loader. `value` is what is stored in Sanity - never rename a value
// without a backfill (see scripts/backfill-post-categories.mjs).

export const BLOG_CATEGORIES = /** @type {const} */ ([
  { value: 'jobs-careers', label: 'Jobs & careers' },
  { value: 'housing-renting', label: 'Housing & renting' },
  { value: 'immigration-status', label: 'Immigration & status' },
  { value: 'banking-money', label: 'Banking & money' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'taxes-benefits', label: 'Taxes & government benefits' },
  { value: 'driving-transportation', label: 'Driving & transportation' },
  { value: 'credentials', label: 'Foreign experience & credentials' },
  { value: 'international-students', label: 'International students' },
  { value: 'others', label: 'Others' },
]);

/** Used for posts that predate the field or have an unknown value. */
export const FALLBACK_BLOG_CATEGORY = 'others';

/** @typedef {(typeof BLOG_CATEGORIES)[number]['value']} BlogCategory */

/** @type {ReadonlySet<string>} */
const VALUES = new Set(BLOG_CATEGORIES.map((c) => c.value));

/**
 * @param {unknown} value
 * @returns {value is BlogCategory}
 */
export const isBlogCategory = (value) => typeof value === 'string' && VALUES.has(value);

/**
 * Normalise a stored value to a known category (falls back to `others`).
 * @param {unknown} value
 * @returns {BlogCategory}
 */
export const toBlogCategory = (value) => (isBlogCategory(value) ? value : FALLBACK_BLOG_CATEGORY);

/**
 * @param {unknown} value
 * @returns {string}
 */
export const blogCategoryLabel = (value) => {
  const cat = toBlogCategory(value);
  return BLOG_CATEGORIES.find((c) => c.value === cat)?.label ?? 'Others';
};
