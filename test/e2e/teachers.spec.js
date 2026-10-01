import { test, expect } from '@playwright/test';

test('Klassenlehrer-Auswahl ergänzt Felder automatisch und speichert mehr als zwei Lehrer', async ({ page }) => {
    await page.goto('/teachers');
    await page.getByLabel('Administrator-PIN').fill('246810');
    await page.getByRole('button', { name: 'Entsperren' }).click();

    await page.getByRole('button', { name: 'Klassenlehrer Konfigurieren' }).click();
    const dialog = page.getByRole('dialog', { name: 'Klassenlehrer Konfigurieren' });
    const classCard = dialog.locator('.class-assignment-card').filter({ hasText: 'Klasse 5a' });
    const selects = classCard.locator('select');

    await expect(selects).toHaveCount(3);
    await expect(selects.nth(0).locator('option[value="1"]')).toHaveText('Lehrer1 Test');
    await expect(classCard.locator('.teacher-count-badge')).toHaveText('2 Lehrer');
    await expect(classCard.locator('.teacher-email-display')).toHaveCount(2);
    await selects.nth(2).selectOption('3');
    await expect(selects).toHaveCount(4);
    await selects.nth(3).selectOption('4');
    await expect(selects).toHaveCount(5);

    await selects.nth(1).selectOption('');
    await expect(selects).toHaveCount(4);
    await expect(classCard.locator('.teacher-count-badge')).toHaveText('3 Lehrer');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(dialog).not.toBeVisible();

    await page.getByRole('button', { name: 'Klassenlehrer Konfigurieren' }).click();
    await expect(selects).toHaveCount(4);
    await expect(selects.nth(0)).toHaveValue('1');
    await expect(selects.nth(1)).toHaveValue('3');
    await expect(selects.nth(2)).toHaveValue('4');
    await expect(selects.nth(3)).toHaveValue('');
});
