import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	testMatch: "**/*.spec.ts",
	timeout: 30_000,
	use: { baseURL: "http://127.0.0.1:4322", trace: "retain-on-failure" },
	webServer: { command: "pnpm dev --host 127.0.0.1 --port 4322", url: "http://127.0.0.1:4322/tools/ee-intelligence/", reuseExistingServer: true, timeout: 120_000 },
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile", use: { ...devices["Pixel 5"] } },
	],
});
