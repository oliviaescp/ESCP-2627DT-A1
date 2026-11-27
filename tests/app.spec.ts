import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

async function start(
  page: Page,
  scenario: "restaurant" | "consulting" = "restaurant",
) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create your first dashboard" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  if (scenario === "consulting")
    await page
      .getByRole("button", { name: "Consulting Fictional consulting scenario" })
      .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "What matters to you?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bring your information" }),
  ).toBeVisible();
}
async function generate(
  page: Page,
  scenario: "restaurant" | "consulting" = "restaurant",
) {
  await start(page, scenario);
  await page
    .getByRole("button", { name: `Load fictional ${scenario} data` })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm all selected fields" })
    .click();
  await page
    .getByRole("button", { name: "Generate dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name:
        scenario === "restaurant"
          ? "Northstar Kitchen"
          : "Northstar Consulting",
    }),
  ).toBeVisible();
  await expect(page.locator(".kpi-card")).toHaveCount(4);
}
async function checkOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("restaurant sample: evidence, warnings, manual mapping, refresh, edit, reopen and delete", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page
    .getByRole("button", { name: "Load fictional restaurant data" })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Confirm fields and generate",
      exact: true,
    }),
  ).toBeVisible();
  const revenueField = page.getByLabel(
    "Source field for Monthly revenue / revenue",
  );
  await revenueField.selectOption("sample-restaurant::food_cost");
  await revenueField.selectOption("sample-restaurant::revenue");
  await page
    .getByRole("button", { name: "Confirm all selected fields" })
    .click();
  const confirmed = await page
    .getByRole("button", { name: "Confirmed", exact: true })
    .count();
  expect(confirmed).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirmed", exact: true }),
  ).toHaveCount(confirmed);
  await page
    .getByRole("button", { name: "Generate dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Northstar Kitchen", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".kpi-card").first()).toContainText("€128.4K");
  const summary = page.getByRole("region", { name: "AI summary" });
  await expect(summary).toContainText("Monthly revenue was €128.4K, up €2,520");
  await expect(summary).toContainText("Food cost is on watch");
  await summary.getByRole("button", { name: "Review Food cost" }).click();
  await expect(page.getByRole("dialog", { name: "Food cost" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "View evidence for Monthly revenue" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "restaurant_fictional_2026.csv",
  );
  await expect(page.getByRole("dialog")).toContainText("2026-10-01");
  await expect(page.getByRole("dialog")).toContainText("revenue: 128,400");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "View evidence for Monthly revenue" }),
  ).toBeFocused();
  await page.locator(".warning-row").first().click();
  await expect(page.getByRole("dialog")).toContainText("Rule:");
  await page
    .getByRole("button", { name: "Review source", exact: false })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("Original fields");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Northstar Kitchen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit dashboard", exact: true })
    .click();
  await page
    .getByLabel("Company or project", { exact: true })
    .fill("Anna’s Kitchen");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm all selected fields" })
    .click();
  await page
    .getByRole("button", { name: "Generate dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Anna’s Kitchen", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Open dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Anna’s Kitchen", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Anna’s Kitchen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome to dAIshi." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("consulting journey and source deletion invalidate dependent results", async ({
  page,
}) => {
  await generate(page, "consulting");
  await expect(page.locator(".kpi-card")).toContainText([
    "Project revenue",
    "Project completion",
    "Team utilization",
    "Client satisfaction",
  ]);
  await page.getByRole("link", { name: "Sources", exact: true }).click();
  await page
    .getByRole("button", { name: "Inspect source", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "consulting_fictional_2026.csv",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Delete consulting_fictional_2026.csv" })
    .click();
  await page
    .getByRole("button", { name: "Delete source", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No sources yet" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Open dashboard", exact: true })
    .click();
  await expect(page.locator(".kpi-card").first()).toContainText("Unavailable");
});

test("sample shortcut, combined filters, empty results, and reset", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const launch = page.getByRole("main", { name: "dAIshi launch" });
  await expect(
    launch.getByRole("heading", { name: "dAIshi", exact: true }),
  ).toBeVisible();
  await expect(launch.locator(".launch-mark")).toHaveCSS(
    "animation-name",
    "launch-mark-in",
  );
  await expect(
    page.getByRole("heading", { name: "Welcome to dAIshi." }),
  ).toBeVisible();
  await expect(launch).toHaveCount(0);
  await page.getByRole("button", { name: "Start guide", exact: true }).click();
  const guide = page.getByRole("dialog");
  const nextGuideStep = guide.getByRole("button", {
    name: "Continue",
    exact: true,
  });
  const preview = guide.getByRole("region", { name: "Practice dashboard" });
  await expect(
    guide.getByRole("heading", { name: "Choose a business" }),
  ).toBeVisible();
  await guide.getByRole("radio", { name: /Consulting/ }).check();
  await expect(preview).toContainText("€100K");
  await nextGuideStep.click();
  await guide.getByRole("checkbox", { name: "Project completion" }).check();
  await expect(preview).toContainText("66.7%");
  await nextGuideStep.click();
  await guide.getByLabel("Revenue column").selectOption("completed_projects");
  await nextGuideStep.click();
  await expect(guide.getByRole("alert")).toContainText("holds total revenue");
  await guide.getByLabel("Revenue column").selectOption("revenue");
  await nextGuideStep.click();
  const practiceProject = guide.getByRole("combobox", {
    name: "Project",
    exact: true,
  });
  await practiceProject.selectOption("Atlas");
  await expect(preview).toContainText("€45K");
  await guide.getByRole("button", { name: "Pause guide", exact: true }).click();
  await page.getByRole("button", { name: "Resume guide", exact: true }).click();
  await expect(practiceProject).toHaveValue("Atlas");
  await nextGuideStep.click();
  await guide
    .getByRole("button", { name: "View project revenue evidence" })
    .click();
  await expect(
    guide.getByRole("region", { name: "KPI evidence" }),
  ).toContainText("consulting_fictional_2026.csv");
  await nextGuideStep.click();
  await guide.getByRole("radio", { name: "Change the target" }).check();
  await nextGuideStep.click();
  await expect(guide.getByRole("alert")).toContainText(
    "calculation and source",
  );
  await guide.getByRole("radio", { name: "Open its evidence" }).check();
  await nextGuideStep.click();
  await expect(
    guide.getByRole("button", { name: "Open practice dashboard" }),
  ).toBeVisible();
  await guide.getByRole("button", { name: "Done", exact: true }).click();
  await expect(guide).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create your first dashboard" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Consulting sample", exact: true })
    .click();
  const revenue = page
    .locator(".kpi-card")
    .filter({ hasText: "Project revenue" });
  await expect(revenue).toContainText("€100K");
  const summary = page.getByRole("region", { name: "AI summary" });
  await expect(summary).toContainText("Project revenue was €100K");

  const filters = page.getByRole("button", {
    name: "Dates and filters",
    exact: true,
  });
  const apply = page.getByRole("button", {
    name: "Apply to dashboard",
    exact: true,
  });
  await filters.click();
  await page.getByRole("checkbox", { name: "Atlas", exact: true }).check();
  await page.getByRole("checkbox", { name: "Willow", exact: true }).check();
  await apply.click();
  await expect(revenue).toContainText("€70K");
  await expect(summary).toContainText("Project revenue was €70K");
  await expect(filters).toBeFocused();

  await filters.click();
  await page.getByLabel("Filter by field").selectOption("project_status");
  await page.getByRole("checkbox", { name: "Completed", exact: true }).check();
  await apply.click();
  await expect(revenue).toContainText("€45K");
  await expect(
    page.getByRole("button", { name: "Remove Project status: Completed" }),
  ).toBeVisible();
  await expect(
    page.getByText("Saved on this browser.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(revenue).toContainText("€45K");

  await page.getByRole("button", { name: "Remove Project: Atlas" }).click();
  await expect(page.getByText(/No KPI values are available/)).toBeVisible();
  await expect(summary).toContainText(
    "The current view has no KPI values to summarize",
  );
  await expect(revenue).toContainText("Unavailable");
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect(revenue).toContainText("€100K");
  await expect(
    page.getByRole("button", { name: "Reset view", exact: true }),
  ).toHaveCount(0);

  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.getByText("Welcome back", { exact: true })).toBeVisible();
  const reopenGuide = page.getByRole("button", {
    name: "Quick guide",
    exact: true,
  });
  await reopenGuide.click();
  await expect(
    guide.getByRole("heading", { name: "Choose a business" }),
  ).toBeVisible();
  await guide
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(reopenGuide).toBeFocused();
  await page.reload();
  await page.getByRole("button", { name: "Skip intro", exact: true }).click();
  await expect(reopenGuide).toBeVisible();
});

test("local CSV and XLSX uploads calculate real values and reject invalid files", async ({
  page,
}) => {
  await start(page);
  const input = page.getByLabel("Choose CSV or XLSX files");
  await input.setInputFiles({
    name: "broken.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("not a workbook"),
  });
  await expect(page.getByRole("alert")).toContainText("not a readable XLSX");
  await input.setInputFiles({
    name: "old.xls",
    mimeType: "application/vnd.ms-excel",
    buffer: Buffer.from("fake"),
  });
  await expect(page.getByRole("alert")).toContainText(
    "Unsupported file format",
  );
  await input.setInputFiles({
    name: "empty.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(""),
  });
  await expect(page.getByRole("alert")).toContainText("empty");
  await input.setInputFiles({
    name: "too-big.csv",
    mimeType: "text/csv",
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1, 65),
  });
  await expect(page.getByRole("alert")).toContainText("larger than 2 MB");
  await input.setInputFiles(path.resolve("tests/fixtures/restaurant.xlsx"));
  await expect(page.getByRole("dialog")).toContainText("2 rows · 6 fields");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm all selected fields" })
    .click();
  await page
    .getByRole("button", { name: "Generate dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Northstar Kitchen", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".kpi-card").first()).toContainText("€1.2K");
  await expect(page.locator(".context-card")).toContainText("Local uploads");
  // A separate CSV journey verifies the second parser and zero-denominator state.
  await page
    .getByRole("button", { name: "Create dashboard", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Choose CSV or XLSX files").setInputFiles({
    name: "zero.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "date,revenue,food_cost,customers,repeat_customers,employee_satisfaction\n2026-10-01,0,0,0,0,8",
    ),
  });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm all selected fields" })
    .click();
  await page
    .getByRole("button", { name: "Generate dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Northstar Kitchen", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".kpi-card").filter({ hasText: "Food cost" }),
  ).toContainText("Unavailable");
});

