import { expect, test } from "@playwright/test";

test("EE Intelligence links Phase 2, Hardware Atlas, Case Explorer, Diagnosis and Board Lab", async ({
	page,
}) => {
	await page.goto("/tools/ee-intelligence/");
	await expect(
		page.getByText("EE INTELLIGENCE", { exact: false }).first(),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: /Hardware Atlas/ }).first(),
	).toHaveAttribute("href", /hardware-atlas/);
	await expect(
		page.getByRole("link", { name: /Board Lab/ }).first(),
	).toHaveAttribute("href", /board-lab/);

	await page.goto("/tools/ee-intelligence/case-explorer/");
	await expect(
		page.getByRole("heading", { name: /Evidence, in context/ }),
	).toBeVisible();
	await page.goto("/tools/ee-intelligence/diagnosis/");
	await expect(
		page.getByRole("heading", { name: /Diagnosis starts with context/ }),
	).toBeVisible();
});
