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
