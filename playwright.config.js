import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './test/e2e',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://127.0.0.1:3100',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'node scripts/start-e2e.mjs',
        url: 'http://127.0.0.1:3100/api/setupStatus',
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
