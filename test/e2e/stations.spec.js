import { test, expect } from '@playwright/test';

const openRules = async page => {
    await page.getByRole('button', { name: 'Einstellungen öffnen', exact: true }).click();
    await page.getByRole('button', { name: 'Scanner-Regeln öffnen', exact: true }).click();
    return page.getByRole('dialog', { name: 'Scanner-Regeln', exact: true });
};

test('Scanner-Regeln funktionieren ohne Setup und gelten nur für den jeweiligen Laptop', async ({ page, browser }) => {
    await page.goto('/scan');
    const dialog = await openRules(page);
    await expect(dialog.getByRole('radio', { name: 'Alle zulassen' })).toBeChecked();
    await dialog.getByRole('radio', { name: 'Blockieren' }).check();
    await dialog.getByRole('checkbox', { name: 'Jahrgang 5' }).check();
    await dialog.getByRole('button', { name: 'Änderungen speichern' }).click();
    await expect(dialog).not.toBeVisible();
    const deviceId = await page.evaluate(() => localStorage.getItem('sponsorenlauf.deviceId'));
    const rules = await (await page.request.get(`/api/scanner-rules?deviceId=${deviceId}`)).json();
    expect(rules.stations[0]).toMatchObject({ mode: 'block', grades: ['5'] });
    expect((await page.request.put('/api/scanner-rules', {
        headers: { 'sec-fetch-site': 'cross-site' }, data: { deviceId, mode: 'allow', classes: [], grades: [] },
    })).status()).toBe(403);
    const otherContext = await browser.newContext();
    try {
        const other = await otherContext.newPage();
        await other.goto('/scan');
        const otherDialog = await openRules(other);
        await expect(otherDialog.getByRole('radio', { name: 'Alle zulassen' })).toBeChecked();
        await otherDialog.getByRole('button', { name: 'Abbrechen', exact: true }).click();
        // The server must enforce saved rules even before the client loads its menu.
        await page.request.put('/api/scanner-rules', { data: { deviceId, mode: 'block', classes: [], grades: ['6'] } });
        let release;
        const ready = new Promise(resolve => { release = resolve; });
        await page.route('**/api/scanner-rules?*', async route => { await ready; await route.continue().catch(() => {}); });
        try {
            await page.reload();
            await page.getByPlaceholder('Barcode scannen').fill('1001');
            await page.getByPlaceholder('Barcode scannen').press('Enter');
            await expect(page.locator('.message-error')).toContainText('Keine Runde gezählt');
        } finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
        const reopened = await openRules(page);
        await expect(reopened.getByRole('radio', { name: 'Blockieren' })).toBeChecked();
        await reopened.getByRole('radio', { name: 'Warnen' }).check();
        await reopened.getByRole('button', { name: 'Änderungen speichern' }).click();
        await expect(reopened).not.toBeVisible();
        await page.getByPlaceholder('Barcode scannen').fill('1001');
        const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/runden') && response.request().method() === 'POST');
        await page.getByPlaceholder('Barcode scannen').press('Enter');
        const response = await responsePromise;
        const confirmation = page.getByRole('dialog', { name: /Doppel-Scan/ });
        if (response.status() === 409) await confirmation.getByRole('button', { name: 'Runde trotzdem zählen', exact: true }).click();
        await expect(page.locator('.message-warning')).toContainText(response.status() === 409 ? 'Doppel-Scan bestätigt und gezählt' : 'Runde erfolgreich gezählt');
        await expect(page.locator('.message-warning')).toContainText('an diesem Scanner nicht erlaubt');
        const mobile = await openRules(page);
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(mobile.getByRole('button', { name: 'Änderungen speichern' })).toBeInViewport();
        expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    } finally { await otherContext.close(); }
});

test('Setup enthält keine Scanner-Konfiguration mehr und alte Links führen zu /scan', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    await page.goto('/setup');
    await expect(page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: /Scanner/ })).toHaveCount(0);
    await expect(page.getByLabel('Scanner-Stationen aktivieren')).toHaveCount(0);
    await page.goto('/stations');
    await expect(page).toHaveURL(/\/scan$/);
    await page.getByRole('button', { name: 'Einstellungen öffnen', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Scanner-Regeln öffnen', exact: true })).toBeVisible();
});

test('Alte Stationsauswahl und Moduloption aktivieren keinen Standard-Scanner', async ({ page }) => {
    const original = await (await page.request.get('/api/moduleConfig')).json();
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    await page.request.post('/api/moduleConfig', { data: { ...original, scannerStations: true } });
    try {
        expect(await (await page.request.get('/api/moduleConfig')).json()).not.toHaveProperty('scannerStations');
        expect((await page.request.post('/api/stations', { data: { name: 'Standard-Scanner' } })).status()).toBe(410);
        await page.addInitScript(() => localStorage.setItem('sponsorenlauf.scannerStation', 'default'));
        await page.goto('/scan');
        const dialog = await openRules(page);
        await expect(dialog.getByRole('radio', { name: 'Alle zulassen' })).toBeChecked();
        await expect(page.getByText('Standard-Scanner', { exact: true })).toHaveCount(0);
        expect(await page.evaluate(() => localStorage.getItem('sponsorenlauf.scannerStation'))).toBeNull();
    } finally { await page.request.post('/api/moduleConfig', { data: original }); }
});

test('Alte Stationslinks sind auch ohne Admin-Anmeldung erreichbar', async ({ page }) => {
    await page.goto('/stations');
    await expect(page).toHaveURL(/\/scan$/);
    await expect(page.getByPlaceholder('Barcode scannen')).toBeVisible();
});
