import { expect, test } from "@playwright/test";
import { login, openStudent, useEnglish } from "./helpers";

const AI_TIMEOUT = 120_000;
test.beforeEach(async ({ page }) => useEnglish(page));

test("educator generates, edits and approves an AI IEP", async ({ page }) => {
  await login(page, "educator");
  await openStudent(page, "Vihaan Reddy");
  await page.getByRole("tab", { name: "IEP" }).click();

  // With no IEP the generate form is shown directly; otherwise "Generate a new draft" opens it first.
  const generate = page.getByRole("button", { name: /Generate with AI|Generate a new draft/ });
  await generate.first().click();
  const languagePicker = page.getByRole("combobox", { name: "Language of the draft" });
  if (await languagePicker.isVisible().catch(() => false)) await generate.last().click();
  const drafting = page.getByRole("status").filter({ hasText: "Drafting IEP goals…" });
  await expect(drafting).toBeVisible();
  // Wait for the new draft itself: an older open draft may already be on screen while this one generates.
  await expect(drafting).toBeHidden({ timeout: AI_TIMEOUT });
  await expect(page.getByTestId("ai-draft-badge")).toBeVisible();

  // Edit before approving: the educator has the final say.
  const presentLevels = page.getByRole("textbox", { name: "Present levels of performance" });
  await presentLevels.fill("Vihaan is curious and loves hands-on science. Edited by the educator.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Draft saved")).toBeVisible();

  await page.getByRole("button", { name: "Approve IEP" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Approve this IEP?");
  await page.getByRole("button", { name: "Yes, approve" }).click();
  await expect(page.getByText("IEP approved")).toBeVisible();
  await expect(page.getByTestId("ai-draft-badge")).toHaveCount(0);
  await expect(page.getByText(/Approved on/)).toBeVisible();
});

test("educator generates a worksheet, previews it and shares it with the parent", async ({ page }) => {
  await login(page, "educator");
  await openStudent(page, "Aarav Sharma");
  await page.getByRole("tab", { name: "Worksheets" }).click();

  await page.getByLabel(/^Subject/).fill("Maths");
  await page.getByLabel(/^Topic/).fill("Adding within 10 using mangoes");
  await page.getByLabel(/Large print/).check();
  await page.getByRole("button", { name: "Generate worksheet" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Creating your worksheet…" })).toBeVisible();

  const sheet = page.locator("article.worksheet").first();
  await expect(sheet).toBeVisible({ timeout: AI_TIMEOUT });
  await expect(sheet).toHaveClass(/ws-large-print/);

  await page.getByRole("button", { name: "Share with parent" }).click();
  await expect(page.getByText("Shared with parents")).toBeVisible();

  await page.getByRole("link", { name: "Print view" }).click();
  await expect(page).toHaveURL(/\/app\/worksheets\/[a-f0-9]{24}\/print/);
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
});
