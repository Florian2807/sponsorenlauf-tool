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

test('Lehrerverwaltung: Liste, Formulare und Tastatur auf Desktop und Handy', async ({ page }, testInfo) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    await page.goto('/teachers');
    await expect(page.getByRole('searchbox')).toHaveCount(0);
    await expect(page.locator('.teacher-directory tbody tr')).toHaveCount(4);
    await page.getByRole('button', { name: 'Lehrer1 Test bearbeiten', exact: true }).press('Enter');
    const editor = page.getByRole('dialog', { name: 'Lehrer bearbeiten', exact: true });
    await expect(editor.getByLabel('Vorname:', { exact: true })).toBeFocused();
    await expect(editor.locator('.dialog-actions').getByRole('button', { name: 'Lehrer löschen', exact: true })).toHaveCount(0);
    await editor.locator('summary').filter({ hasText: 'Lehrer löschen' }).press('Enter');
    await editor.getByRole('button', { name: 'Lehrer löschen', exact: true }).click();
    await expect(page.getByRole('dialog', { name: /Lehrer löschen|Löschen/ }).last()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(editor).toBeVisible();
    let saved;
    await page.route('**/api/teachers/1', async route => {
        if (route.request().method() === 'PUT') { saved = route.request().postDataJSON(); await route.fulfill({ json: { success: true } }); }
        else await route.continue();
    });
    await editor.getByLabel('Vorname:', { exact: true }).fill('Clara');
    await editor.getByLabel('E-Mail Adresse:', { exact: true }).fill('clara@example.org');
    await page.screenshot({ path: testInfo.outputPath('teacher-edit-light.png'), animations: 'disabled' });
    await editor.getByLabel('Nachname:', { exact: true }).press('Enter');
    await expect(editor).not.toBeVisible();
    expect(saved).toMatchObject({ vorname: 'Clara', email: 'clara@example.org' });
    await page.getByRole('button', { name: 'Lehrer hinzufügen', exact: true }).press('Enter');
    const add = page.getByRole('dialog', { name: 'Neuen Lehrer hinzufügen', exact: true });
    await expect(add.getByLabel('Vorname:', { exact: true })).toBeFocused();
    let created;
    await page.route('**/api/teachers/*', async route => {
        if (route.request().method() === 'POST') { created = route.request().postDataJSON(); await route.fulfill({ json: { success: true } }); }
        else await route.continue();
    });
    await add.getByLabel('Vorname:', { exact: true }).fill('Anna');
    await add.getByLabel('Nachname:', { exact: true }).fill('Beispiel');
    await add.getByLabel('E-Mail Adresse:', { exact: true }).fill('invalid');
    await add.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
    expect(created).toBeUndefined();
    await expect(add).toBeVisible();
    await add.getByLabel('E-Mail Adresse:', { exact: true }).fill('anna@example.org');
    await add.getByLabel('E-Mail Adresse:', { exact: true }).press('Enter');
    await expect(add).not.toBeVisible();
    expect(created).toMatchObject({ vorname: 'Anna', nachname: 'Beispiel', email: 'anna@example.org' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Zu Dunkelmodus wechseln', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Sortieren', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('teacher-list-dark-mobile.png'), fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Lehrer hinzufügen', exact: true }).click();
    await expect(add).toBeVisible();
    expect(await add.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('teacher-add-dark-mobile.png'), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(add).not.toBeVisible();
});
