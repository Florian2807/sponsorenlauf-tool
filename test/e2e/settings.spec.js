import { test, expect } from '@playwright/test';

async function setup(page, theme = 'light') {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    await page.goto('/setup');
    await expect(page.getByRole('button', { name: 'Sperren', exact: true })).toBeVisible();
    await expect(page.getByLabel('Scanner-Stationen aktivieren')).toBeEnabled();
}

test('Arbeitsbereich ohne Übersicht: Navigation, Browser-Zurück und Tastatur', async ({ page }, testInfo) => {
    await setup(page);
    const navigation = page.getByRole('navigation', { name: 'Setup-Bereiche', exact: true });
    await expect(page.getByRole('button', { name: 'Übersicht', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Zur Übersicht', exact: true })).toHaveCount(0);
    await navigation.getByRole('button', { name: 'Klassenstruktur', exact: true }).press('Enter');
    const panel = page.locator('.setup-view:not([hidden])');
    await expect(panel.getByRole('heading', { name: 'Klassenstruktur verwalten', exact: true })).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(panel.getByRole('textbox', { name: 'Jahrgang / Stufe' }).first()).toHaveValue('5');
    await page.screenshot({ path: testInfo.outputPath('classes-workspace-light.png'), fullPage: true, animations: 'disabled' });
    await navigation.getByRole('button', { name: 'Module verwalten', exact: true }).click();
    await page.goBack();
    await expect(page).toHaveURL(/view=classStructure/);
    await page.getByRole('button', { name: 'Zu Dunkelmodus wechseln', exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath('classes-workspace-dark.png'), fullPage: true, animations: 'disabled' });
});

test('Import, Etiketten und Export funktionieren direkt im Arbeitsbereich', async ({ page }, testInfo) => {
    let imported;
    await page.route('**/api/importStudents', async route => {
        imported = route.request().postDataJSON();
        await route.fulfill({ json: { count: 1 } });
    });
    await setup(page);
    const navigation = page.getByRole('navigation', { name: 'Setup-Bereiche', exact: true });
    await navigation.getByRole('button', { name: 'Daten importieren', exact: true }).click();
    const panel = page.locator('.setup-view:not([hidden]) .setup-inline-panel');
    await panel.getByRole('button', { name: /Schüler importieren/ }).click();
    await panel.getByLabel('Vorname Zeile 1', { exact: true }).fill('Anna');
    await panel.getByLabel('Nachname Zeile 1', { exact: true }).fill('Schmidt');
    await panel.getByLabel('Klasse Zeile 1', { exact: true }).selectOption('5a');
    await panel.getByRole('button', { name: 'Importieren', exact: true }).click();
    await expect(page.locator('.setup-view:not([hidden])')).toBeVisible();
    expect(imported.students[0]).toMatchObject({ vorname: 'Anna', nachname: 'Schmidt', klasse: '5a' });
    await page.route('**/api/generate-labels?*', route => route.fulfill({ contentType: 'application/pdf', body: '%PDF-1.4\n' }));
    await navigation.getByRole('button', { name: 'Etiketten generieren', exact: true }).click();
    await expect(panel.getByRole('heading', { name: 'Etiketten generieren', exact: true })).toBeVisible();
    const labelsDownload = page.waitForEvent('download');
    await panel.getByRole('button', { name: 'Generieren', exact: true }).click();
    expect((await labelsDownload).suggestedFilename()).toBe('labels.pdf');
    await navigation.getByRole('button', { name: 'Auswertungen exportieren', exact: true }).click();
    const format = panel.getByRole('radio', { name: /HTML Dashboard Export/ });
    await format.focus();
    await format.press('Space');
    await expect(format).toBeChecked();
    await page.screenshot({ path: testInfo.outputPath('export-workspace-light.png'), fullPage: true, animations: 'disabled' });
    await page.route('**/api/exportStatisticsHtml', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Ergebnis</body></html>' }));
    const exportDownload = page.waitForEvent('download');
    await panel.getByRole('button', { name: /Export starten/ }).press('Enter');
    expect((await exportDownload).suggestedFilename()).toBe('sponsorenlauf_statistiken_interaktiv.html');
    await expect(page.locator('.setup-view:not([hidden])')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Jeder Bereich speichert nur seine Änderungen; Entwürfe und Fehler bleiben erhalten', async ({ page }) => {
    let classes = { '5': ['5a'] };
    let modules = { donations: false, emails: false, teachers: false, scannerStations: false, doubleScanPrevention: { enabled: true, timeThresholdMinutes: 5, mode: 'confirm' } };
    let failModules = true;
    const writes = [];
    await page.route('**/api/classStructure', async route => {
        if (route.request().method() === 'PUT') { classes = route.request().postDataJSON().availableClasses; writes.push('classes'); await route.fulfill({ json: { success: true } }); }
        else await route.fulfill({ json: classes });
    });
    await page.route('**/api/moduleConfig', async route => {
        if (route.request().method() === 'POST') {
            writes.push('modules');
            if (failModules) await route.fulfill({ status: 500, json: { error: 'Speicherfehler' } });
            else { modules = route.request().postDataJSON(); await route.fulfill({ json: { success: true, modules } }); }
        } else await route.fulfill({ json: modules });
    });
    await setup(page);
    const navigation = page.getByRole('navigation', { name: 'Setup-Bereiche' });
    const save = page.locator('.setup-view:not([hidden])').getByRole('button', { name: 'Änderungen speichern', exact: true });
    await expect(save).toBeDisabled();
    const toggle = page.getByLabel('Scanner-Stationen aktivieren');
    await page.locator('.module-toggle').filter({ has: toggle }).click();
    await navigation.getByRole('button', { name: 'Klassenstruktur', exact: true }).click();
    const field = page.getByRole('textbox', { name: 'Jahrgang / Stufe' }).first();
    await field.fill('Unterstufe');
    await save.click();
    await expect(save).toBeDisabled();
    expect(writes).toEqual(['classes']);
    await expect(navigation.getByRole('button', { name: 'Module verwalten', exact: true })).toHaveAttribute('aria-describedby', 'setup-unsaved-description');
    await expect(navigation.getByRole('button', { name: 'Klassenstruktur', exact: true })).not.toHaveAttribute('aria-describedby');
    await navigation.getByRole('button', { name: 'Module verwalten', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Module verwalten', exact: true })).toBeVisible();
    await expect(toggle).toBeChecked();
    // Suppress only the intentional request error in Next's development overlay.
    await page.evaluate(() => {
        const logError = console.error;
        console.error = (...args) => { if (args[0] !== 'Fehler beim Speichern der Modul-Konfiguration:') logError(...args); };
    });
    await save.click();
    await expect(page.locator('.setup-view:not([hidden]) .settings-save-actions')).toContainText('Deine Änderungen bleiben erhalten');
    await expect(toggle).toBeChecked();
    expect(writes).toEqual(['classes', 'modules']);
    failModules = false;
    await save.press('Enter');
    await expect(save).toBeDisabled();
    expect(writes).toEqual(['classes', 'modules', 'modules']);
    await navigation.getByRole('button', { name: 'Klassenstruktur', exact: true }).click();
    await expect(field).toHaveValue('Unterstufe');
    await field.fill('Verwerfen');
    await page.locator('.setup-view:not([hidden])').getByRole('button', { name: 'Änderungen verwerfen', exact: true }).click();
    await expect(field).toHaveValue('Unterstufe');
    await expect(page.getByRole('button', { name: 'Alle Änderungen speichern', exact: true })).toHaveCount(0);
    await navigation.getByRole('button', { name: 'Module verwalten', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Module verwalten', exact: true })).toBeVisible();
    await page.locator('.module-toggle').filter({ has: page.getByLabel('Spenden aktivieren', { exact: true }) }).click();
    await save.click();
    await expect(save).toBeDisabled();
    await navigation.getByRole('button', { name: 'Auswertungen exportieren', exact: true }).click();
    await expect(page.getByRole('radio', { name: /Klassenweise Spendenauswertung/ })).toBeChecked();
    await navigation.getByRole('button', { name: 'Module verwalten', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Module verwalten', exact: true })).toBeVisible();
    await page.locator('.module-toggle').filter({ has: page.getByLabel('Spenden aktivieren', { exact: true }) }).click();
    await save.click();
    await expect(save).toBeDisabled();
    await navigation.getByRole('button', { name: 'Auswertungen exportieren', exact: true }).click();
    await expect(page.getByRole('radio', { name: /Excel Gesamtauswertung/ })).toBeChecked();
});

test('Klassenstruktur: Umbenennen mit Enter, doppelte Namen und Abbrechen', async ({ page }, testInfo) => {
    await setup(page);
    let saved;
    await page.route('**/api/classStructure', async route => {
        if (route.request().method() === 'PUT') {
            saved = route.request().postDataJSON();
            await route.fulfill({ json: { success: true } });
        } else await route.continue();
    });
    const opener = page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Klassenstruktur', exact: true });
    await opener.click();
    const dialog = page.getByRole('region', { name: 'Klassenstruktur verwalten', exact: true });
    const grade = dialog.getByRole('textbox', { name: 'Jahrgang / Stufe' }).first();
    await expect(grade).toBeVisible();
    await grade.fill('Unterstufe');
    await dialog.getByRole('button', { name: 'Klasse hinzufügen', exact: true }).first().click();
    const added = dialog.getByRole('textbox', { name: /Klasse \d+ in Unterstufe/ }).last();
    await expect(added).toBeFocused();
    await added.fill('5a');
    await added.press('Enter');
    await expect(dialog.getByRole('alert')).toContainText('doppelt');
    expect(saved).toBeUndefined();
    await added.fill('5z');
    await page.screenshot({ path: testInfo.outputPath('classes-light.png') });
    await added.press('Enter');
    await expect(dialog).toBeVisible();
    expect(saved.availableClasses.Unterstufe).toContain('5z');
    expect(saved.availableClasses['5']).toBeUndefined();
    await opener.click();
    await expect(dialog.getByRole('textbox', { name: 'Jahrgang / Stufe' }).first()).toHaveValue('Unterstufe');
    await dialog.getByRole('textbox', { name: 'Jahrgang / Stufe' }).first().fill('Nicht speichern');
    await page.locator('.setup-view:not([hidden])').getByRole('button', { name: 'Änderungen verwerfen', exact: true }).click();
    await expect(dialog.getByRole('textbox', { name: 'Jahrgang / Stufe' }).first()).toHaveValue('Unterstufe');
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Etiketten generieren', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: '5z', exact: true })).toBeChecked();
});

test('Import und E-Mail-Einrichtung: ausgerichtete Buttons, Anleitung und Versandtest', async ({ page }, testInfo) => {
    let sent = 0;
    let savedSmtp;
    let completeTest;
    const testCompletion = new Promise(resolve => { completeTest = resolve; });
    await page.route('**/api/smtp-settings', async route => {
        if (route.request().method() === 'POST') { sent++; await testCompletion; await route.fulfill({ json: { success: true } }); }
        else if (route.request().method() === 'PUT') { savedSmtp = route.request().postDataJSON(); await route.fulfill({ json: { configuration: savedSmtp } }); }
        else await route.fulfill({ json: { configuration: { provider: 'smtp', host: '', port: 587, security: 'starttls', username: '', fromAddress: '', fromName: 'Schule' } } });
    });
    await setup(page, 'dark');
    const originalModules = await (await page.request.get('/api/moduleConfig')).json();
    await page.request.post('/api/moduleConfig', { data: { ...originalModules, emails: true } });
    try {
    await page.reload();
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Daten importieren', exact: true }).click();
    const importer = page.getByRole('region', { name: 'Daten importieren', exact: true });
    await importer.getByRole('button', { name: /Schüler importieren/ }).click();
    const dialog = page.getByRole('region', { name: 'Schüler importieren', exact: true });
    await dialog.getByRole('button', { name: '+ Zeile hinzufügen', exact: true }).click();
    const inputBox = await dialog.locator('tbody input').first().boundingBox();
    const deleteBox = await dialog.getByRole('button', { name: 'Zeile 1 löschen', exact: true }).boundingBox();
    expect(Math.abs(inputBox.y - deleteBox.y)).toBeLessThan(1);
    expect(Math.abs(inputBox.height - deleteBox.height)).toBeLessThan(1);
    await page.screenshot({ path: testInfo.outputPath('import-dark.png') });
    await dialog.getByRole('radio', { name: /Datei importieren/ }).check();
    await expect(dialog.getByRole('button', { name: 'Beispieldatei (.xlsx)', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('file-import-dark.png') });
    await dialog.getByLabel('Importdatei', { exact: true }).setInputFiles({ name: 'schueler.csv', mimeType: 'text/csv', buffer: Buffer.from('Vorname,Nachname,Klasse\nAnna,Schmidt,5a') });
    await expect(dialog.getByRole('heading', { name: 'Spalten zuordnen', exact: true })).toBeVisible();
    await expect(dialog.getByLabel('Zuweisung für Vorname')).toHaveValue('vorname');
    await page.keyboard.press('Escape');
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Versand einrichten', exact: true }).click();
    const smtp = page.getByRole('region', { name: 'E-Mail-Versand einrichten', exact: true });
    await expect(smtp.getByRole('button', { name: 'Test-E-Mail senden', exact: true })).toBeDisabled();
    await smtp.getByRole('button', { name: 'Anleitung', exact: true }).press('Enter');
    const guide = smtp.getByRole('region', { name: 'Versandanleitung', exact: true });
    await expect(guide).toBeVisible();
    await smtp.getByRole('button', { name: 'Anleitung', exact: true }).press('Enter');
    await expect(guide).not.toBeVisible();
    await expect(smtp).toBeVisible();
    await smtp.getByLabel('Absender-Adresse', { exact: true }).fill('test@example.org');
    await smtp.getByLabel('SMTP-Server', { exact: true }).fill('smtp.example.org');
    await expect(smtp.getByRole('button', { name: 'Test-E-Mail senden', exact: true })).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath('smtp-dark.png') });
    await smtp.getByRole('button', { name: 'Test-E-Mail senden', exact: true }).click();
    await expect(smtp.getByLabel('SMTP-Server', { exact: true })).toBeDisabled();
    await expect(smtp.getByLabel('SMTP-Port', { exact: true })).toBeDisabled();
    await expect(smtp.getByRole('button', { name: /Microsoft 365/ })).toBeDisabled();
    completeTest();
    await expect(smtp.locator('.smtp-test-result')).toContainText('erfolgreich');
    expect(sent).toBe(1);
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Module verwalten', exact: true }).click();
    await expect(page.locator('.setup-view:not([hidden])').getByRole('button', { name: 'Änderungen speichern', exact: true })).toBeDisabled();
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Versand einrichten', exact: true }).click();
    await smtp.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
    await expect(page.locator('.setup-view:not([hidden]) .settings-save-actions')).toContainText('Änderungen gespeichert');
    expect(savedSmtp).toMatchObject({ fromAddress: 'test@example.org', host: 'smtp.example.org' });
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Versand einrichten', exact: true }).click();
    await smtp.getByRole('button', { name: /Microsoft 365/, exact: false }).click();
    await expect(page.locator('.setup-view:not([hidden]) .settings-save-actions')).toContainText('Ungespeicherte Änderungen');
    await expect(page.locator('.setup-view:not([hidden])').getByRole('button', { name: 'Änderungen speichern', exact: true })).toBeDisabled();
    } finally { await page.request.post('/api/moduleConfig', { data: originalModules }); }
});

test('Löschauswahl wird zurückgesetzt, Systembereiche bleiben übersichtlich und Tour zeigt ihr Ziel', async ({ page }, testInfo) => {
    await setup(page);
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Daten löschen', exact: true }).click();
    const deletion = page.getByRole('region', { name: 'Daten löschen', exact: true });
    await deletion.getByRole('checkbox', { name: /Alle Schüler/ }).check();
    await expect(deletion.getByRole('checkbox', { name: /Runden-Daten/ })).toBeChecked();
    await expect(deletion.getByRole('checkbox', { name: /Runden-Daten/ })).toBeDisabled();
    await deletion.getByLabel('Zum Bestätigen LÖSCHEN eingeben').fill('LÖSCHEN');
    await page.screenshot({ path: testInfo.outputPath('delete-light.png') });
    await deletion.getByRole('button', { name: 'Auswahl zurücksetzen', exact: true }).click();
    await expect(deletion.getByRole('checkbox', { name: /Alle Schüler/ })).not.toBeChecked();
    await expect(deletion.getByRole('button', { name: 'Löschen', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'System Check, Backups & Wartung', exact: true }).click();
    const operations = page.getByRole('region', { name: 'System Check, Backups & Wartung', exact: true });
    await expect(operations.getByRole('heading', { name: 'Bereit für den Lauf?' })).toBeVisible();
    await operations.getByRole('button', { name: 'Backups', exact: true }).press('Enter');
    await expect(operations.getByRole('heading', { name: 'Datensicherungen', exact: true })).toBeVisible();
    await expect(operations.getByRole('heading', { name: 'Systemwartung', exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('backups-light.png') });
    await operations.getByRole('button', { name: 'Sicherheit', exact: true }).press('Enter');
    await expect(operations.getByLabel('Aktuelle PIN', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goto('/setup?tour=1&step=1');
    const tour = page.getByRole('dialog', { name: 'Klassenstruktur', exact: true });
    await expect(tour).toBeVisible();
    await expect(page.locator('.first-run-tour-spotlight')).toBeVisible();
    await expect.poll(async () => {
        const target = await page.locator('[data-tour="classes"]').boundingBox();
        const spotlight = await page.locator('.first-run-tour-spotlight').boundingBox();
        return Math.abs(spotlight.y - (target.y - 7));
    }).toBeLessThan(1);
    const target = await page.locator('[data-tour="classes"]').boundingBox();
    const popup = await tour.boundingBox();
    const intersects = target.x < popup.x + popup.width && target.x + target.width > popup.x && target.y < popup.y + popup.height && target.y + target.height > popup.y;
    expect(intersects).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('tour-light.png') });
    await page.keyboard.press('Escape');
});

test('Mobile Arbeitsbereiche: Menü bleibt beim Speichern offen, Layout in beiden Themes', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/moduleConfig', async route => route.fulfill({ json: route.request().method() === 'POST' ? { success: true, modules: route.request().postDataJSON() } : { donations: true, emails: true, teachers: true, scannerStations: true, doubleScanPrevention: { enabled: true, timeThresholdMinutes: 5, mode: 'confirm' } } }));
    for (const theme of ['light', 'dark']) {
        await setup(page, theme);
        const menu = page.getByRole('button', { name: 'Bereiche', exact: true });
        const navigation = page.getByRole('navigation', { name: 'Setup-Bereiche' });
        await menu.press('Enter');
        await expect(navigation.getByRole('button', { name: 'Module verwalten', exact: true })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(menu).toBeFocused();
        await expect(navigation).not.toBeVisible();
        await page.getByLabel('Mindestabstand', { exact: true }).fill('6');
        await menu.click();
        await page.locator('.setup-view:not([hidden])').getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
        await expect(navigation).toBeVisible();
        await expect(page.locator('.setup-view:not([hidden]) .settings-save-actions')).toContainText('Änderungen gespeichert');
        for (const [name, view] of [['Klassenstruktur', 'classStructure'], ['Scanner-Stationen', 'stations'], ['Lehrer verwalten', 'teachers'], ['Ergebnisse versenden', 'mails'], ['Spenden eintragen', 'donations'], ['Versand einrichten', 'smtpSettings'], ['System Check, Backups & Wartung', 'operations']]) {
            if (!await navigation.isVisible()) await menu.click();
            await navigation.getByRole('button', { name, exact: true }).click();
            await expect(page).toHaveURL(new RegExp(`view=${view}`));
            await expect(page.locator('.setup-view:not([hidden])')).toBeVisible();
            await expect(page.getByRole('dialog')).toHaveCount(0);
            if (view === 'operations') {
                const { data: readiness } = await (await page.request.get('/api/event-readiness')).json();
                expect(readiness.checks).not.toHaveProperty('recentBackup');
                expect(readiness.ready).toBe(readiness.checks.database && readiness.checks.diskSpace);
                await expect(page.getByText('Backup jünger als 24 h', { exact: true })).toHaveCount(0);
                await expect(page.getByText(/^Letztes Backup:/)).toBeVisible();
            }
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} ${name}`).toBe(true);
            await page.screenshot({ path: testInfo.outputPath(`${view}-${theme}-mobile.png`), fullPage: true, animations: 'disabled' });
        }
    }
});

test('Spenden öffnen eine eigene Seite mit Tastatur und Rückweg zum Setup', async ({ page }, testInfo) => {
    await page.route('**/api/moduleConfig', route => route.fulfill({ json: { donations: true, emails: false, teachers: false, scannerStations: false, doubleScanPrevention: { enabled: true, timeThresholdMinutes: 5, mode: 'confirm' } } }));
    await page.route('**/api/getAllStudents', route => route.fulfill({ json: [{ id: 1042, vorname: 'Anna', nachname: 'Schmidt', klasse: '5a', spenden: 0, spendenKonto: [] }] }));
    let saved;
    await page.route('**/api/donations*', async route => {
        if (route.request().method() === 'POST') {
            saved = route.request().postDataJSON();
            await route.fulfill({ json: { success: true } });
        } else await route.fulfill({ json: { spenden: 0, spendenKonto: [], expectedDonations: [], receivedDonations: [] } });
    });
    await setup(page);
    await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Spenden eintragen', exact: true }).press('Enter');
    await expect(page.getByRole('heading', { name: 'Spenden eintragen', exact: true })).toBeFocused();
    await expect(page.getByRole('combobox', { name: 'Schüler suchen' })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('donations-entry-light.png'), fullPage: true });
    await page.getByRole('link', { name: 'Spendenbereich öffnen' }).press('Enter');
    await expect(page).toHaveURL(/\/donations$/);
    const search = page.getByRole('combobox', { name: 'Schüler suchen' });
    await expect(search).toBeEnabled();
    await search.fill('Anna');
    await expect(page.getByRole('option', { name: /Anna Schmidt/ })).toBeVisible();
    await search.press('Enter');
    const amount = page.getByRole('textbox', { name: 'Fälliger Betrag in Euro' });
    await expect(amount).toBeFocused();
    await amount.pressSequentially('1500');
    await expect(amount).toHaveValue('15,00');
    await amount.press('Enter');
    await expect(page.getByText('Soll-Betrag erfolgreich gespeichert.')).toBeVisible();
    expect(saved).toMatchObject({ studentId: 1042, amount: '15,00€', mode: 'expected' });
    await page.getByRole('button', { name: 'Zu Dunkelmodus wechseln', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(13, 17, 23)');
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('donations-page-dark-mobile.png'), fullPage: true, animations: 'disabled' });
    await page.getByRole('link', { name: 'Zurück zum Setup' }).press('Enter');
    await expect(page).toHaveURL(/\/setup\?view=donations$/);
    await expect(page.getByRole('link', { name: 'Spendenbereich öffnen' })).toBeVisible();
});

test('Stationen behalten Entwürfe und speichern ihre Regeln einzeln', async ({ page }) => {
    const original = await (await page.request.get('/api/moduleConfig')).json();
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    await page.request.post('/api/moduleConfig', { data: { ...original, scannerStations: true } });
    const response = await page.request.post('/api/stations', { data: { name: 'Zentrale Teststation' } });
    const created = await response.json();
    try {
        await setup(page);
        await page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Scanner-Stationen', exact: true }).click();
        await page.getByRole('button', { name: /Zentrale Teststation Alle Klassen/ }).click();
        const editor = page.locator('.station-editor:visible');
        await editor.getByLabel('Stationsname', { exact: true }).fill('Neuer Stationsname');
        await editor.getByRole('radio', { name: 'Warnen' }).check();
        await editor.getByRole('checkbox', { name: 'Jahrgang 5', exact: true }).check();
        // Another laptop can rename this shared station while this browser has a draft.
        await page.request.patch('/api/stations', { data: { id: created.id, name: 'Aktualisierte Teststation', mode: 'allow', classes: [], grades: [] } });
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await expect(page.getByRole('button', { name: /Aktualisierte Teststation Alle Klassen/ })).toBeVisible();
        await expect(editor.getByLabel('Stationsname', { exact: true })).toHaveValue('Neuer Stationsname');
        await expect(page.getByRole('navigation', { name: 'Setup-Bereiche' }).getByRole('button', { name: 'Scanner-Stationen', exact: true })).toHaveAttribute('aria-describedby', 'setup-unsaved-description');
        await page.getByRole('button', { name: /Standard-Scanner Alle Klassen/ }).click();
        await editor.getByRole('radio', { name: 'Blockieren' }).check();
        await editor.getByRole('checkbox', { name: 'Jahrgang 5', exact: true }).check();
        await page.getByRole('button', { name: /Aktualisierte Teststation Alle Klassen/ }).click();
        await expect(editor.getByLabel('Stationsname', { exact: true })).toHaveValue('Neuer Stationsname');
        await editor.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
        await expect(editor.getByRole('status')).toContainText('Änderungen gespeichert');
        const stations = (await (await page.request.get('/api/stations')).json()).stations;
        expect(stations.find(station => station.id === created.id)).toMatchObject({ name: 'Neuer Stationsname', mode: 'warn', grades: ['5'] });
        expect(stations.find(station => station.id === 'default').mode).toBe('allow');
        await page.getByRole('button', { name: /Standard-Scanner Alle Klassen/ }).click();
        await expect(editor.getByRole('radio', { name: 'Blockieren' })).toBeChecked();
        await editor.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
        await expect(editor.getByRole('status')).toContainText('Änderungen gespeichert');
        expect((await (await page.request.get('/api/stations')).json()).stations.find(station => station.id === 'default').mode).toBe('block');
        await expect(page).toHaveURL(/view=stations/);
    } finally {
        await page.request.patch('/api/stations', { data: { id: 'default', name: 'Standard-Scanner', mode: 'allow', classes: [], grades: [] } });
        await page.request.post('/api/moduleConfig', { data: original });
    }
});
