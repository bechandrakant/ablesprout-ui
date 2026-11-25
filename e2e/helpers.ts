import { expect, type Page } from "@playwright/test";

export const PASSWORD = process.env.E2E_PASSWORD ?? "Demo@12345";
export const USERS = {
  admin: { email: "admin@sunrise.example", name: "Priya" },
  educator: { email: "kavya@sunrise.example", name: "Kavya" },
  parent: { email: "sunita@parent.example", name: "Sunita" },
} as const;

/** Always run in English so assertions are stable, whatever the user's saved preference. */
export const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 3100}`;

export async function useEnglish(page: Page) {
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", url: BASE_URL }]);
}

export async function login(page: Page, who: keyof typeof USERS) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(USERS[who].email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/app/dashboard");
  // The login form may switch the UI to the user's preferred language; force English again.
  await useEnglish(page);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(`Namaste, ${USERS[who].name}`) })).toBeVisible();
}

/** Opens a student from the list by name (works on mobile and desktop). */
export async function openStudent(page: Page, name: string) {
  await page.goto("/app/students");
  await page.getByLabel("Search").fill(name.split(" ")[0]);
  await page.getByRole("link", { name: new RegExp(name) }).first().click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}
