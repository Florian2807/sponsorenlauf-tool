import { test, expect } from '@playwright/test';

async function unlock(page) {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
}

test('Dialoge: Formularfokus, Tab-Schleife, native Auswahl und Escape mit Fokusrückgabe', async ({ page }, testInfo) => {
    await unlock(page);
    await page.goto('/manage');
    const opener = page.getByRole('button', { name: /Schüler hinzufügen/ });
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Neuen Schüler hinzufügen' });
    await expect(dialog.getByLabel('Vorname:')).toBeFocused();
    await dialog.getByLabel('Vorname:').fill('Tastatur');
    await dialog.getByLabel('Nachname:').fill('Prüfung');
    let saves = 0;
    await page.route('**/api/students/*', async route => {
        if (route.request().method() === 'POST') {
            saves++;
            await route.fulfill({ json: { success: true } });
        } else await route.continue();
    });
    await dialog.getByLabel('Klasse:').selectOption('5a');
    await expect(dialog.getByRole('button', { name: 'Hinzufügen', exact: true })).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath('student-add.png') });
    await dialog.getByLabel('Klasse:').focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    expect(saves).toBe(0);
    await dialog.getByRole('button', { name: 'Hinzufügen', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Dialog schließen' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: 'Hinzufügen', exact: true })).toBeFocused();
    await dialog.getByLabel('Nachname:').focus();
    await page.keyboard.press('Enter');
    await expect(dialog).not.toBeVisible();
    expect(saves).toBe(1);
    await expect(opener).toBeFocused();
    await opener.press('Enter');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
});

