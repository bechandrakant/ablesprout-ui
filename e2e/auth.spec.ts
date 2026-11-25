import { expect, test } from "@playwright/test";
import { login, useEnglish } from "./helpers";

test.beforeEach(async ({ page }) => useEnglish(page));

test("landing page shows the hero and pilot form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Every child can learn — with the right support." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Become a pilot school" })).toBeVisible();
  await expect(page.getByRole("link", { name: "hello@ablesprout.com" })).toBeVisible();
});

test("unauthenticated users are sent to login", async ({ page }) => {
  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fdashboard/);
});

test("admin sees inclusion analytics and the Team page", async ({ page }) => {
  await login(page, "admin");
  await expect(page.getByText("With an approved IEP")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Students by support need" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Educator activity (last 30 days)" })).toBeVisible();
  await page.goto("/app/team");
  await expect(page.getByRole("heading", { level: 1, name: "Team" })).toBeVisible();
});

test("educator sees caseload and quick actions, but not Team", async ({ page }) => {
  await login(page, "educator");
  await expect(page.getByRole("button", { name: "Generate IEP" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "My students" })).toBeVisible();
  await page.goto("/app/team");
  await expect(page).toHaveURL(/\/app\/dashboard/);
});

test("parent sees only their child, read-only", async ({ page }) => {
  await login(page, "parent");
  await expect(page.getByRole("heading", { name: "Aarav Sharma" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Goal progress" })).toBeVisible();
  await page.goto("/app/students");
  await expect(page.getByRole("link", { name: /Aarav Sharma/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Zoya Khan/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add student" })).toHaveCount(0);
});

test("sign out returns to login", async ({ page }) => {
  await login(page, "educator");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
