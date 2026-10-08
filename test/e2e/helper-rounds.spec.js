import { test, expect } from '@playwright/test';

test('Helfer korrigieren einzelne Runden auf /scan und /show ohne Zugriff auf Schülerverwaltung', async ({ page, browser }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    expect((await page.request.post('/api/students/9505', { data: { vorname: 'Helfer', nachname: 'Korrektur', klasse: '5a' } })).status()).toBe(201);
    const helperContext = await browser.newContext();
    try {
        const helper = await helperContext.newPage();
        await helper.goto('/scan');
        await helper.getByPlaceholder('Barcode scannen').fill('9505');
        await helper.getByPlaceholder('Barcode scannen').press('Enter');
        await expect(helper.locator('.scan-round-summary strong')).toHaveText('1');
        await helper.locator('.student-info-card > summary').click();
        await expect(helper.locator('.timestamp-item')).toHaveCount(1);
        await expect(helper.getByRole('link', { name: 'Helfer Korrektur bearbeiten', exact: true })).toHaveCount(0);
        const removed = helper.waitForResponse(response => response.url().includes('/api/rounds/') && response.request().method() === 'DELETE');
        await helper.locator('.timestamp-item').getByRole('button', { name: /löschen/ }).click();
        const removalResponse = await removed;
        expect(removalResponse.status(), JSON.stringify({ body: await removalResponse.json(), referer: removalResponse.request().headers().referer })).toBe(200);
        await expect(helper.locator('.scan-round-summary strong')).toHaveText('0');

        await helper.goto('/show');
        await helper.getByLabel('Barcode oder Schüler-ID').fill('9505');
        await helper.getByRole('button', { name: 'Anzeigen', exact: true }).click();
        await expect(helper.getByRole('heading', { name: 'Helfer Korrektur', exact: true })).toBeVisible();
        await expect(helper.getByRole('link', { name: 'Helfer Korrektur bearbeiten', exact: true })).toHaveCount(0);
        await helper.locator('.student-rounds-section > summary').click();
        await helper.getByRole('button', { name: 'Runde hinzufügen', exact: true }).click();
        await expect(helper.locator('.student-rounds-list .timestamp-item')).toHaveCount(1);
        await expect(helper.locator('.student-rounds-count')).toHaveText('1 Runde');
        const history = (await (await helper.request.get('/api/students/9505/timestamps')).json()).data;
        const roundId = history.rounds[0].id;
        const deletion = (headers = {}) => helper.request.delete(`/api/rounds/${roundId}`, { headers, data: { studentId: 9505 } });
        expect((await deletion()).status()).toBe(401);
        expect((await deletion({ referer: 'http://127.0.0.1:3100/statistics' })).status()).toBe(401);
        expect((await deletion({ referer: 'https://external.example/show' })).status()).toBe(401);
        expect((await deletion({ referer: 'http://127.0.0.1:3100/show', 'sec-fetch-site': 'cross-site' })).status()).toBe(403);
        expect((await helper.request.delete(`/api/rounds/${roundId}`, {
            headers: { referer: 'http://127.0.0.1:3100/show' }, data: { studentId: 1001 },
        })).status()).toBe(404);
        expect((await helper.request.put('/api/students/9505', { data: { vorname: 'Unbefugt' } })).status()).toBe(401);
        await helper.getByRole('button', { name: 'Runde 1 löschen', exact: true }).click();
        await expect(helper.locator('.student-rounds-count')).toHaveText('0 Runden');
        await expect(helper.locator('.student-rounds-list .timestamp-item')).toHaveCount(0);
        await helper.goto('/manage');
        await expect(helper).toHaveURL(/\/admin-login\?next=/);
    } finally {
        await helperContext.close();
        await page.request.delete('/api/students/9505');
    }
});