test("phone widths, both themes, modal keyboard and automated accessibility", async ({
  page,
}) => {
  await generate(page);
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await checkOverflow(page);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await expect(
      page.getByRole("link", { name: "Settings", exact: true }),
    ).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["light", "dark"]) {
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Theme", exact: true })
      .selectOption(theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const settings = await new AxeBuilder({ page }).analyze();
    expect(settings.violations).toEqual([]);
    await page.getByRole("link", { name: "Overview", exact: true }).click();
    await page.getByRole("button", { name: "Open dashboard" }).click();
    // Allow the chart's initial line drawing to complete before visual review.
    await page.waitForTimeout(1600);
    await page.screenshot({
      path: `test-results/dashboard-${theme}.png`,
      fullPage: true,
    });
    const dashboard = await new AxeBuilder({ page }).analyze();
    expect(dashboard.violations).toEqual([]);
    await page
      .getByRole("button", { name: "View evidence for Monthly revenue" })
      .click();
    await page.screenshot({
      path: `test-results/dashboard-evidence-${theme}.png`,
    });
    for (const key of [
      "Shift+Tab",
      ...Array(15).fill("Tab"),
      ...Array(15).fill("Shift+Tab"),
    ]) {
      await page.keyboard.press(key);
      expect(
        await page.evaluate(() => !!document.activeElement?.closest("dialog")),
      ).toBe(true);
    }
    await checkOverflow(page);
    const evidence = await new AxeBuilder({ page }).analyze();
    expect(evidence.violations).toEqual([]);
    await page.keyboard.press("Escape");
  }
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("damaged saved state has explicit recovery and workspace deletion", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("daishi.workspace.v1", "{broken"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("could not be read");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Clear local workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete all local data", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.waitForTimeout(500);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Create your first dashboard" }),
  ).toBeVisible();
});

