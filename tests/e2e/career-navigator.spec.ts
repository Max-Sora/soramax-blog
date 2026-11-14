import { expect, test } from "@playwright/test";

test("career navigator supports explore, build, and apply flows", async ({
	page,
}) => {
	await page.goto("/tools/career-navigator/");
	await expect(
		page.getByText("Reverse-plan your next academic and career move."),
	).toBeVisible();
	await expect(page.getByRole("button", { name: /EXPLORE/ })).toHaveClass(
		/active/,
	);

	await page
		.locator(".mode-tabs button")
		.nth(1)
		.evaluate((element) => (element as HTMLButtonElement).click());
	await expect(page.getByText("Resume or experience notes")).toBeVisible();
	await page
		.getByRole("button", { name: "Load SAMPLE resume" })
		.click({ force: true });
	await expect(page.getByText(/extracted item/)).toBeVisible();
	await expect(page.getByText("Your editable next steps")).toBeVisible();

	await page.locator(".mode-tabs button").nth(2).click({ force: true });
	await expect(page.locator(".mode-tabs button").nth(2)).toHaveClass(/active/);
	await expect(
		page.getByRole("heading", { name: "Job description" }),
	).toBeVisible();
	await page
		.getByRole("button", { name: "Load SAMPLE posting" })
		.click({ force: true });
	await expect(page.locator(".match-counts .status-good")).toBeVisible();
	await page.getByPlaceholder("Company").fill("Example Co");
	await page
		.getByRole("textbox", { name: "Role", exact: true })
		.fill("Firmware Intern");
	await expect(page.locator(".application-form:visible")).toBeVisible();
	await page.locator(".application-form:visible button").click({ force: true });
	await expect(
		page
			.locator(".application-list")
			.getByText("Firmware Intern", { exact: true }),
	).toBeVisible();
});
