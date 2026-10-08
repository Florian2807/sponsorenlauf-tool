import { test, expect } from '@playwright/test';

test('der Scan-Arbeitsablauf behandelt Fehler, Speichern und Doppel-Scans', async ({ page }) => {
    const historyRequests = [];
    page.on('request', request => { if (request.url().includes('/timestamps')) historyRequests.push(request.url()); });
    await page.goto('/scan');

    const scanInput = page.getByPlaceholder('Barcode scannen');
    await expect(scanInput).toBeFocused();

    await scanInput.fill('9999');
    await scanInput.press('Enter');
    await expect(page.locator('.message[role="alert"]')).toContainText('Schüler mit dieser ID nicht gefunden');
    await expect(scanInput).toBeFocused();

    await scanInput.fill('1001');
    await scanInput.press('Enter');

    await expect(page.getByRole('status')).toContainText('Runde erfolgreich gezählt');
    await expect(page.getByRole('heading', { name: 'Erika Mustermann' })).toBeVisible();
    await expect(page.locator('.scan-round-summary strong')).toHaveText('1');
    expect(historyRequests).toHaveLength(0);
    await page.locator('.student-info-card > summary').click();
    await expect(page.locator('.timestamp-item')).toHaveCount(1);
    await expect.poll(() => historyRequests.length).toBe(1);
    await page.locator('.student-info-card > summary').click();
    await page.locator('.student-info-card > summary').click();
    expect(historyRequests).toHaveLength(1);

    await scanInput.fill('1001');
    await scanInput.press('Enter');
    const duplicateDialog = page.getByRole('dialog', { name: 'Doppel-Scan Warnung' });
    await expect(duplicateDialog).toBeVisible();
    await expect(duplicateDialog).toContainText('Erika Mustermann');
    await watchErrorTones(page);
    const scannerRequests = [];
    page.on('request', (request) => {
        if (request.url().includes('/api/runden')) scannerRequests.push(request);
    });
    await page.keyboard.type('1002');
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => window.__tones)).toBeGreaterThan(0);
    await expect(duplicateDialog).toBeVisible();
    expect(scannerRequests).toHaveLength(0);
    await expect(duplicateDialog.getByRole('button', { name: 'Runde trotzdem zählen' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toContainText('Doppel-Scan bestätigt und gezählt');
    await expect(page.locator('.scan-round-summary strong')).toHaveText('2');
    await expect(page.locator('.student-info-card')).not.toHaveAttribute('open', '');
    expect(historyRequests).toHaveLength(1);
    await page.locator('.student-info-card > summary').click();
    await expect(page.locator('.timestamp-item')).toHaveCount(2);
    await expect.poll(() => historyRequests.length).toBe(2);

    await page.goto('/show');
    await page.getByLabel('Barcode oder Schüler-ID').fill('1001');
    await page.getByRole('button', { name: 'Anzeigen' }).click();

    await expect(page.locator('.student-profile-facts > div').filter({ hasText: 'Gelaufene Runden' }).locator('strong')).toHaveText('2');
    await page.locator('.student-rounds-section > summary').click();
    await expect(page.locator('.timestamp-item')).toHaveCount(2);
});

const watchErrorTones = async (page) => {
    await page.evaluate(() => {
        window.__tones = 0;
        const original = AudioContext.prototype.createOscillator;
        AudioContext.prototype.createOscillator = function (...args) {
            window.__tones += 1;
            return original.apply(this, args);
        };
    });
};

test('30 schnelle Eingaben mit Enter behalten den Fokus und buchen jeweils genau einmal', async ({ page }) => {
    const posts = [];
    let finish;
    await page.route('**/api/runden', async route => {
        const body = route.request().postDataJSON();
        const held = new Promise(resolve => { finish = resolve; });
        posts.push(body);
        const count = posts.length;
        await held;
        await route.fulfill({ json: { success: true, scanId: body.scanId,
            student: { id: 1, vorname: 'Test', nachname: 'Person', roundCount: count },
            round: { id: 9900 + count, timestamp: new Date().toISOString() } } });
    });
    await page.goto('/scan');
    const input = page.getByPlaceholder('Barcode scannen');
    await expect(input).toBeFocused();
    for (let count = 1; count <= 30; count++) {
        await page.keyboard.type('1');
        await page.keyboard.press('Enter');
        await expect.poll(() => posts.length).toBe(count);
        await expect(input).toHaveAttribute('readonly', '');
        await expect(input).toBeFocused();
        finish();
        await expect(input).not.toHaveAttribute('readonly', '');
        await expect(input).toBeFocused();
        await expect(input).toHaveValue('');
    }
    expect(posts.map(body => body.id)).toEqual(Array(30).fill('1'));
    expect(new Set(posts.map(body => body.scanId)).size).toBe(30);
    await expect(page.locator('.scan-round-summary strong')).toHaveText('30');
});

test('weitere Barcodes während einer langsamen Anfrage werden mit Fehlerton verworfen', async ({ page }) => {
    const posts = [];
    let finish;
    const held = new Promise((resolve) => { finish = resolve; });
    await page.route('**/api/runden', async (route) => {
        const body = route.request().postDataJSON();
        posts.push(body);
        await held;
        await route.fulfill({ json: { success: true, scanId: body.scanId,
            student: { id: 7001, vorname: 'Test', nachname: 'Person', roundCount: 1 },
            round: { id: 9001, timestamp: new Date().toISOString() } } });
    });
    await page.goto('/scan');
    await watchErrorTones(page);
    const input = page.getByPlaceholder('Barcode scannen');
    await input.fill('7001');
    await input.press('Enter');
    await expect(input).toHaveAttribute('readonly', '');
    await expect(input).toBeFocused();
    await page.keyboard.type('7002');
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => window.__tones)).toBeGreaterThan(0);
    expect(posts).toHaveLength(1);
    finish();
    await expect(input).toBeEnabled();
    await expect(input).not.toHaveAttribute('readonly', '');
    await expect(input).toHaveValue('');
    expect(posts.map((body) => body.id)).toEqual(['7001']);
});

