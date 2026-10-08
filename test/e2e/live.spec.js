import { test, expect } from '@playwright/test';

test('Scan-Historie, Rundenanzeige und Live-Panel folgen gespeicherten Scans über mehrere Geräte', async ({ page, browser }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    for (const [id, vorname] of [[9101, 'LiveAnna'], [9102, 'LiveMax']]) {
        const response = await page.request.post(`/api/students/${id}`, { data: { vorname, nachname: 'LiveTest', klasse: '5a', geschlecht: 'divers' } });
        expect(response.status()).toBe(201);
    }
    const displayContext = await browser.newContext();
    const otherContext = await browser.newContext();
    try {
        const display = await displayContext.newPage();
        const other = await otherContext.newPage();
        const panel = await page.context().newPage();
        await page.goto('/scan');
        await page.getByRole('button', { name: 'Einstellungen öffnen', exact: true }).click();
        await page.getByRole('button', { name: 'Rundenanzeige verbinden', exact: true }).click();
        await expect(page.getByLabel('Link für das iPad')).toHaveValue(/device=/);
        const link = await page.getByLabel('Link für das iPad').inputValue();
        await page.keyboard.press('Escape');
        await display.goto(link);
        await expect(display.getByRole('heading', { name: 'Bereit für deinen Scan' })).toBeVisible();
        await expect(display.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(0);
        await display.evaluate(() => {
            window.scanPulses = [];
            new MutationObserver(records => {
                for (const record of records) for (const node of record.addedNodes) {
                    if (node.nodeType === 1 && node.classList.contains('student-display-scan-pulse')) {
                        window.scanPulses.push(node.classList.contains('student-display-scan-pulse-error') ? 'error' : 'success');
                    }
                }
            }).observe(document.querySelector('.student-display'), { childList: true });
        });
        await panel.goto('/live');
        const input = page.getByPlaceholder('Barcode scannen');
        await input.fill('919999');
        await input.press('Enter');
        await expect(page.getByRole('alert').filter({ hasText: 'Schüler mit dieser ID nicht gefunden' })).toBeVisible();
        await expect.poll(() => display.evaluate(() => window.scanPulses)).toEqual(['error']);
        await expect(display.getByRole('heading', { name: 'Bereit für deinen Scan' })).toBeVisible();
        await input.fill('9101');
        await input.press('Enter');
        const history = page.getByRole('region', { name: 'Letzte Scans' });
        await expect(history.getByRole('button').filter({ hasText: 'LiveAnna' })).toHaveCount(1);
        await expect(display.getByRole('heading', { name: 'LiveAnna LiveTest' })).toBeVisible();
        await expect(display.locator('.student-display-rounds strong')).toHaveText('1');
        await expect.poll(() => display.evaluate(() => window.scanPulses)).toEqual(['error', 'success']);
        await expect(panel.getByRole('region', { name: 'Aktuelle Scans' })).toContainText('LiveAnna');

        // The second laptop must not leak into the first laptop's history or its display.
        await other.goto('/scan');
        await other.getByPlaceholder('Barcode scannen').fill('9102');
        await other.getByPlaceholder('Barcode scannen').press('Enter');
        await expect(panel.getByRole('region', { name: 'Aktuelle Scans' })).toContainText('LiveMax');
        await expect(history).not.toContainText('LiveMax');
        await expect(display.getByRole('heading', { name: 'LiveAnna LiveTest' })).toBeVisible();

        // A cancelled duplicate contributes no history entry.
        await input.fill('9101'); await input.press('Enter');
        const duplicate = page.getByRole('dialog', { name: 'Doppel-Scan Warnung' });
        await expect(duplicate).toBeVisible();
        await expect(history.getByRole('button')).toBeDisabled();
        // Global disabled-button styles must not turn history rows white behind a dialog.
        for (const theme of ['dark', 'light']) {
            await page.evaluate(value => {
                document.documentElement.setAttribute('data-theme', value);
                document.body.setAttribute('data-theme', value);
            }, theme);
            await expect(history.getByRole('button')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        }
        await page.keyboard.press('Escape');
        await expect(history.getByRole('button')).toHaveCount(1);
        await expect(display.getByRole('heading', { name: 'LiveAnna LiveTest' })).toHaveCount(0);
        await expect(display.locator('.student-display-rounds')).toHaveCount(0);
        await expect(display.getByRole('heading', { name: 'Bereit für deinen Scan' })).toBeVisible();
        // Reconnecting with the same saved scan must not restore cleared student data.
        await displayContext.setOffline(true);
        await expect(display.getByRole('heading', { name: 'Verbindung wird wiederhergestellt' })).toBeVisible();
        await displayContext.setOffline(false);
        await expect(display.getByRole('heading', { name: 'Bereit für deinen Scan' })).toBeVisible();
        await expect(display.getByRole('heading', { name: 'LiveAnna LiveTest' })).toHaveCount(0);
        await history.getByRole('button').click();
        await expect(page.locator('.message-info[role="status"]')).toContainText('keine Runde gezählt');
        await expect(input).toBeFocused();
        await page.reload();
        await expect(history.getByRole('button')).toHaveCount(1);

        // Keyboard selection and editing stay within the live panel.
        const search = panel.getByRole('textbox', { name: 'Scans suchen' });
        await search.fill('LiveAnna');
        await expect(panel.getByRole('listbox')).toHaveCount(0);
        const scanEntry = panel.getByRole('region', { name: 'Aktuelle Scans' }).getByRole('button');
        await expect(scanEntry).toHaveCount(1);
        await scanEntry.focus();
        await scanEntry.press('Enter');
        await panel.getByRole('button', { name: 'Schüler bearbeiten', exact: true }).click();
        const editor = panel.getByRole('dialog', { name: 'Schüler bearbeiten' });
        await editor.getByLabel('Vorname', { exact: true }).fill('LiveAnne');
        await editor.getByLabel('Vorname', { exact: true }).press('Enter');
        await expect(editor).not.toBeVisible();
        // Editing a student is not a successful scan and must keep the display empty.
        await expect(display.getByRole('heading', { name: 'LiveAnne LiveTest' })).toHaveCount(0);
        await expect(display.getByRole('heading', { name: 'Bereit für deinen Scan' })).toBeVisible();

        await panel.getByRole('button', { name: 'Ersatz-ID hinzufügen', exact: true }).click();
        const replacement = panel.getByRole('dialog', { name: 'Ersatz-ID hinzufügen' });
        await replacement.getByLabel('Ersatz-ID (optional)').fill('E9101');
        await replacement.getByLabel('Ersatz-ID (optional)').press('Enter');
        await expect(replacement).not.toBeVisible();
        await expect(panel.getByRole('region', { name: 'Ausgewählter Schüler' })).toContainText('E9101');
        await input.fill('e9101'); await input.press('Enter');
        await expect(duplicate).toBeVisible();
        await expect(duplicate.getByRole('button', { name: 'Runde trotzdem zählen' })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(history.getByRole('button')).toHaveCount(2);
        await expect(display.locator('.student-display-rounds strong')).toHaveText('2');

        // Retrying the same stored scan must not produce an extra event.
        const deviceId = await page.evaluate(() => localStorage.getItem('sponsorenlauf.deviceId'));
        const scanId = 'scan_live_replay_9101';
        const body = { id: 9101, scanId, sourceDeviceId: deviceId, confirmDoubleScan: true };
        expect((await page.request.post('/api/runden', { data: body })).status()).toBe(200);
        expect((await page.request.post('/api/runden', { data: body })).status()).toBe(200);
        await expect(history.getByRole('button')).toHaveCount(3);
        await search.fill('LiveAnne');
        await expect(panel.getByRole('region', { name: 'Aktuelle Scans' }).locator('.live-scan-rounds')).toHaveText(['3. Runde', '2. Runde', '1. Runde']);
        await expect(display.locator('.student-display-rounds strong')).toHaveText('3');

        await displayContext.setOffline(true);
        await expect(display.getByRole('heading', { name: 'Verbindung wird wiederhergestellt' })).toBeVisible();
        await expect(display.getByRole('heading', { name: 'LiveAnne LiveTest' })).toHaveCount(0);
        await displayContext.setOffline(false);
        await expect(display.getByRole('heading', { name: 'LiveAnne LiveTest' })).toBeVisible();
        await display.clock.setFixedTime(new Date(Date.now() + 31000));
        await expect(display.getByRole('heading', { name: 'Bereit für deinen Scan' })).toBeVisible();

        expect((await otherContext.request.get('/api/scan-feed')).status()).toBe(401);
        expect((await otherContext.request.get(`/api/scan-feed?device=${deviceId}&view=admin`)).status()).toBe(401);
        expect((await otherContext.request.get('/api/student-search?q=LiveAnne')).status()).toBe(401);
        expect((await otherContext.request.get('/api/scan-feed?device=bad!')).status()).toBe(400);
        expect((await otherContext.request.post('/api/scan-feed', { data: { deviceId: 'bad!' } })).status()).toBe(400);
        expect((await otherContext.request.post('/api/scan-feed', {
            data: { deviceId }, headers: { Origin: 'https://untrusted.example' },
        })).status()).toBe(403);
        const ownFeed = await (await otherContext.request.get(`/api/scan-feed?device=${deviceId}`)).json();
        expect(ownFeed.scans).toHaveLength(3);
        expect(ownFeed.scans.every(scan => scan.student.id === 9101)).toBe(true);
        await other.goto('/live');
        await expect(other).toHaveURL(/admin-login/);
    } finally { await displayContext.close(); await otherContext.close(); }
});

test('Feststelltasten-Hinweis unterbricht keinen Scan und die Anzeige bleibt in beiden Themes mobil nutzbar', async ({ page }) => {
    await page.goto('/scan');
    const input = page.getByPlaceholder('Barcode scannen');
    await input.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', modifierCapsLock: true, bubbles: true })));
    await expect(page.getByRole('alert').filter({ hasText: 'Feststelltaste' })).toBeVisible();
    await expect(input).toBeFocused();
    await input.evaluate(element => element.dispatchEvent(new KeyboardEvent('keyup', { key: 'CapsLock', modifierCapsLock: false, bubbles: true })));
    await expect(page.getByRole('alert').filter({ hasText: 'Feststelltaste' })).toHaveCount(0);
    for (const theme of ['light', 'dark']) {
        await page.evaluate(value => localStorage.setItem('theme', value), theme);
        for (const path of ['/scan', '/display?device=device_empty_live_test']) {
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto(path);
            await expect(page.locator('.scan-history, .student-display-empty')).toBeVisible();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
    }
    await page.goto('/display?device=bad!');
    await expect(page.getByRole('heading', { name: 'Scanner auswählen' })).toBeVisible();
    const options = page.getByRole('button', { name: 'Anzeigeoptionen' });
    await expect(options).toHaveAttribute('aria-expanded', 'false');
    await options.focus();
    await options.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Vollbild umschalten' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(options).toBeFocused();
    await expect(options).toHaveAttribute('aria-expanded', 'false');
    await options.press('Enter');
    const themeToggle = page.getByRole('button', { name: 'Zu Hellmodus wechseln' });
    await themeToggle.focus();
    await themeToggle.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
    await page.reload();
    await expect(options).toHaveAttribute('aria-expanded', 'false');
    await options.click();
    await expect(page.getByRole('button', { name: 'Zu Dunkelmodus wechseln' })).toBeVisible();
    await page.locator('.student-display-header > span').click();
    await expect(options).toHaveAttribute('aria-expanded', 'false');
});

test('Live-Panel filtert Laptops und Klassen, sucht Schüler und bearbeitet Runden direkt mit Live-Updates', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    for (const [id, vorname, klasse] of [[9201, 'PanelAlpha', '5a'], [9202, 'PanelBeta', '6b'], [9203, 'PanelOhneScan', '5a']]) {
        expect((await page.request.post(`/api/students/${id}`, { data: { vorname, nachname: 'LiveTest', klasse, geschlecht: 'divers' } })).ok()).toBe(true);
    }
    const left = 'device_admin_panel_left';
    const right = 'device_admin_panel_right';
    for (const [deviceId, name] of [[left, 'Panel links'], [right, 'Panel rechts']]) {
        expect((await page.request.post('/api/stations/heartbeat', { data: { deviceId } })).ok()).toBe(true);
        expect((await page.request.put('/api/scan-devices', { data: { deviceId, name } })).ok()).toBe(true);
    }
    for (const [id, sourceDeviceId] of [[9201, left], [9202, right]]) {
        expect((await page.request.post('/api/runden', { data: { id, sourceDeviceId, scanId: `scan_panel_initial_${id}`, confirmDoubleScan: true } })).ok()).toBe(true);
    }
    const histories = [];
    page.on('request', request => { if (request.url().includes('/9201/timestamps')) histories.push(request); });
    await page.goto('/live');
    const feed = page.getByRole('region', { name: 'Aktuelle Scans' });
    const search = page.getByRole('textbox', { name: 'Scans suchen' });
    const laptop = page.getByRole('button', { name: /^Scanner:/ });
    const chooseLaptop = async name => { await laptop.click(); await page.getByRole('menu', { name: 'Scanner auswählen' }).getByRole('menuitemradio', { name, exact: true }).click(); };
    const klasse = page.getByRole('button', { name: /^Klasse:/ });
    for (const [trigger, label] of [[laptop, 'Scanner auswählen'], [klasse, 'Klasse auswählen']]) {
        const menu = page.getByRole('menu', { name: label });
        await trigger.click();
        await expect(menu).toBeVisible();
        // Some browsers blur the focused option without reporting the next focus target.
        await menu.getByRole('menuitemradio', { checked: true }).evaluate(option => option.blur());
        await trigger.click();
        await expect(menu).toHaveCount(0);
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(trigger).toBeFocused();
        await trigger.press('Enter');
        await expect(menu).toBeVisible();
        await trigger.focus();
        await trigger.press('Enter');
        await expect(menu).toHaveCount(0);
    }
    await laptop.focus();
    await laptop.press('Enter');
    await expect(page.getByRole('menu', { name: 'Scanner auswählen' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(laptop).toBeFocused();
    await search.fill('Panel');
    await expect(feed.getByRole('button')).toHaveCount(2);
    await chooseLaptop('Panel links');
    await expect(feed.getByRole('button')).toHaveCount(1);
    await expect(feed).toContainText('PanelAlpha');
    await klasse.click();
    await expect(page.getByRole('menu', { name: 'Klasse auswählen' })).toBeVisible();
    await page.keyboard.press('End');
    await expect(page.getByRole('menuitemradio', { name: 'Klasse 6b', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(feed).toContainText('Keine Scans passen');
    await chooseLaptop('Alle Scanner');
    await expect(feed.getByRole('button')).toHaveCount(1);
    await expect(feed).toContainText('PanelBeta');
    await page.getByRole('button', { name: 'Zurücksetzen', exact: true }).click();
    await expect(search).toBeFocused();
    await search.fill('Panel');
    await page.getByRole('button', { name: 'Suche leeren' }).click();
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();
    await search.fill('PanelAlpha');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await feed.getByRole('button').click();
    const card = page.getByRole('region', { name: 'Ausgewählter Schüler' });
    await expect(card.locator('.live-student-count strong')).toHaveText('1');
    await page.getByRole('button', { name: 'Schüler bearbeiten', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Schüler bearbeiten' });
    await expect(editor).toBeVisible();
    expect(histories).toHaveLength(0);
    await editor.getByLabel('Vorname', { exact: true }).fill('PanelAlphaNeu');
    await editor.locator('summary').filter({ hasText: 'Rundenverlauf' }).click();
    await expect(editor.locator('.timestamp-item')).toHaveCount(1);
    await editor.getByRole('button', { name: 'Runde hinzufügen' }).click();
    await expect(editor.locator('.timestamp-item')).toHaveCount(2);
    await expect(card.locator('.live-student-count strong')).toHaveText('2');
    expect((await page.request.post('/api/runden', { data: { id: 9201, sourceDeviceId: right, scanId: 'scan_panel_external_update', confirmDoubleScan: true } })).ok()).toBe(true);
    await expect(editor.locator('.timestamp-item')).toHaveCount(3);
    await expect(card.locator('.live-student-count strong')).toHaveText('3');
    await expect(editor.getByLabel('Vorname', { exact: true })).toHaveValue('PanelAlphaNeu');
    await editor.getByRole('button', { name: 'Runde 3 löschen', exact: true }).click();
    await editor.getByRole('button', { name: 'Ja, löschen' }).click();
    await expect(editor.locator('.timestamp-item')).toHaveCount(2);
    await expect(card.locator('.live-student-count strong')).toHaveText('2');
    await editor.getByLabel('Vorname', { exact: true }).press('Enter');
    await expect(editor).not.toBeVisible();
    await expect(card).toContainText('PanelAlphaNeu');
    await expect(page).toHaveURL(/\/live$/);
    expect(await card.locator('a[href*="/manage"]').count()).toBe(0);

    // Search only returns recorded scans; selecting a scan keeps the profile live.
    await chooseLaptop('Panel links');
    await search.fill('PanelOhneScan');
    await expect(feed).toContainText('Keine Scans passen');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await search.fill('PanelAlphaNeu');
    await expect(feed.getByRole('button')).toHaveCount(1);
    await expect(feed.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Schüler bearbeiten', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(editor).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Schüler bearbeiten', exact: true })).toBeFocused();
    for (const theme of ['light', 'dark']) {
        await page.evaluate(value => { localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }, theme);
        await page.setViewportSize({ width: 390, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
});


test('Live-Panel lädt jeweils 30 ältere Scans dazu und erhält bestehende Einträge und die Scrollposition', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    const device = 'device_pagination_history';
    for (const [id, vorname, klasse] of [[9301, 'VerlaufAlt', '5a'], [9302, 'VerlaufNeu', '6b']]) {
        expect((await page.request.post(`/api/students/${id}`, { data: { vorname, nachname: 'Pagination', klasse, geschlecht: 'divers' } })).ok()).toBe(true);
    }
    const record = async (id, index) => {
        expect((await page.request.post('/api/runden', { data: { id, sourceDeviceId: device,
            scanId: `scan_pagination_${index}`, confirmDoubleScan: true } })).ok()).toBe(true);
    };
    await record(9301, 0);
    for (let index = 1; index < 65; index++) await record(9302, index);
    const unauthorized = await page.context().browser().newContext();
    try {
        expect((await unauthorized.request.get(`/api/scan-feed?page=2&device=${device}&view=display`)).status()).toBe(401);
    } finally { await unauthorized.close(); }
    for (const params of ['page=0', 'page=1.5', 'page=2&through=-1', 'page=1&q=a&q=b']) {
        expect((await page.request.get(`/api/scan-feed?${params}`)).status()).toBe(400);
    }
    const api = await (await page.request.get(`/api/scan-feed?page=999&device=${device}`)).json();
    expect(api.page).toBe(3);
    expect(api.total).toBe(65);
    expect(api.scans).toHaveLength(5);
    await page.goto('/live');
    const search = page.getByRole('textbox', { name: 'Scans suchen' });
    const feed = page.getByRole('region', { name: 'Aktuelle Scans' });
    const more = page.getByRole('group', { name: 'Weitere Scans' });
    const loadMore = more.getByRole('button', { name: '30 weitere laden' });
    await search.fill('Pagination');
    await expect(feed.getByRole('button')).toHaveCount(30);
    await expect(feed).toContainText('30 von 65 Scans');
    const firstEntries = await feed.locator('.scan-history-list').innerText();
    await feed.getByRole('button').first().click();
    await expect(feed.locator('.scan-history-list')).toHaveCSS('overflow-y', 'visible');
    await loadMore.scrollIntoViewIfNeeded();
    const scrollTop = await page.evaluate(() => window.scrollY);
    expect(scrollTop).toBeGreaterThan(1000);
    const sidebar = page.getByRole('complementary', { name: 'Schülerauswahl und Aktionen' });
    await expect(sidebar).toHaveCSS('position', 'sticky');
    expect(await sidebar.evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(await page.locator('header').evaluate(element => element.getBoundingClientRect().bottom + 20), 0);
    await expect(page.getByRole('button', { name: 'Ersatz-ID hinzufügen', exact: true })).toBeInViewport();
    await loadMore.click();
    await expect(feed.getByRole('button')).toHaveCount(60);
    await expect(feed).toContainText('60 von 65 Scans');
    expect(await feed.locator('.scan-history-list').innerText()).toMatch(firstEntries);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollTop);
    const entries = await feed.locator('.scan-history-list').innerText();
    await record(9302, 65);
    await expect.poll(async () => (await (await page.request.get(`/api/scan-feed?page=1&device=${device}`)).json()).total).toBe(66);
    await expect(loadMore).toBeEnabled();
    await expect(feed.locator('.scan-history-list')).toHaveText(entries, { useInnerText: true });
    await loadMore.click();
    await expect(feed.getByRole('button')).toHaveCount(65);
    await expect(feed.getByRole('button').last()).toContainText('VerlaufAlt');
    await expect(more).toContainText('Alle Scans geladen');
    await expect(loadMore).toHaveCount(0);
    // The oldest scan is searchable even though it is outside the live feed's 30 rows.
    await search.fill('VerlaufAlt');
    await expect(feed.getByRole('button')).toHaveCount(1);
    await expect(more).toContainText('Alle Scans geladen');
    await search.fill('9301 5a');
    await expect(feed.getByRole('button')).toHaveCount(1);
    await search.fill('%');
    await expect(feed).toContainText('Keine Scans passen');
    await search.fill('Pagination');
    await expect(feed).toContainText('30 von 66 Scans');
    await loadMore.click();
    await expect(feed.getByRole('button')).toHaveCount(60);
    await loadMore.click();
    await expect(feed.getByRole('button')).toHaveCount(66);
    await expect(more).toContainText('Alle Scans geladen');
    await page.setViewportSize({ width: 1280, height: 480 });
    await expect(sidebar).toHaveCSS('position', 'static');
    await page.setViewportSize({ width: 390, height: 844 });
    const oldest = feed.getByRole('button').last();
    await oldest.click();
    await expect(sidebar.locator('.live-student-identity h2')).toHaveText('VerlaufAlt Pagination');
    await expect(sidebar.getByRole('button', { name: 'Schüler bearbeiten', exact: true })).toBeInViewport();
    await sidebar.getByRole('button', { name: 'Zur Scanliste', exact: true }).click();
    await expect(oldest).toBeFocused();
    await expect(oldest).toBeInViewport();
    await sidebar.getByRole('button', { name: 'Zu Suche und Filtern', exact: true }).click();
    await expect(search).toBeFocused();
    await expect(search).toBeInViewport();
});

test('Live-Panel gruppiert Klassen nach Stufen und filtert gesamte Stufen einschließlich eigener Klassennamen', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    const original = (await (await page.request.get('/api/classStructure')).json()).data;
    try {
        expect((await page.request.put('/api/classStructure', { data: { availableClasses: {
            ...original, '5': ['5a', '5b', '5c', 'Projekt'], '50': ['50a'],
        } } })).ok()).toBe(true);
        for (const [id, klasse, rounds] of [[9701, '5a', 15], [9702, '5b', 15], [9703, '5c', 5], [9704, 'Projekt', 1], [9705, '50a', 1]]) {
            expect((await page.request.post(`/api/students/${id}`, { data: {
                vorname: 'StufenFilter', nachname: klasse, klasse, geschlecht: 'divers',
            } })).ok()).toBe(true);
            for (let index = 0; index < rounds; index++) {
                expect((await page.request.post('/api/runden', { data: {
                    id, sourceDeviceId: 'device_grade_filter', scanId: `scan_grade_${id}_${index}`, confirmDoubleScan: true,
                } })).ok()).toBe(true);
            }
        }
        expect((await page.request.get('/api/scan-feed?page=1&grade=5&grade=6')).status()).toBe(400);
        const gradeResult = await (await page.request.get('/api/scan-feed?page=1&grade=5&q=StufenFilter')).json();
        expect(gradeResult.total).toBe(36);
        const unrelated = await (await page.request.get('/api/scan-feed?page=1&grade=50&q=StufenFilter')).json();
        expect(unrelated.total).toBe(1);
        await page.goto('/live');
        const search = page.getByRole('textbox', { name: 'Scans suchen' });
        const feed = page.getByRole('region', { name: 'Aktuelle Scans' });
        const trigger = page.getByRole('button', { name: /^Klasse:/ });
        const menu = page.getByRole('menu', { name: 'Klasse auswählen' });
        await search.fill('StufenFilter');
        await trigger.click();
        const grade = menu.getByRole('group', { name: 'Stufe 5', exact: true });
        await expect(grade.getByRole('menuitemradio', { name: /^Klasse/ })).toHaveCount(4);
        await grade.getByRole('menuitemradio', { name: 'Stufe 5', exact: true }).click();
        await expect(trigger).toHaveAccessibleName('Klasse: Stufe 5');
        await expect(trigger).toBeFocused();
        await expect(feed).toContainText('30 von 36 Scans');
        await page.getByRole('button', { name: '30 weitere laden' }).click();
        await expect(feed.getByRole('button')).toHaveCount(36);
        await expect(feed).toContainText('StufenFilter Projekt');
        await expect(feed).not.toContainText('StufenFilter 50a');
        await trigger.click();
        await expect(grade.getByRole('menuitemradio', { name: 'Stufe 5', exact: true })).toHaveAttribute('aria-checked', 'true');
        await page.keyboard.press('ArrowRight');
        await expect(grade.getByRole('menuitemradio', { name: 'Klasse 5a', exact: true })).toBeFocused();
        await grade.getByRole('menuitemradio', { name: 'Klasse 5b', exact: true }).click();
        await expect(trigger).toHaveAccessibleName('Klasse: Klasse 5b');
        await expect(feed.getByRole('button')).toHaveCount(15);
        await expect(feed).not.toContainText('StufenFilter 5a');
        await trigger.click();
        await grade.getByRole('menuitemradio', { name: 'Stufe 5', exact: true }).click();
        await expect(feed.getByRole('button')).toHaveCount(30);
        for (const theme of ['light', 'dark']) {
            await page.evaluate(value => { localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }, theme);
            await page.setViewportSize({ width: 390, height: 844 });
            await trigger.click();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await expect(grade.getByRole('menuitemradio', { name: 'Klasse 5c', exact: true })).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(trigger).toBeFocused();
        }
        await page.getByRole('button', { name: 'Zurücksetzen', exact: true }).click();
        await expect(trigger).toHaveAccessibleName('Klasse: Alle Klassen');
    } finally {
        expect((await page.request.put('/api/classStructure', { data: { availableClasses: original } })).ok()).toBe(true);
    }
});

test('Schülersuche rechts und Scans links steuern gemeinsam Bearbeiten und Ersatz-ID-Zuordnung', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    for (const [id, vorname] of [[9801, 'ErsatzScan'], [9802, 'ErsatzOhneScan']]) {
        expect((await page.request.post(`/api/students/${id}`, { data: { vorname, nachname: 'Zuordnung', klasse: '5a', geschlecht: 'divers' } })).ok()).toBe(true);
    }
    expect((await page.request.post('/api/runden', { data: {
        id: 9801, sourceDeviceId: 'device_replacement_live', scanId: 'scan_replacement_live_9801', confirmDoubleScan: true,
    } })).ok()).toBe(true);
    await page.goto('/live');
    const feed = page.getByRole('region', { name: 'Aktuelle Scans' });
    const card = page.getByRole('region', { name: 'Ausgewählter Schüler' });
    const search = page.getByRole('combobox', { name: 'Schüler suchen' });
    const button = card.getByRole('button', { name: 'Ersatz-ID hinzufügen', exact: true });
    const edit = card.getByRole('button', { name: 'Schüler bearbeiten', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Ersatz-ID hinzufügen' });
    const add = dialog.getByRole('button', { name: 'Hinzufügen', exact: true });
    await expect(button).toBeDisabled();
    await expect(edit).toBeDisabled();
    await page.getByRole('textbox', { name: 'Scans suchen' }).fill('ErsatzScan');
    const scan = feed.getByRole('button');
    await expect(scan).toHaveCount(1);
    await expect(scan).toHaveAttribute('aria-pressed', 'false');
    await scan.click();
    await expect(scan).toHaveAttribute('aria-pressed', 'true');
    await expect(search).toHaveValue('ErsatzScan Zuordnung');
    await expect(edit).toBeEnabled();
    await button.click();
    await expect(dialog).toContainText('ErsatzScan Zuordnung');
    await expect(dialog.getByRole('combobox')).toHaveCount(0);
    await dialog.getByLabel('Ersatz-ID (optional)').fill('E9801');
    await add.click();
    await expect(dialog).not.toBeVisible();
    await expect(card.getByRole('status')).toContainText('E9801');
    await expect(card.getByRole('status')).toContainText('ErsatzScan Zuordnung');
    await scan.click();
    await expect(scan).toHaveAttribute('aria-pressed', 'false');
    await expect(search).toHaveValue('');
    await expect(card).toContainText('Kein Schüler ausgewählt');
    await expect(button).toBeDisabled();
    await expect(edit).toBeDisabled();
    // The right-hand search can select a pupil with no device scans.
    await search.fill('ErsatzOhneScan');
    await expect(page.getByRole('option')).toHaveCount(1);
    await search.press('Enter');
    await expect(search).toHaveValue('ErsatzOhneScan Zuordnung');
    await expect(card.locator('.live-student-count strong')).toHaveText('0');
    await expect(edit).toBeEnabled();
    await edit.click();
    const editor = page.getByRole('dialog', { name: 'Schüler bearbeiten' });
    await expect(editor.getByLabel('Vorname', { exact: true })).toHaveValue('ErsatzOhneScan');
    await editor.getByRole('button', { name: 'Abbrechen', exact: true }).click();
    // A selected pupil outside the scan feed still receives live profile updates.
    expect((await page.request.post('/api/runden', { data: { id: 9802, scanId: 'manual_replacement_9802', confirmDoubleScan: true } })).ok()).toBe(true);
    await expect(card.locator('.live-student-count strong')).toHaveText('1');
    await button.click();
    const replacement = dialog.getByLabel('Ersatz-ID (optional)');
    await expect(dialog).toContainText('ErsatzOhneScan Zuordnung');
    await expect(replacement).toBeFocused();
    await replacement.fill('E9801');
    await add.click();
    await expect(dialog.getByRole('alert')).toContainText('Diese Ersatz-ID ist bereits vergeben');
    await replacement.fill('E9802');
    await replacement.press('Enter');
    await expect(dialog).not.toBeVisible();
    await expect(card.getByRole('status')).toContainText('E9802');
    await expect(card.getByRole('status')).toContainText('ErsatzOhneScan Zuordnung');
    for (const [id, expected] of [[9801, [9801]], [9802, [9802]]]) {
        const result = await (await page.request.get(`/api/addReplacements?studentId=${id}`)).json();
        expect(result.data.replacements).toEqual(expected);
    }
    await button.click();
    await expect(replacement).toHaveValue('');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(button).toBeFocused();
    // Clicking on the left replaces the searched pupil and updates both actions.
    await scan.click();
    await expect(search).toHaveValue('ErsatzScan Zuordnung');
    await expect(scan).toHaveAttribute('aria-pressed', 'true');
    await edit.click();
    await expect(editor.getByLabel('Vorname', { exact: true })).toHaveValue('ErsatzScan');
    await editor.getByRole('button', { name: 'Abbrechen', exact: true }).click();
    await button.click();
    await expect(dialog).toContainText('ErsatzScan Zuordnung');
    await dialog.getByRole('button', { name: 'Abbrechen', exact: true }).click();
    await page.getByRole('button', { name: 'Schüler abwählen' }).click();
    await expect(search).toHaveValue('');
    await expect(scan).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toBeDisabled();
    await expect(edit).toBeDisabled();
});


test('Schülersuche in der Seitenleiste unterstützt einstellige IDs, Enter-Auswahl und Navigation wie bei Spenden', async ({ page }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    for (const [id, vorname] of [[1, 'ZifferEins'], [9811, 'ZifferAndere'], [9812, 'ZifferWeiter']]) {
        expect((await page.request.post(`/api/students/${id}`, { data: { vorname, nachname: 'SuchTest', klasse: '5a', geschlecht: 'divers' } })).ok()).toBe(true);
    }
    const result = await (await page.request.get('/api/student-search?q=1')).json();
    expect(result.students[0].id).toBe(1);
    expect((await page.request.get('/api/student-search?q=%20')).status()).toBe(400);
    const reversed = await (await page.request.get('/api/student-search?q=SuchTest%20ZifferEins')).json();
    expect(reversed.students[0].id).toBe(1);
    await page.goto('/live');
    const card = page.getByRole('region', { name: 'Ausgewählter Schüler' });
    const search = page.getByRole('combobox', { name: 'Schüler suchen' });
    const options = page.getByRole('option');
    const add = card.getByRole('button', { name: 'Ersatz-ID hinzufügen', exact: true });
    const edit = card.getByRole('button', { name: 'Schüler bearbeiten', exact: true });
    await search.fill('1');
    await expect(options.first()).toContainText('ZifferEins SuchTest');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await search.press('Enter');
    await expect(search).toHaveValue('ZifferEins SuchTest');
    await expect(card).toContainText('ID 1');
    await expect(edit).toBeEnabled();
    await expect(add).toBeEnabled();
    await expect(options).toHaveCount(0);
    // Typing to change the pupil invalidates the selection until a result is chosen.
    await search.fill('Ziffer');
    await expect(add).toBeDisabled();
    await expect(edit).toBeDisabled();
    await expect(options).toHaveCount(3);
    await search.press('ArrowUp');
    await expect(options.last()).toHaveAttribute('aria-selected', 'true');
    await search.press('ArrowDown');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await search.press('Escape');
    await expect(options).toHaveCount(0);
    await search.fill('UnbekannterSchueler');
    await expect(page.getByRole('listbox')).toContainText('Keine Schüler gefunden.');
    await expect(add).toBeDisabled();
    for (const theme of ['light', 'dark']) {
        await page.evaluate(value => { localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }, theme);
        await page.setViewportSize({ width: 390, height: 844 });
        await search.fill('Ziffer');
        await expect(options).toHaveCount(3);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const list = await page.getByRole('listbox').boundingBox();
        expect(list.x).toBeGreaterThanOrEqual(0);
        expect(list.x + list.width).toBeLessThanOrEqual(390);
    }
    await options.last().click();
    await expect(search).toHaveValue('ZifferWeiter SuchTest');
    await expect(card).toContainText('ID 9812');
    await expect(add).toBeEnabled();
    await expect(edit).toBeEnabled();
});