test('Modul-Erklärungen und Schalter behalten ihre Tastaturbedienung', async ({ page }) => {
    await unlock(page);
    await page.goto('/setup');
    await expect(page.getByRole('button', { name: 'Sperren', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Module verwalten', exact: true })).toBeFocused();
    await expect(page.getByLabel('Scanner-Stationen aktivieren')).toBeEnabled();
    const opener = page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Module verwalten' });
    await opener.press('Enter');
    await expect(page).toHaveURL(/view=moduleSettings/);
    const dialog = page.getByRole('region', { name: 'Module verwalten' });
    const region = dialog.getByRole('region', { name: 'Scanner-Stationen', exact: true });
    const summary = region.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(region.locator('details')).toHaveAttribute('open', '');
    await expect(dialog).toBeVisible();
    const toggle = region.getByLabel('Scanner-Stationen aktivieren');
    await expect(toggle).toBeEnabled();
    await toggle.press('Space');
    await expect(toggle).toBeChecked();
    await expect(region.getByRole('button', { name: 'Stationen einrichten', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(toggle).toBeChecked();
});

test('Alle Hauptansichten passen in hell und dunkel auf Desktop und Handy', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await unlock(page);
    const original = await (await page.request.get('/api/moduleConfig')).json();
    await page.request.post('/api/moduleConfig', { data: { ...original, scannerStations: true, donations: true, teachers: true, emails: true } });
    try {
        for (const theme of ['light', 'dark']) {
            await page.addInitScript(value => localStorage.setItem('theme', value), theme);
            for (const width of [1280, 390]) {
                await page.setViewportSize({ width, height: 844 });
                for (const path of ['/setup', '/manage', '/teachers', '/stations', '/scan', '/show', '/statistics', '/donations', '/mails']) {
                    await page.goto(path);
                    await expect(page.locator('.app-page')).toBeVisible();
                    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
                    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} ${width} ${path}`).toBe(true);
                    if (path === '/setup' && width === 1280) await expect(page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Lehrer verwalten', exact: true })).toBeVisible();
                    if (path === '/statistics') {
                        const exportButton = page.getByRole('button', { name: /Excel Export/ });
                        await expect(exportButton).toBeEnabled();
                        await expect.poll(() => exportButton.evaluate(button => {
                            const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
                                .map(value => { const channel = value / 255; return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; })
                                .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
                            const style = getComputedStyle(button);
                            const colors = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
                            return (colors[0] + 0.05) / (colors[1] + 0.05);
                        }), { message: `${theme} Excel-Export Textkontrast` }).toBeGreaterThanOrEqual(4.5);
                    }
                    await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}-${path.slice(1)}.png`), animations: 'disabled' });
                }
            }
        }
    } finally {
        await page.request.post('/api/moduleConfig', { data: original });
    }
});

test('Enter bestätigt keine Löschung aus dem Bestätigungsfeld', async ({ page }) => {
    await unlock(page);
    await page.goto('/setup');
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Daten löschen', exact: true }).click();
    const dialog = page.getByRole('region', { name: 'Daten löschen', exact: true });
    let deletes = 0;
    await page.route('**/api/detailedDelete', async route => { deletes++; await route.fulfill({ status: 400, json: { message: 'Nur Tastaturprüfung' } }); });
    await dialog.getByRole('checkbox', { name: /Alle Schüler/ }).check();
    await dialog.locator('#delete-confirmation').fill('LÖSCHEN');
    await expect(dialog.getByRole('button', { name: 'Löschen', exact: true })).toBeEnabled();
    await dialog.locator('#delete-confirmation').press('Enter');
    await expect(dialog).toBeVisible();
    expect(deletes).toBe(0);
    await dialog.getByRole('button', { name: 'Löschen', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => deletes).toBe(1);
    await expect(dialog.getByRole('button', { name: 'Auswahl zurücksetzen', exact: true })).toBeEnabled();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Auswahl zurücksetzen' }).click();
    await expect(dialog.getByRole('button', { name: 'Löschen', exact: true })).toBeDisabled();
});

test('Speichern im Bereich sperrt Navigation und bewahrt den offenen Bereich', async ({ page }) => {
    await unlock(page);
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await page.route('**/api/moduleConfig', async route => {
        if (route.request().method() === 'POST') { await held; await route.fulfill({ json: { success: true, modules: route.request().postDataJSON() } }); }
        else await route.continue();
    });
    await page.goto('/setup');
    const panel = page.getByRole('region', { name: 'Module verwalten', exact: true });
    await panel.locator('.module-toggle').filter({ has: page.getByLabel('Scanner-Stationen aktivieren') }).click();
    try {
        await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
        await expect(page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Klassenstruktur', exact: true })).toBeDisabled();
        await page.keyboard.press('Escape');
        await expect(panel).toBeVisible();
    } finally { release(); }
    await expect(page.locator('.setup-view:not([hidden]) .settings-save-actions')).toContainText('Änderungen gespeichert');
    await expect(panel).toBeVisible();
});

test('Scan-Navigation und Einführung funktionieren mit Enter, Tab und Escape', async ({ page }) => {
    await page.goto('/scan');
    await page.getByRole('link', { name: 'Zum Inhalt springen' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    await page.getByRole('link', { name: 'Statistiken', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/statistics$/);
    await unlock(page);
    await page.goto('/setup?tour=1');
    const dialog = page.getByRole('dialog', { name: 'Willkommen beim Sponsorenlauf-Tool' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Weiter', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
});



test('Schülerfilter, Bearbeiten mit Enter und Schülerprofil funktionieren zusammen', async ({ page }, testInfo) => {
    await unlock(page);
    await page.goto('/manage');
    await expect(page.getByRole('combobox', { name: 'Klasse', exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'Klasse', exact: true }).selectOption('5a');
    await page.getByRole('searchbox', { name: 'Suchen', exact: true }).fill('  Erika Mustermann  ');
    await expect(page.locator('.student-directory tbody tr')).toHaveCount(1);
    const resetBounds = await page.getByRole('button', { name: 'Zurücksetzen', exact: true }).boundingBox();
    const classBounds = await page.getByRole('combobox', { name: 'Klasse', exact: true }).boundingBox();
    expect(Math.abs(resetBounds.y - classBounds.y)).toBeLessThan(1);
    expect(Math.abs(resetBounds.height - classBounds.height)).toBeLessThan(1);
    await page.getByRole('button', { name: 'Erika Mustermann bearbeiten', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Schüler bearbeiten', exact: true });
    await expect(dialog.getByLabel('Vorname', { exact: true })).toBeFocused();
    await expect(dialog.locator('.dialog-actions').getByRole('button', { name: 'Schüler löschen', exact: true })).toHaveCount(0);
    await dialog.locator('summary').filter({ hasText: 'Schüler löschen' }).press('Enter');
    await dialog.getByRole('button', { name: 'Schüler löschen', exact: true }).click();
    const confirmation = page.getByRole('dialog', { name: 'Bestätigen Sie das Löschen', exact: true });
    await expect(confirmation).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(confirmation).not.toBeVisible();
    await expect(dialog).toBeVisible();
    await dialog.locator('summary').filter({ hasText: 'Ersatz-IDs' }).focus();
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('button', { name: 'Ersatz-ID hinzufügen', exact: true })).toBeVisible();
    await dialog.getByLabel('Vorname', { exact: true }).fill('Erika');
    let saved;
    await page.route('**/api/students/1001', async route => {
        if (route.request().method() === 'PUT') {
            saved = route.request().postDataJSON();
            await route.fulfill({ json: { success: true } });
        } else await route.continue();
    });
    await page.screenshot({ path: testInfo.outputPath('student-edit.png') });
    await dialog.getByLabel('Nachname', { exact: true }).press('Enter');
    await expect(dialog).not.toBeVisible();
    expect(saved).toMatchObject({ vorname: 'Erika', nachname: 'Mustermann', klasse: '5a' });
    await page.goto('/show');
    await page.getByLabel('Barcode oder Schüler-ID', { exact: true }).fill('1001');
    await page.getByLabel('Barcode oder Schüler-ID', { exact: true }).press('Enter');
    await expect(page.getByRole('heading', { name: 'Erika Mustermann', exact: true })).toBeVisible();
    await expect(page.locator('.student-profile-facts')).toContainText('Gelaufene Runden');
    await expect(page.getByLabel('Barcode oder Schüler-ID', { exact: true })).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath('student-profile.png') });
    await page.goto('/statistics');
    const table = page.locator('.statistics-table').filter({ has: page.getByRole('heading', { name: '📚 Klassen-Statistiken', exact: true }) }).first();
    const firstClass = table.locator('tbody tr').first().locator('td').first();
    await expect(firstClass).toHaveText('5a');
    const textOffset = await firstClass.evaluate(cell => {
        const range = document.createRange();
        range.selectNodeContents(cell.firstChild);
        return range.getBoundingClientRect().left - cell.getBoundingClientRect().left;
    });
    expect(textOffset).toBeGreaterThanOrEqual(40);
    await table.screenshot({ path: testInfo.outputPath('statistics-table.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/manage');
    await page.getByRole('searchbox', { name: 'Suchen', exact: true }).fill('Erika Mustermann');
    await expect(page.locator('.student-directory tbody tr')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Erika Mustermann bearbeiten', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Sortieren', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('student-mobile.png') });
});
