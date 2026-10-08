import { test, expect } from '@playwright/test';

test('Excel-Export bleibt sichtbar und öffnet sich nach der PIN-Anmeldung', async ({ page }) => {
    await page.goto('/statistics');
    const exportButton = page.getByRole('button', { name: '📊 Excel Export', exact: true });
    await expect(exportButton).toBeVisible();
    await exportButton.click();
    await expect(page).toHaveURL(/\/admin-login\?next=/);
    await page.getByLabel('Administrator-PIN', { exact: true }).fill('246810');
    await page.getByRole('button', { name: 'Entsperren', exact: true }).click();
    await expect(page).toHaveURL(/\/statistics$/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Excel Gesamtauswertung');
    await expect(exportButton).toBeVisible();
});

test('Die Anmeldung kehrt ins Live-Panel oder den gewählten Setup-Bereich zurück und blockiert externe Ziele', async ({ page }) => {
    for (const destination of ['/live', '/setup?view=classStructure']) {
        await page.goto(destination);
        await expect(page).toHaveURL(/\/admin-login\?next=/);
        await page.getByLabel('Administrator-PIN', { exact: true }).fill('246810');
        await page.getByRole('button', { name: 'Entsperren', exact: true }).click();
        await expect(page).toHaveURL(new RegExp(destination.replace(/[?]/g, '\\?') + '$'));
        await page.request.post('/api/admin-auth', { data: { action: 'logout' } });
    }
    await page.goto('/admin-login?next=' + encodeURIComponent('https://example.org/live'));
    await page.getByLabel('Administrator-PIN', { exact: true }).fill('246810');
    await page.getByRole('button', { name: 'Entsperren', exact: true }).click();
    await expect(page).toHaveURL(/\/setup$/);
});
