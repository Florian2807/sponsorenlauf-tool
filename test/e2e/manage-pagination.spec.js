import { test, expect } from '@playwright/test';

test('Schülerliste lädt nur auf Wunsch jeweils 200 Einträge und setzt bei Suche und Sortierung zurück', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    const students = Array.from({ length: 405 }, (_, index) => ({
        id: 20001 + index, vorname: 'VerwaltungsseitenTest', nachname: `Schüler${String(index + 1).padStart(3, '0')}`,
        klasse: '5a', geschlecht: 'divers',
    }));
    expect((await page.request.post('/api/importStudents', { data: { students } })).ok()).toBe(true);
    const requests = [];
    page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname === '/api/getAllStudents' && url.searchParams.has('page')) requests.push(url);
    });
    await page.goto('/manage');
    const rows = page.locator('.student-directory tbody tr');
    await expect(rows).toHaveCount(200);
    await page.getByRole('searchbox', { name: 'Suchen', exact: true }).fill('VerwaltungsseitenTest');
    const footer = page.getByRole('group', { name: 'Weitere Schüler', exact: true });
    await expect(footer).toContainText('200 von 405 Schülern geladen');
    await expect(rows).toHaveCount(200);
    const filteredRequests = () => requests.filter(url => url.searchParams.get('search') === 'VerwaltungsseitenTest');
    const beforeScroll = filteredRequests().length;
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    expect(filteredRequests()).toHaveLength(beforeScroll);

    // A failed second page must be retryable without skipping any entries.
    let failNext = true;
    await page.route('**/api/getAllStudents?*', async route => {
        const url = new URL(route.request().url());
        if (url.searchParams.get('page') === '1' && failNext) {
            failNext = false;
            await route.fulfill({ status: 503, json: { success: false, message: 'Schülerliste vorübergehend nicht erreichbar' } });
        } else await route.continue();
    });
    await footer.getByRole('button', { name: '200 weitere laden', exact: true }).click();
    await expect(page.locator('.manage-page').getByRole('alert')).toContainText('vorübergehend nicht erreichbar');
    await expect(rows).toHaveCount(200);
    await footer.getByRole('button', { name: '200 weitere laden', exact: true }).click();
    await expect(rows).toHaveCount(400);
    await expect(footer).toContainText('400 von 405 Schülern geladen');
    expect(filteredRequests().at(-1).searchParams.get('page')).toBe('1');
    await footer.getByRole('button', { name: '200 weitere laden', exact: true }).click();
    await expect(rows).toHaveCount(405);
    await expect(footer).toContainText('Alle 405 Schüler geladen');
    await expect(footer.getByRole('button')).toHaveCount(0);
    const ids = await rows.locator('.student-id-cell').evaluateAll(cells => cells.map(cell => cell.textContent.replace(/VerwaltungsseitenTest Schüler\d+|ID/g, '').trim()));
    expect(new Set(ids).size).toBe(405);

    await page.getByRole('button', { name: /^ID/ }).click();
    await expect(footer).toContainText('200 von 405 Schülern geladen');
    await expect(rows).toHaveCount(200);
    await expect(rows.first().locator('.student-id-cell')).toContainText('20405');
    await page.getByRole('searchbox', { name: 'Suchen', exact: true }).fill('VerwaltungsseitenTest Schüler405');
    await expect(rows).toHaveCount(1);
    await expect(footer).toContainText('Alle 1 Schüler geladen');
    expect(requests.at(-1).searchParams.get('page')).toBe('0');
    const result = (await (await page.request.get('/api/getAllStudents?page=1&search=VerwaltungsseitenTest')).json()).data;
    expect(result.size).toBe(200);
    expect(result.students).toHaveLength(200);
    expect(result.students[0].id).toBe(20201);

    // A failed filter change must never relabel the previous filter's rows.
    let failFilteredPage = true;
    await page.route('**/api/getAllStudents?*', async route => {
        const url = new URL(route.request().url());
        if (url.searchParams.get('search') === 'VerwaltungsseitenTest Schüler404' && failFilteredPage) {
            failFilteredPage = false;
            await route.fulfill({ status: 503, json: { success: false, message: 'Filter konnte nicht geladen werden' } });
        } else await route.fallback();
    });
    await page.getByRole('searchbox', { name: 'Suchen', exact: true }).fill('VerwaltungsseitenTest Schüler404');
    await expect(page.locator('.manage-page').getByRole('alert')).toContainText('Filter konnte nicht geladen werden');
    await expect(rows).toHaveCount(0);
    await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('.student-id-cell')).toContainText('20404');

    await page.getByRole('button', { name: 'Status: Alle Schüler', exact: true }).click();
    await page.getByRole('menuitemradio', { name: 'Mit Runden', exact: true }).click();
    await expect(rows).toHaveCount(0);
    await page.getByRole('button', { name: 'Status: Mit Runden', exact: true }).click();
    await page.getByRole('menuitemradio', { name: 'Ohne Runden', exact: true }).click();
    await expect(rows).toHaveCount(1);
    await page.getByRole('button', { name: 'Suche leeren', exact: true }).click();
    await expect(page.getByRole('searchbox', { name: 'Suchen', exact: true })).toHaveValue('');
    await expect(page.getByRole('searchbox', { name: 'Suchen', exact: true })).toBeFocused();
    await expect(rows).toHaveCount(200);
    await page.getByRole('button', { name: 'Zurücksetzen', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Status: Alle Schüler', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Status: Alle Schüler', exact: true }).click();
    const menuBounds = await page.locator('.manage-status-filter .live-filter-popover').boundingBox();
    expect(menuBounds.x).toBeGreaterThanOrEqual(0);
    expect(menuBounds.x + menuBounds.width).toBeLessThanOrEqual(390);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Status: Alle Schüler', exact: true })).toBeFocused();
});
