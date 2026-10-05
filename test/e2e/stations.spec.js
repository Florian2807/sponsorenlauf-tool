import { test, expect } from '@playwright/test';

test('Scanner-Stationen: Standard, gemeinsame Auswahl, Regeln, Herkunft und Berechtigungen', async ({ page, request, browser }) => {
    await page.goto('/scan');
    await expect(page.getByLabel('Scanner-Station', { exact: true })).toHaveCount(0);
    const original = await (await request.get('/api/moduleConfig')).json();
    expect(original).toMatchObject({ donations: false, emails: false, teachers: false, scannerStations: false, doubleScanPrevention: { enabled: true } });
    expect(original.scannerStations).toBe(false);
    expect((await request.get('/api/stations')).status()).toBe(403);
    await request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    await request.post('/api/moduleConfig', { data: { ...original, scannerStations: true } });
    const created = await request.post('/api/stations', { data: { name: 'Ziel links' } });
    expect(created.status()).toBe(201);
    const { id } = await created.json();
    const otherContext = await browser.newContext();
    const other = await otherContext.newPage();
    try {
        await page.reload();
        await page.getByRole('button', { name: 'Scanner-Station auswählen', exact: true }).click();
        await page.getByLabel('Scanner-Station', { exact: true }).selectOption(id);
        let releaseStations;
        const stationsReady = new Promise((resolve) => { releaseStations = resolve; });
        await page.route('**/api/stations', async (route) => {
            await stationsReady;
            await route.continue();
        });
        // An immediate scan after reload must retain the saved station even
        // while the list of station names and rules is still loading.
        await page.route('**/api/runden', async (route) => {
            expect(route.request().postDataJSON().sourceStationId).toBe(id);
            await route.fulfill({ status: 400, json: { message: 'Stationsauswahl geprüft' } });
        });
        try {
            await page.reload();
            await expect(page.getByRole('button', { name: 'Scanner-Station auswählen', exact: true })).toBeVisible();
            await page.getByPlaceholder('Barcode scannen').fill('1002');
            await page.getByPlaceholder('Barcode scannen').press('Enter');
            await expect(page.locator('.message-error')).toContainText('Stationsauswahl geprüft');
        } finally {
            releaseStations();
            await page.unroute('**/api/runden');
            await page.unroute('**/api/stations');
        }
        await expect(page.getByLabel('Scanner-Station', { exact: true })).toHaveValue(id);
        await other.goto('/scan');
        await expect(other.getByLabel('Scanner-Station', { exact: true })).toHaveValue('default');
        await other.getByRole('button', { name: 'Scanner-Station auswählen', exact: true }).click();
        await other.getByLabel('Scanner-Station', { exact: true }).selectOption(id);
        expect((await otherContext.request.post('/api/stations', { data: { name: 'Unerlaubt' } })).status()).toBe(401);
        expect((await otherContext.request.patch('/api/stations', { data: { id, name: 'Unerlaubt' } })).status()).toBe(401);
        expect((await otherContext.request.put('/api/stations', {
            headers: { 'sec-fetch-site': 'cross-site' },
            data: { id, mode: 'allow', classes: [], grades: [] },
        })).status()).toBe(403);

        if (!await other.getByRole('button', { name: 'Stationsregeln einstellen' }).isVisible()) await other.getByRole('button', { name: 'Scanner-Station auswählen', exact: true }).click();
        await other.getByRole('button', { name: 'Stationsregeln einstellen' }).click();
        const dialog = other.getByRole('dialog', { name: 'Station einstellen' });
        await dialog.getByRole('radio', { name: 'Blockieren' }).check();
        // A different year disallows the fixture class 5a.
        expect((await otherContext.request.put('/api/stations', {
            data: { id, mode: 'block', classes: [], grades: ['6'] },
        })).status()).toBe(200);
        await dialog.getByRole('button', { name: 'Abbrechen', exact: true }).click();
        const blockedScan = 'scan_station_blocked';
        const blocked = await otherContext.request.post('/api/runden', {
            data: { id: 1002, scanId: blockedScan, sourceStationId: id },
        });
        expect(blocked.status()).toBe(400);
        expect((await blocked.json()).error).toBe('STATION_CLASS_BLOCKED');
        expect((await (await request.get('/api/runden?scanId=' + blockedScan)).json()).stored).toBe(false);

        await otherContext.request.put('/api/stations', { data: { id, mode: 'warn', classes: [], grades: ['6'] } });
        const input = page.getByPlaceholder('Barcode scannen');
        await input.fill('1002');
        await input.press('Enter');
        await expect(page.locator('.message-warning')).toContainText('Runde erfolgreich gezählt');
        await expect(page.locator('.message-warning')).toContainText('Ziel links');
        await expect(input).toBeEnabled();
        await expect(page.locator('.timestamp-item')).toContainText('Ziel links');

        // Renaming must preserve the historical name.
        await request.patch('/api/stations', { data: { id, name: 'Ziel rechts' } });
        const duplicate = await otherContext.request.post('/api/runden', {
            data: { id: 1002, scanId: 'scan_station_duplicate', sourceStationId: id },
        });
        expect(duplicate.status()).toBe(409);
        expect((await duplicate.json()).lastStationName).toBe('Ziel links');

        // Historical names remain visible after a station is renamed.
        const accepted = await (await request.get('/api/students/1002/timestamps')).json();
        expect(accepted.data.rounds[0].sourceStationName).toBe('Ziel links');
        await otherContext.request.put('/api/stations', { data: { id, mode: 'block', classes: [], grades: ['6'] } });
        if (!await other.getByRole('button', { name: 'Stationsregeln einstellen' }).isVisible()) await other.getByRole('button', { name: 'Scanner-Station auswählen', exact: true }).click();
        await other.getByRole('button', { name: 'Stationsregeln einstellen' }).click();
        await expect(dialog.getByRole('radio', { name: 'Blockieren' })).toBeChecked();
        await dialog.getByRole('radio', { name: 'Alle zulassen' }).check();
        await dialog.getByRole('button', { name: 'Änderungen speichern' }).click();
        await expect(dialog).not.toBeVisible();
        expect((await (await request.get('/api/stations')).json()).stations.find((station) => station.id === id).mode).toBe('allow');

        const defaultScan = await otherContext.request.post('/api/runden', {
            data: { id: 1002, scanId: 'scan_station_default', confirmDoubleScan: true },
        });
        expect((await defaultScan.json()).round.sourceStationName).toBe('Standard-Scanner');
        await otherContext.request.put('/api/stations', { data: { id, mode: 'block', classes: [], grades: ['5'] } });
        const gradeScan = await otherContext.request.post('/api/runden', {
            data: { id: 1002, scanId: 'scan_station_grade', sourceStationId: id, confirmDoubleScan: true },
        });
        expect(gradeScan.status()).toBe(200);
        await otherContext.request.put('/api/stations', { data: { id, mode: 'block', classes: [], grades: ['6'] } });
        const replay = await otherContext.request.post('/api/runden', {
            data: { id: 1002, scanId: 'scan_station_grade', sourceStationId: 'default' },
        });
        const replayed = await replay.json();
        expect(replayed.idempotentReplay).toBe(true);
        expect(replayed.round.sourceStationId).toBe(id);
    } finally {
        await request.post('/api/moduleConfig', { data: original });
        await otherContext.close();
    }
    const disabledScan = await request.post('/api/runden', {
        data: { id: 1002, scanId: 'scan_station_disabled', sourceStationId: id, confirmDoubleScan: true },
    });
    expect(disabledScan.status()).toBe(200);
    expect((await disabledScan.json()).round.sourceStationName).toBeNull();
});