test('verlorene Antwort wird nur geprüft und derselbe Scan bewusst wiederholt', async ({ page }) => {
    const posts = [];
    let checks = 0;
    await page.route('**/api/runden*', async (route) => {
        if (route.request().method() === 'GET') {
            checks += 1;
            await route.fulfill({ json: { success: true, stored: false } });
        } else {
            const body = route.request().postDataJSON();
            posts.push(body);
            if (posts.length === 1) await route.abort();
            else await route.fulfill({ json: { success: true, scanId: body.scanId,
                student: { id: 7003, vorname: 'Test', nachname: 'Person', roundCount: 1 },
                round: { id: 9003, timestamp: new Date().toISOString() } } });
        }
    });
    await page.goto('/scan');
    const input = page.getByPlaceholder('Barcode scannen');
    await input.fill('7003');
    await input.press('Enter');
    await expect(page.getByRole('region', { name: 'Ungeklärter Scan' })).toBeVisible();
    await expect.poll(() => checks).toBe(1);
    await expect(page.getByRole('button', { name: 'Speicherstatus prüfen' })).toBeEnabled();
    expect(posts).toHaveLength(1);
    await page.reload();
    await expect(input).toBeDisabled();
    await expect.poll(() => checks).toBe(2);
    await page.getByRole('button', { name: 'Denselben Scan erneut senden' }).click();
    await expect(input).toBeEnabled();
    expect(posts).toHaveLength(2);
    expect(posts[0].scanId).toBe(posts[1].scanId);
});

test('Statusprüfung findet eine gespeicherte Runde nach verlorener Antwort', async ({ page }) => {
    let posts = 0;
    let scanId;
    await page.route('**/api/runden*', async (route) => {
        if (route.request().method() === 'POST') {
            posts += 1;
            scanId = route.request().postDataJSON().scanId;
            await route.abort();
        } else await route.fulfill({ json: { success: true, stored: true, scanId, message: 'Bereits gespeicherte Runde bestätigt',
            student: { id: 7004, vorname: 'Test', nachname: 'Person', roundCount: 1 },
            round: { id: 9004, timestamp: new Date().toISOString() } } });
    });
    await page.goto('/scan');
    const input = page.getByPlaceholder('Barcode scannen');
    await input.fill('7004');
    await input.press('Enter');
    await expect(page.getByRole('status')).toContainText('Bereits gespeicherte Runde bestätigt');
    await expect(input).toBeEnabled();
    expect(posts).toBe(1);
    await expect(page.locator('.timestamp-item')).toHaveCount(1);
});

