import { test, expect } from '@playwright/test';

test('Rundenanzeige lässt sich unabhängig von Scanner-Namen und Regeln deaktivieren und wieder aktivieren', async ({ page, browser }) => {
    const original = await (await page.request.get('/api/moduleConfig')).json();
    expect(original.roundDisplay).toBe(true);
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    await page.goto('/scan');
    await expect(page.getByRole('link', { name: /Rundenanzeige für/ })).toBeVisible();
    const deviceId = await page.evaluate(() => localStorage.getItem('sponsorenlauf.deviceId'));
    const displayContext = await browser.newContext();
    try {
        const display = await displayContext.newPage();
        await display.goto(`/display?device=${deviceId}`);
        await expect(display.locator('.student-display-connection')).toContainText('Scanner');
        await page.goto('/setup');
        await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Module verwalten', exact: true }).click();
        const toggle = page.getByLabel('Rundenanzeige aktivieren', { exact: true });
        const save = page.locator('.setup-view:not([hidden])').getByRole('button', { name: 'Änderungen speichern', exact: true });
        await expect(toggle).toBeChecked();
        await page.locator('.module-toggle').filter({ has: toggle }).click();
        await save.click();
        await expect(save).toBeDisabled();
        expect((await (await page.request.get('/api/moduleConfig')).json()).roundDisplay).toBe(false);
        await expect(display.getByRole('heading', { name: 'Rundenanzeige ist deaktiviert' })).toBeVisible();
        expect((await page.request.get(`/api/scan-feed?device=${deviceId}&view=display`)).status()).toBe(403);
        await page.goto('/scan');
        await expect(page.getByRole('button', { name: /Scanner-Name ändern:/ })).toBeVisible();
        await expect(page.getByRole('link', { name: /Rundenanzeige für/ })).toHaveCount(0);
        await page.getByRole('button', { name: 'Einstellungen öffnen', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Rundenanzeige verbinden', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Scanner-Regeln öffnen', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        // Opening a disabled display must not discover devices or subscribe to scans.
        const displayRequests = [];
        display.on('request', request => {
            if (/\/api\/(scan-devices|scan-feed)/.test(request.url())) displayRequests.push(request.url());
        });
        await display.reload();
        await expect(display.getByRole('heading', { name: 'Rundenanzeige ist deaktiviert' })).toBeVisible();
        expect(displayRequests).toEqual([]);
        // Older clients omitting the new option must preserve the saved setting.
        const { roundDisplay: _, ...olderConfig } = original;
        await page.request.post('/api/moduleConfig', { data: olderConfig });
        expect((await (await page.request.get('/api/moduleConfig')).json()).roundDisplay).toBe(false);
        await page.goto('/setup');
        await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Module verwalten', exact: true }).click();
        await expect(toggle).not.toBeChecked();
        await page.locator('.module-toggle').filter({ has: toggle }).click();
        await save.click();
        await expect(save).toBeDisabled();
        await display.evaluate(() => window.dispatchEvent(new Event('focus')));
        await expect(display.locator('.student-display-connection')).toContainText('Scanner');
        await page.goto('/statistics');
        await expect(page.getByRole('link', { name: /Rundenanzeige für/ })).toBeVisible();
    } finally {
        await page.request.post('/api/moduleConfig', { data: original });
        await displayContext.close();
    }
});

test('Moduleinstellungen erhalten ausgelassene Optionen und lehnen ungültige Scan-Konfigurationen ab', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    const original = await (await page.request.get('/api/moduleConfig')).json();
    const config = { ...original, roundDisplay: false, doubleScanPrevention: { enabled: false, timeThresholdMinutes: 7, mode: 'block' } };
    try {
        expect((await page.request.post('/api/moduleConfig', { data: config })).ok()).toBe(true);
        const { roundDisplay: _, doubleScanPrevention: __, ...partial } = config;
        expect((await page.request.post('/api/moduleConfig', { data: partial })).ok()).toBe(true);
        expect(await (await page.request.get('/api/moduleConfig')).json()).toEqual(config);
        for (const value of [false, null, { enabled: true, timeThresholdMinutes: 1.5, mode: 'confirm' }]) {
            expect((await page.request.post('/api/moduleConfig', { data: { ...config, doubleScanPrevention: value } })).status()).toBe(400);
        }
        expect(await (await page.request.get('/api/moduleConfig')).json()).toEqual(config);
    } finally { await page.request.post('/api/moduleConfig', { data: original }); }
});
