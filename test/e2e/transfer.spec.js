import { test, expect } from '@playwright/test';

test('Schülerprofile laden Runden nur beim Öffnen, verwenden den Verlauf erneut und aktualisieren nach Änderungen', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    expect((await page.request.post('/api/students/9499', { data: { vorname: 'Transfer', nachname: 'Prüfung', klasse: '5a' } })).status()).toBe(201);
    try {
        for (let index = 0; index < 2; index++) expect((await page.request.post('/api/runden', { data: { id: 9499, confirmDoubleScan: true } })).status()).toBe(200);
        const requests = [];
        page.on('request', request => { if (request.url().includes('/9499/timestamps')) requests.push(request.url()); });
        await page.goto('/show');
        await page.getByLabel('Barcode oder Schüler-ID').fill('9499');
        await page.getByRole('button', { name: 'Anzeigen', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Transfer Prüfung' })).toBeVisible();
        expect(requests).toHaveLength(0);
        const summary = page.locator('.student-rounds-section > summary');
        await summary.click();
        await expect(page.locator('.timestamp-item')).toHaveCount(2);
        expect(requests).toHaveLength(1);
        await summary.click(); await summary.click();
        expect(requests).toHaveLength(1);
        await page.getByRole('button', { name: 'Runde 2 löschen', exact: true }).click();
        await expect(page.locator('.timestamp-item')).toHaveCount(1);
        expect(requests).toHaveLength(2);

        await page.goto('/manage?student=9499');
        const editor = page.getByRole('dialog', { name: 'Schüler bearbeiten' });
        await expect(editor).toBeVisible();
        expect(requests).toHaveLength(2);
        const history = editor.locator('.rounds-section > summary');
        await history.click();
        await expect(editor.locator('.timestamp-item')).toHaveCount(1);
        expect(requests).toHaveLength(3);
        await history.click(); await history.click();
        expect(requests).toHaveLength(3);
        await editor.getByRole('button', { name: 'Runde hinzufügen', exact: true }).click();
        await expect(editor.locator('.timestamp-item')).toHaveCount(2);
        expect(requests).toHaveLength(4);
        await page.keyboard.press('Escape');
        await page.getByRole('searchbox', { name: 'Suchen', exact: true }).fill('Transfer Prüfung');
        await expect(page.locator('.student-directory tbody tr')).toHaveCount(1);
        await expect(page.locator('.student-round-count')).toHaveText('2');
        const list = (await (await page.request.get('/api/getAllStudents?page=0&search=Transfer')).json()).data;
        expect(list.students).toHaveLength(1);
        expect(list.students[0].rounds).toBeUndefined();
        expect(list.students[0].timestamps).toBeUndefined();
    } finally { await page.request.delete('/api/students/9499'); }
});
