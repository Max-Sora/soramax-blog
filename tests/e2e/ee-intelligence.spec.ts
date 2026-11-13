import { expect, test } from "@playwright/test";

test("desktop core flow exposes event evidence and Signal Lab", async ({ page }, testInfo) => {
	await page.goto("/tools/ee-intelligence/");
	await expect(page.getByText("EE INTELLIGENCE · PHASE 2")).toBeVisible();
	await expect(page.getByText("PUBLIC READ-ONLY", { exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "EVENT INTELLIGENCE 聚合事件与证据" })).toBeVisible();
	await expect(page.getByText("Ranked event queue")).toBeVisible();
	await page.getByRole("button", { name: "SIGNAL LAB 历史回测实验" }).click();
	await expect(page.getByText("Backtest snapshot")).toBeVisible();
	await expect(page.getByText("NO LOOKAHEAD")).toBeVisible();
	await page.locator(".ee-shell").screenshot({ path: `docs/ee-intelligence/screenshots/phase2-${testInfo.project.name}-component.png`, fullPage: true });
});

test("live mode is explicit and does not silently switch to synthetic", async ({ page }) => {
	await page.goto("/tools/ee-intelligence/");
	await page.getByRole("button", { name: "Live public RSS" }).click();
	await expect(page.getByText("LIVE · 公开 RSS 快照")).toBeVisible();
	await expect(page.getByText("Live public RSS")).toHaveClass(/active/);
	await page.getByRole("button", { name: "METHOD & LIMITS 边界与审计线索" }).click();
	await expect(page.getByText("Public RSS feeds")).toBeVisible();
	await expect(page.getByText("What is implemented")).toBeVisible();
});

test("mobile layout keeps mode controls reachable", async ({ page }, testInfo) => {
	await page.goto("/tools/ee-intelligence/");
	await expect(page.getByRole("button", { name: "Live public RSS" })).toBeVisible();
	await page.getByRole("button", { name: "SIGNAL LAB 历史回测实验" }).click();
	await expect(page.getByText("Signal delay bars")).toBeVisible();
	await page.locator(".ee-shell").screenshot({ path: `docs/ee-intelligence/screenshots/phase2-mobile-${testInfo.project.name}-component.png`, fullPage: true });
});
