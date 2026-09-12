import { test, expect } from "@playwright/test";

// The core of this suite. Each test navigates by clicking a desktop navbar
// link so Astro's ClientRouter performs a View Transition swap (not a full
// reload), then asserts the destination island re-bound its `astro:page-load`
// handler — the regression class behind several past production bugs.

test.describe("island re-binding after View Transition navigation", () => {
  test("AboutHero carousel works after Home → About", async ({ page }) => {
    await page.goto("/");
    await page.locator("a.nav-link", { hasText: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);

    const carousel = page.locator(".ah-carousel");
    await expect(carousel).toHaveAttribute("data-ah-carousel-init", "1");
    await expect(carousel).toHaveAttribute("data-active", "0");

    await page.locator('.ah-ctrl[data-dir="1"]').click();
    await expect(carousel).toHaveAttribute("data-active", "1");

    await page.locator('.ah-ctrl[data-dir="-1"]').click();
    await expect(carousel).toHaveAttribute("data-active", "0");
  });

  test("FAQ accordion works after About → Home", async ({ page }) => {
    await page.goto("/about");
    await page.locator("a.nav-link", { hasText: "Home" }).click();
    await expect(page).toHaveURL(/\/$/);

    const item = page.locator(".faq-item").first();
    await expect(item).toHaveAttribute("data-faq-bound", "true");

    await item.locator(".faq-summary").click();
    await expect(item.locator(".faq-answer-wrap")).toHaveClass(/is-open/);
  });

  test("contact form re-binds after Home → Contact", async ({ page }) => {
    await page.goto("/");
    await page.locator("a.nav-link", { hasText: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator("#contact-form")).toHaveAttribute(
      "data-cf-bound",
      "true",
    );
  });

  test("partner form re-binds after Home → Partners", async ({ page }) => {
    await page.goto("/");
    await page.locator("a.nav-link", { hasText: "Partners" }).click();
    await expect(page).toHaveURL(/\/partners$/);
    await expect(page.locator("#bp-form")).toHaveAttribute(
      "data-bp-bound",
      "true",
    );
  });

  test("blog category filter re-binds after Home → Blog", async ({ page }) => {
    await page.goto("/");
    await page.locator("a.nav-link", { hasText: "Blog" }).click();
    await expect(page).toHaveURL(/\/blog$/);

    const filters = page.locator("#bl-filters");
    await expect(filters).toHaveAttribute("data-bf-bound", "true");

    const chip = filters.locator('[data-filter="healthcare"]');
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/\/blog\?category=healthcare$/);
    await expect(
      page.locator('.bl-grid-section [data-category]:not([hidden]):not([data-category="healthcare"])'),
    ).toHaveCount(0);
    // Positive check: either a matching post or the empty state is on screen.
    await expect(
      page
        .locator('.bl-grid-section [data-category="healthcare"]:not([hidden]), #bl-filter-empty:not([hidden])')
        .first(),
    ).toBeVisible();
  });

  test("resources category filter re-binds after Home → Resources", async ({ page }) => {
    await page.goto("/");
    await page.locator("a.nav-link", { hasText: "Resources" }).click();
    await expect(page).toHaveURL(/\/resources$/);

    const filters = page.locator(".rv-filters");
    await expect(filters).toHaveAttribute("data-rv-bound", "true");

    const chip = filters.locator('[data-filter="finance"]');
    await chip.click();
    await expect(chip).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('.rv-card:not([hidden]):not([data-category="finance"])')).toHaveCount(0);
    await expect(page.locator('.rv-card[data-category="finance"]:not([hidden])').first()).toBeVisible();
  });
});