test('unklarer Scan braucht eine bewusste Quittierung vor Freigabe', async ({ page }) => {
    await page.route('**/api/runden*', (route) => route.abort());
    await page.goto('/scan');
    const input = page.getByPlaceholder('Barcode scannen');
    await input.fill('7005');
    await input.press('Enter');
    await page.getByText('Weitere Optionen', { exact: true }).click();
    await page.getByRole('button', { name: 'Station freigeben', exact: true }).click();
    await expect(input).toBeDisabled();
    await expect(page.getByText('Die Runde könnte bereits gespeichert sein')).toBeVisible();
    await page.getByRole('button', { name: 'Ungeklärten Status quittieren und freigeben' }).click();
    await expect(input).toBeEnabled();
});

test('unvollständige Erfolgsantwort gibt die Station nicht frei', async ({ page }) => {
    await page.route('**/api/runden*', async (route) => {
        await route.fulfill({ json: { success: true } });
    });
    await page.goto('/scan');
    const input = page.getByPlaceholder('Barcode scannen');
    await input.fill('7006');
    await input.press('Enter');
    await expect(page.getByRole('region', { name: 'Ungeklärter Scan' })).toBeVisible();
    await expect(input).toBeDisabled();
});

test('sechs gleichzeitige Scanner-Anfragen speichern je eine Runde', async ({ request }) => {
    const studentIds = [1003, 1004, 1005, 1006, 1007, 1008];
    const responses = await Promise.all(studentIds.map((id, index) => request.post('/api/runden', {
        data: {
            id,
            scanId: `scan_e2e_station_${index + 1}`,
            sourceDeviceId: `device_e2e_station_${index + 1}`,
        },
    })));

    for (const response of responses) {
        expect(response.status()).toBe(200);
        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result.student.roundCount).toBe(1);
        const status = await request.get(`/api/runden?scanId=${result.scanId}`);
        expect(status.headers()['cache-control']).toBe('no-store');
        const stored = await status.json();
        expect(stored.stored).toBe(true);
        expect(stored.round.id).toBe(result.round.id);
    }
});

test('fremde Browser-Seiten dürfen keine Runden buchen', async ({ request }) => {
    const response = await request.post('/api/runden', {
        headers: { 'sec-fetch-site': 'cross-site' },
        data: { id: 1003, scanId: 'scan_cross_site_attempt' },
    });
    expect(response.status()).toBe(403);
});

test('Statusprüfung eines unbekannten Scans legt keine Runde an', async ({ request }) => {
    const response = await request.get('/api/runden?scanId=scan_unknown_status');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ success: true, stored: false, scanId: 'scan_unknown_status' });
    expect((await request.get('/api/runden?scanId=bad')).status()).toBe(400);
});

test('Doppel-Scan kann über Abbrechen und das Schließen-Symbol verworfen werden', async ({ page, request }) => {
    await page.goto('/scan');
    const input = page.getByPlaceholder('Barcode scannen');
    const dialog = page.getByRole('dialog', { name: 'Doppel-Scan Warnung' });
    for (const name of ['Abbrechen', 'Dialog schließen']) {
        await input.fill('1003');
        await input.press('Enter');
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name, exact: true }).click();
        await expect(dialog).not.toBeVisible();
        await expect(input).toBeEnabled();
        await expect(input).toBeFocused();
    }
    const result = await (await request.get('/api/students/1003/timestamps')).json();
    expect(result.data.rounds).toHaveLength(1);
});

test('Statusprüfung wiederholt sich automatisch bis zur Bestätigung und endet danach', async ({ page }) => {
    let posts = 0;
    let checks = 0;
    let scanId;
    await page.route('**/api/runden*', async (route) => {
        if (route.request().method() === 'POST') {
            posts += 1;
            scanId = route.request().postDataJSON().scanId;
            await route.abort();
        } else {
            checks += 1;
            if (checks === 1) await route.abort();
            else if (checks === 2) await route.fulfill({ json: { success: true, stored: false, scanId } });
            else await route.fulfill({ json: { success: true, stored: true, scanId,
                message: 'Bereits gespeicherte Runde bestätigt',
                student: { id: 7010, vorname: 'Test', nachname: 'Person', roundCount: 1 },
                round: { id: 9010, timestamp: new Date().toISOString() } } });
        }
    });
    await page.goto('/scan');
    await expect(page.getByPlaceholder('Barcode scannen')).toBeFocused();
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    const input = page.getByPlaceholder('Barcode scannen');
    await input.fill('7010');
    await input.press('Enter');
    await expect(page.getByRole('region', { name: 'Ungeklärter Scan' })).toBeVisible();
    await page.clock.runFor(1);
    await expect.poll(() => checks).toBe(1);
    await expect(page.getByRole('button', { name: 'Speicherstatus prüfen' })).toBeEnabled();
    await page.clock.runFor(2000);
    await expect.poll(() => checks).toBe(2);
    await expect(input).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Speicherstatus prüfen' })).toBeEnabled();
    await page.clock.runFor(2000);
    await expect(page.getByRole('status')).toContainText('Bereits gespeicherte Runde bestätigt');
    await expect(input).toBeEnabled();
    await page.clock.runFor(20000);
    expect(checks).toBe(3);
    expect(posts).toBe(1);
});

