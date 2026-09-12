import { test, expect } from "@playwright/test";

// The /blog category chips are the blog's only interactive island. The filter
// is applied twice: on the server for `?category=` (so the post page's category
// link lands pre-filtered) and in the client on chip clicks. Both paths must
// agree, and "All" must clear the URL param again. Data-agnostic on purpose -
// it runs against live Sanity content, so it never assumes a specific post.
test.describe("blog category filter", () => {
  test("?category= pre-selects the chip on the server", async ({ page }) => {
    await page.goto("/blog?category=others");

    const filters = page.locator("#bl-filters");
    await expect(filters).toHaveAttribute("data-bf-bound", "true");
    await expect(filters.locator('[data-filter="others"]')).toHaveAttribute("aria-selected", "true");
    await expect(filters.locator('[data-filter="all"]')).toHaveAttribute("aria-selected", "false");
    await expect(
      page.locator('.bl-grid-section [data-category]:not([hidden]):not([data-category="others"])'),
    ).toHaveCount(0);
  });

  test("an unknown ?category= falls back to All", async ({ page }) => {
    await page.goto("/blog?category=not-a-category");
    await expect(page.locator('#bl-filters [data-filter="all"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".bl-grid-section [data-category][hidden]")).toHaveCount(0);
  });

  test("All clears the filter and the URL param", async ({ page }) => {
    await page.goto("/blog?category=others");
    const total = await page.locator(".bl-grid-section [data-category]").count();

    await page.locator('#bl-filters [data-filter="all"]').click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.locator(".bl-grid-section [data-category]:not([hidden])")).toHaveCount(total);
    await expect(page.locator("#bl-filter-empty")).toBeHidden();
  });
});