test('Admin richtet Stationen ohne erneutes Öffnen des Modul-Dialogs ein', async ({ page, browser }) => {
    const original = await (await page.request.get('/api/moduleConfig')).json();
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    try {
        await page.goto('/setup');
        await page.getByRole('button', { name: 'Module verwalten' }).click();
        const modules = page.getByRole('dialog', { name: 'Module verwalten' });
        await expect(modules.getByLabel('Scanner-Stationen aktivieren')).toBeEnabled();
        await modules.locator('.module-toggle').filter({ has: page.getByLabel('E-Mails aktivieren') }).click();
        await modules.getByRole('button', { name: 'Abbrechen', exact: true }).click();
        await page.getByRole('button', { name: 'Module verwalten' }).click();
        await expect(modules.getByLabel('E-Mails aktivieren')).not.toBeChecked();
        await modules.getByLabel('Mindestabstand', { exact: true }).fill('');
        await expect(modules.getByRole('button', { name: 'Speichern', exact: true })).toBeDisabled();
        await modules.getByLabel('Mindestabstand', { exact: true }).fill('5');
        const scannerModule = modules.getByRole('region', { name: 'Scanner-Stationen', exact: true });
        await scannerModule.locator('summary').click();
        await expect(scannerModule.getByText('Zum Beispiel am Ziel')).toBeVisible();
        await page.screenshot({ path: '/tmp/sponsorenlauf-module-manager.png', animations: 'disabled' });
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(modules.getByRole('button', { name: 'Speichern', exact: true })).toBeInViewport();
        expect(await modules.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
        await page.screenshot({ path: '/tmp/sponsorenlauf-module-manager-mobile.png', animations: 'disabled' });
        await page.setViewportSize({ width: 1280, height: 720 });
        await modules.locator('.module-toggle').filter({ has: page.getByLabel('Scanner-Stationen aktivieren') }).click();
        await modules.getByRole('button', { name: 'Speichern & Stationen einrichten' }).click();
        await expect(page).toHaveURL(/\/stations$/);
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/scan');
        await expect(page.getByRole('button', { name: 'Scanner-Station auswählen', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Zu Dunkelmodus wechseln' }).click();
        await expect(page.getByPlaceholder('Barcode scannen')).toBeInViewport();
        await expect(page.locator('.scan-station-summary')).toHaveCount(0);
        expect((await page.locator('header').first().boundingBox()).height).toBeLessThan(85);
        await page.screenshot({ path: '/tmp/sponsorenlauf-scan-compact-dark.png', fullPage: true, animations: 'disabled' });
        await page.goto('/stations');
        await page.getByRole('button', { name: 'Neue Station anlegen' }).click();
        await page.getByLabel('Name der neuen Station').fill('Klassen 5a–5c');
        await page.getByRole('button', { name: 'Station anlegen', exact: true }).click();
        const editor = page.getByRole('region', { name: 'Station bearbeiten' });
        await expect(editor.getByLabel('Stationsname', { exact: true })).toHaveValue('Klassen 5a–5c');
        await editor.getByLabel('Stationsname', { exact: true }).fill('Jahrgang 5');
        await editor.getByRole('radio', { name: 'Warnen' }).check();
        await editor.getByRole('checkbox', { name: 'Jahrgang 5' }).check();
        await editor.getByRole('button', { name: 'Änderungen speichern' }).click();
        await expect(editor.getByRole('status')).toHaveText('Änderungen gespeichert');
        const station = (await (await page.request.get('/api/stations')).json()).stations.find((item) => item.name === 'Jahrgang 5');
        expect(station.mode).toBe('warn');
        expect(station.grades).toEqual(['5']);
        // Invalid rule changes cannot partially rename a station.
        expect((await page.request.patch('/api/stations', { data: { id: station.id, name: 'Falscher Name', mode: 'invalid', classes: [], grades: [] } })).status()).toBe(400);
        await editor.getByLabel('Stationsname', { exact: true }).fill('Ungespeichert');
        await page.getByRole('button', { name: /Standard-Scanner Alle Klassen/ }).click();
        await expect(page.getByText('Diese Station hat ungespeicherte Änderungen.')).toBeVisible();
        await expect(editor.getByLabel('Stationsname', { exact: true })).toHaveValue('Ungespeichert');
        await page.getByRole('button', { name: 'Weiter bearbeiten' }).click();
        await editor.getByLabel('Stationsname', { exact: true }).fill('Jahrgang 5');
        if (await page.getByRole('button', { name: 'Schließen', exact: true }).isVisible()) await page.getByRole('button', { name: 'Schließen', exact: true }).click();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: '/tmp/sponsorenlauf-station-admin-v2.png', fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: '/tmp/sponsorenlauf-station-admin-mobile-v2.png', fullPage: true });
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/scan');
        const stationButton = page.getByRole('button', { name: 'Scanner-Station auswählen', exact: true });
        await expect(page.getByLabel('Scanner-Station', { exact: true })).toBeHidden();
        await stationButton.click();
        await expect(stationButton).toHaveAttribute('aria-expanded', 'true');
        await page.getByLabel('Scanner-Station', { exact: true }).selectOption(station.id);
        await page.keyboard.press('Escape');
        await expect(stationButton).toHaveAttribute('aria-expanded', 'false');
        await expect(stationButton).toBeFocused();
        await stationButton.click();
        await page.locator('.station-feature-help').hover();
        await expect(page.locator('.station-feature-tooltip')).toBeVisible();
        await expect(page.locator('.station-feature-tooltip')).toContainText('damit du Scans ihrer Station zuordnen kannst');
        await page.screenshot({ path: '/tmp/sponsorenlauf-station-dropdown.png', animations: 'disabled' });
        await expect(page.locator('.scan-station-rules')).toContainText('Jahrgang 5');
        await page.screenshot({ path: '/tmp/sponsorenlauf-station-scan-v2.png', fullPage: true });
        if (!await page.getByRole('button', { name: 'Stationsregeln einstellen' }).isVisible()) await page.getByRole('button', { name: 'Scanner-Station auswählen', exact: true }).click();
        await page.getByRole('button', { name: 'Stationsregeln einstellen' }).click();
        const settings = page.getByRole('dialog', { name: 'Station einstellen' });
        await expect(settings.getByRole('radio', { name: 'Warnen' })).toBeChecked();
        await expect(settings.getByRole('checkbox', { name: 'Jahrgang 5' })).toBeChecked();
        await page.screenshot({ path: '/tmp/sponsorenlauf-station-settings-v2.png', fullPage: true });
        await settings.getByRole('radio', { name: 'Blockieren' }).check();
        await settings.getByRole('button', { name: 'Änderungen speichern' }).click();
        await expect(settings).not.toBeVisible();
        await expect(page.locator('.scan-station-rules')).toContainText('Andere Klassen: gesperrt');
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
        if (!await page.getByRole('button', { name: 'Stationsregeln einstellen' }).isVisible()) await page.getByRole('button', { name: 'Scanner-Station auswählen', exact: true }).click();
        await page.getByRole('button', { name: 'Stationsregeln einstellen' }).click();
        await expect(settings.getByRole('button', { name: 'Änderungen speichern' })).toBeInViewport();
        await expect(settings.getByRole('heading', { name: 'Station einstellen' })).toBeInViewport();
        await page.screenshot({ path: '/tmp/sponsorenlauf-station-settings-mobile-v2.png', fullPage: true });
        await settings.getByRole('button', { name: 'Abbrechen', exact: true }).click();

        const unauthenticated = await browser.newContext();
        try {
            const helper = await unauthenticated.newPage();
            await helper.goto('/stations');
            await expect(helper).toHaveURL(/admin-login/);
        } finally { await unauthenticated.close(); }
    } finally {
        await page.request.post('/api/moduleConfig', { data: original });
    }
});

test('Deaktivierte Stationen lassen sich direkt aus der Übersicht aktivieren', async ({ page }) => {
    const original = await (await page.request.get('/api/moduleConfig')).json();
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    try {
        await page.goto('/setup');
        await expect(page.getByRole('button', { name: 'Scanner-Stationen', exact: true })).toHaveCount(0);
        await page.goto('/stations');
        await expect(page.getByText('Modul deaktiviert', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Scanner-Stationen aktivieren', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Neue Station anlegen' })).toBeVisible();
        await expect(page.getByText('Modul aktiv', { exact: true })).toBeVisible();
    } finally {
        await page.request.post('/api/moduleConfig', { data: original });
    }
});