test("custom KPI stays metadata-only and draft selections survive back and refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create your first dashboard" })
    .click();
  await page.getByText("Advanced context", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "Original assumption", exact: true })
    .fill("Keep food waste below 5% during expansion.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Add custom KPI", exact: true })
    .click();
  await page.getByLabel("Custom KPI name", { exact: true }).fill("Food waste");
  await page
    .getByRole("textbox", { name: "Definition", exact: true })
    .fill("Discarded food divided by food purchased.");
  await page
    .getByRole("button", { name: "Add definition", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Load fictional restaurant data" })
    .click();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText(
    "restaurant_fictional_2026.csv",
  );
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Food waste", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Metadata only");
  await page
    .getByRole("button", { name: "Confirm all selected fields" })
    .click();
  await page
    .getByRole("button", { name: "Generate dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Northstar Kitchen", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".kpi-card").filter({ hasText: "Food waste" }),
  ).toContainText("Unavailable");
  await page
    .getByRole("button", { name: "View evidence for Food waste" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Metadata only");
});

test("storage quota errors remain visible and do not prevent in-memory work", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "daishi.workspace.v1")
        throw new DOMException("Test quota", "QuotaExceededError");
      return set.call(this, key, value);
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create your first dashboard" })
    .click();
  await page
    .getByLabel("Company or project", { exact: true })
    .fill("In-memory kitchen");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Load fictional restaurant data" })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm all selected fields" })
    .click();
  await page
    .getByRole("button", { name: "Generate dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "In-memory kitchen", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".notice").filter({ hasText: "Changes are only in memory" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("daishi.workspace.v1")),
  ).toBeNull();
});