test('nach 15 Sekunden erscheint der Verbindungshinweis und Prüfungen laufen langsamer weiter', async ({ page }) => {
    let posts = 0;
    let checks = 0;
    await page.route('**/api/runden*', async (route) => {
        if (route.request().method() === 'POST') {
            posts += 1;
            await route.abort();
        } else {
            checks += 1;
            await route.fulfill({ json: { success: true, stored: false } });
        }
    });
    await page.goto('/scan');
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    const input = page.getByPlaceholder('Barcode scannen');
    await input.fill('7011');
    await input.press('Enter');
    await expect(page.getByRole('region', { name: 'Ungeklärter Scan' })).toBeVisible();
    await page.clock.runFor(1);
    await expect.poll(() => checks).toBe(1);
    await expect(page.getByRole('button', { name: 'Speicherstatus prüfen' })).toBeEnabled();
    for (let check = 2; check <= 8; check += 1) {
        await page.clock.runFor(2000);
        await expect.poll(() => checks).toBe(check);
        await expect(page.getByRole('button', { name: 'Speicherstatus prüfen' })).toBeEnabled();
    }
    await expect(page.getByRole('region', { name: 'Ungeklärter Scan' }).getByRole('alert')).toHaveCount(0);
    await page.clock.runFor(1000);
    await expect(page.getByRole('region', { name: 'Ungeklärter Scan' }).getByRole('alert')).toContainText('Speicherung ungeklärt – Verbindung prüfen');
    await page.clock.runFor(1000);
    await expect.poll(() => checks).toBe(9);
    await expect(page.getByRole('button', { name: 'Speicherstatus prüfen' })).toBeEnabled();
    await page.clock.runFor(4999);
    expect(checks).toBe(9);
    await page.clock.runFor(1);
    await expect.poll(() => checks).toBe(10);
    await expect(input).toBeDisabled();
    expect(posts).toBe(1);
});

test('laufende Statusprüfung überlappt nicht und eine späte Antwort hebt Quittierung nicht auf', async ({ page }) => {
    let checks = 0;
    let scanId;
    let finish;
    const held = new Promise((resolve) => { finish = resolve; });
    await page.route('**/api/runden*', async (route) => {
        if (route.request().method() === 'POST') {
            scanId = route.request().postDataJSON().scanId;
            await route.abort();
        } else {
            checks += 1;
            await held;
            await route.fulfill({ json: { success: true, stored: true, scanId,
                student: { id: 7012, vorname: 'Test', nachname: 'Person', roundCount: 1 },
                round: { id: 9012, timestamp: new Date().toISOString() } } });
        }
    });
    await page.goto('/scan');
    await expect(page.getByPlaceholder('Barcode scannen')).toBeFocused();
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    const input = page.getByPlaceholder('Barcode scannen');
    await input.fill('7012');
    await input.press('Enter');
    await expect(page.getByRole('region', { name: 'Ungeklärter Scan' })).toBeVisible();
    await page.clock.runFor(1);
    await expect.poll(() => checks).toBe(1);
    await page.clock.runFor(6000);
    expect(checks).toBe(1);
    await page.getByText('Weitere Optionen', { exact: true }).click();
    await page.getByRole('button', { name: 'Station freigeben', exact: true }).click();
    await page.getByRole('button', { name: 'Ungeklärten Status quittieren und freigeben' }).click();
    await expect(input).toBeEnabled();
    const response = page.waitForResponse((response) => response.url().includes('/api/runden?'));
    finish();
    await response;
    await page.clock.runFor(20000);
    await expect(page.getByRole('status')).toContainText('Station bewusst freigegeben');
    await expect(page.locator('.scan-student-hero')).toHaveCount(0);
    expect(checks).toBe(1);
});
