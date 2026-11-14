import { expect, test } from "@playwright/test";

test("board lab renders a parsed board and cross-probes a pin to its net", async ({
	page,
}, testInfo) => {
	await page.goto("/tools/ee-intelligence/board-lab/");
	await expect(
		page.getByText("BOARD INTELLIGENCE · AI REPAIR LAB"),
	).toBeVisible();
	await expect(
		page.getByText("framework-input-module.kicad_pcb"),
	).toBeVisible();
	await expect(page.getByText("VIN_19V")).toBeVisible();
	await page.waitForTimeout(2000);
	await page
		.locator(".tabs button")
		.nth(1)
		.evaluate((element) => (element as HTMLButtonElement).click());
	await expect(page.locator(".explorer h2")).toHaveText("Net Explorer");
	await page
		.locator(".net-list button")
		.filter({ hasText: "+3V3" })
		.first()
		.evaluate((element) => (element as HTMLButtonElement).click());
	await expect(page.getByText("C43.1")).toBeVisible();
	await page
		.locator(".tabs button")
		.nth(2)
		.evaluate((element) => (element as HTMLButtonElement).click());
	await page.waitForTimeout(100);
	await expect(page.locator(".tabs button").nth(2)).toHaveClass(/active/);
	await page
		.locator(".tabs button")
		.nth(3)
		.evaluate((element) => (element as HTMLButtonElement).click());
	await page.waitForTimeout(100);
	await expect(page.locator(".tabs button").nth(3)).toHaveClass(/active/);
	await page.screenshot({
		path: `docs/ee-intelligence/screenshots/board-lab-${testInfo.project.name}.png`,
		fullPage: true,
	});
});
