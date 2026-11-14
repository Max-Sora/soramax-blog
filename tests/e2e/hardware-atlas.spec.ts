import { expect, test } from "@playwright/test";

test("hardware atlas traces GPU fault to a case and diagnosis context", async ({ page }) => {
	await page.goto("/tools/ee-intelligence/hardware-atlas/");
	await expect(page.getByText("Hardware Atlas", { exact: true }).first()).toBeVisible();
	await expect(page.getByText("Educational Simulation — Not Live Hardware Telemetry")).toBeVisible();
	await page.getByRole("button", { name: /Thermal throttling/ }).first().click();
	await expect(page.getByText("FAULT VISUALIZATION")).toBeVisible();
	await expect(page.getByText("clock headroom ↓")).toBeVisible();
	await page.getByRole("button", { name: /Black Screen/ }).first().click();
	await expect(page.getByRole("heading", { name: "Black Screen evidence queue" })).toBeVisible();
	await page.getByRole("link", { name: /Inspect case/ }).first().click();
	await expect(page).toHaveURL(/case-explorer/);
	await expect(page.getByRole("heading", { name: "Evidence, in context." })).toBeVisible();
	await page.getByRole("link", { name: /Run Diagnosis with this context/ }).click();
	await expect(page).toHaveURL(/diagnosis/);
	await expect(page.getByRole("heading", { name: "Diagnosis starts with context." })).toBeVisible();
});

test("hardware atlas stays usable on the mobile project", async ({ page }) => {
	await page.goto("/tools/ee-intelligence/hardware-atlas/?module=ram&symptom=bsod");
	await expect(page.getByRole("heading", { name: "RAM 内存" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Start from what you can observe" })).toBeVisible();
	const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
	expect(noHorizontalOverflow).toBeTruthy();
});
