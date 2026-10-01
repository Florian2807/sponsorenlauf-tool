import { test, expect } from '@playwright/test';

test('der Scan-Arbeitsablauf behandelt Fehler, Speichern und Doppel-Scans', async ({ page }) => {
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
    await expect(page.locator('.timestamp-item')).toHaveCount(1);

    await scanInput.fill('1001');
    await scanInput.press('Enter');
    const duplicateDialog = page.getByRole('dialog', { name: 'Doppel-Scan Warnung' });
    await expect(duplicateDialog).toBeVisible();
    await expect(duplicateDialog).toContainText('Erika Mustermann');
    await duplicateDialog.getByRole('button', { name: 'Runde trotzdem zählen' }).click();
    await expect(page.getByRole('status')).toContainText('Doppel-Scan bestätigt und gezählt');
    await expect(page.locator('.scan-round-summary strong')).toHaveText('2');
    await expect(page.locator('.timestamp-item')).toHaveCount(2);

    await page.goto('/show');
    await page.getByLabel('Barcode oder Schüler-ID').fill('1001');
    await page.getByRole('button', { name: 'Anzeigen' }).click();

    await expect(page.locator('.student-info p').filter({ hasText: 'Gelaufene Runden:' })).toHaveText(/2$/);
    await expect(page.locator('.timestamp-item')).toHaveCount(2);
});

test('zwei offline erfasste Scans derselben Person bleiben getrennt und werden bestätigt', async ({ page }) => {
    let disconnected = true;
    await page.route('**/api/runden', async (route) => {
        if (disconnected) {
            await route.fulfill({ status: 503, body: 'offline' });
        } else {
            await route.continue();
        }
    });
    await page.goto('/scan');
    const input = page.getByPlaceholder('Barcode scannen');

    for (let count = 1; count <= 2; count += 1) {
        await input.fill('1002');
        await input.press('Enter');
        await expect(page.locator('.scan-status')).toContainText(`${count} Scan(s) vorgemerkt`);
    }

    disconnected = false;
    const dialog = page.getByRole('dialog', { name: 'Doppel-Scan Warnung' });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog).toContainText('Max Beispiel');
    await dialog.getByRole('button', { name: 'Runde trotzdem zählen' }).click();
    await expect(page.locator('.scan-status')).not.toContainText('vorgemerkt');
    await expect(page.locator('.scan-round-summary strong')).toHaveText('2');
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
    }
});

test('fremde Browser-Seiten dürfen keine Runden buchen', async ({ request }) => {
    const response = await request.post('/api/runden', {
        headers: { 'sec-fetch-site': 'cross-site' },
        data: { id: 1003, scanId: 'scan_cross_site_attempt' },
    });
    expect(response.status()).toBe(403);
});
