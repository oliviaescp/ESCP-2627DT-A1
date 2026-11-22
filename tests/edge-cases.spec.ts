import { test, expect, type Page } from "@playwright/test";

// Discussion draft for ESCP-2627DT-A1.
// Confirm the exact user-facing wording with the team before merging.

async function openUploadStep(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create your first dashboard" })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bring your information" }),
  ).toBeVisible();
}

async function generateFromCsv(
  page: Page,
  fileName: string,
  csv: string,
) {
  await page
    .getByLabel("Choose CSV or XLSX files")
    .setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm all selected fields" })
    .click();
  await page
    .getByRole("button", { name: "Generate dashboard", exact: true })
    .click();
}

test("invalid dates make dependent KPIs unavailable", async ({ page }) => {
  await openUploadStep(page);
  await generateFromCsv(
    page,
    "invalid-date.csv",
    [
      "date,revenue,customers,repeat_customers,employee_satisfaction",
      "2026-10-01,1200,100,30,8",
      "not-a-date,1300,110,35,8",
    ].join("\n"),
  );

  await expect(page.locator("body")).toContainText(/invalid date|unavailable/i);
});

test("duplicate rows are surfaced instead of silently double-counted", async ({
  page,
}) => {
  await openUploadStep(page);
  await generateFromCsv(
    page,
    "duplicate-rows.csv",
    [
      "date,revenue,customers,repeat_customers,employee_satisfaction",
      "2026-10-01,1200,100,30,8",
      "2026-10-01,1200,100,30,8",
    ].join("\n"),
  );

  await expect(page.locator("body")).toContainText(/duplicate|unavailable/i);
});

test("impossible population ratios do not produce a plausible KPI", async ({
  page,
}) => {
  await openUploadStep(page);
  await generateFromCsv(
    page,
    "impossible-ratio.csv",
    [
      "date,revenue,customers,repeat_customers,employee_satisfaction",
      "2026-10-01,1200,10,25,8",
    ].join("\n"),
  );

  await expect(page.locator("body")).toContainText(
    /impossible|invalid|unavailable/i,
  );
});

test("a missing comparison period leaves the trend unknown", async ({ page }) => {
  await openUploadStep(page);
  await generateFromCsv(
    page,
    "single-period.csv",
    [
      "date,revenue,customers,repeat_customers,employee_satisfaction",
      "2026-10-01,1200,100,30,8",
    ].join("\n"),
  );

  await expect(page.locator("body")).toContainText(
    /missing comparison|comparison.*unknown|trend.*unknown|unknown/i,
  );
});
