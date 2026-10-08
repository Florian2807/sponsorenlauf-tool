import { test, expect } from '@playwright/test';

test('iPad always offers laptop selection at /display, supports direct links and switches using the keyboard', async ({ page, browser }) => {
    await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
    for (const [id, nachname] of [[9301, 'Links'], [9302, 'Rechts']]) {
        expect((await page.request.post(`/api/students/${id}`, { data: { vorname: 'Display', nachname, klasse: '5a', geschlecht: 'divers' } })).status()).toBe(201);
    }
    const scannerContext = await browser.newContext();
    const secondContext = await browser.newContext();
    try {
        const scanner = await scannerContext.newPage();
        const second = await secondContext.newPage();
        const nameLaptop = async (laptop, name) => {
            await laptop.goto('/scan');
            await laptop.getByRole('button', { name: /Scanner-Name ändern:/ }).click();
            const nameInput = laptop.getByLabel('Scanner-Name', { exact: true });
            await expect(nameInput).toBeEnabled();
            await nameInput.fill(name);
            await nameInput.press('Enter');
            await expect(laptop.getByRole('dialog', { name: 'Scanner umbenennen' })).not.toBeVisible();
            await expect(laptop.locator('header')).toContainText(name);
            await laptop.reload();
            await expect(laptop.locator('header')).toContainText(name);
            const nameButton = laptop.getByRole('button', { name: `Scanner-Name ändern: ${name}`, exact: true });
            await nameButton.click();
            await expect(nameInput).toHaveValue(name);
            await laptop.keyboard.press('Escape');
            await expect(nameButton).toBeFocused();
            await nameButton.press('Enter');
            await expect(nameInput).toBeFocused();
            await laptop.keyboard.press('Escape');
            await laptop.getByRole('button', { name: 'Einstellungen öffnen', exact: true }).click();
            await laptop.getByRole('button', { name: 'Rundenanzeige verbinden', exact: true }).click();
            const connection = laptop.getByRole('dialog', { name: 'Rundenanzeige verbinden', exact: true });
            await expect(connection).toContainText(name);
            await connection.getByText('Direkten Link teilen', { exact: true }).click();
            const deviceId = await laptop.evaluate(() => localStorage.getItem('sponsorenlauf.deviceId'));
            await expect(connection.getByLabel('Link für das iPad')).toHaveValue(new RegExp(`device=${deviceId}$`));
            await laptop.keyboard.press('Escape');
            await expect(laptop.getByRole('button', { name: 'Einstellungen öffnen', exact: true })).toBeFocused();
            const displayLink = laptop.getByRole('link', { name: `Rundenanzeige für ${name} öffnen`, exact: true });
            await expect(displayLink).toHaveAttribute('href', `/display?device=${deviceId}`);
            const popupPromise = laptop.waitForEvent('popup');
            await displayLink.click();
            const popup = await popupPromise;
            await expect(popup).toHaveURL(new RegExp(`/display\\?device=${deviceId}$`));
            await expect(popup.locator('.student-display-connection')).toContainText(name);
            await expect(laptop).toHaveURL(/\/scan$/);
            await popup.close();
            for (const path of ['/show', '/statistics']) {
                await laptop.goto(path);
                await expect(nameButton).toBeVisible();
                await expect(displayLink).toHaveAttribute('href', `/display?device=${deviceId}`);
                await nameButton.click();
                await expect(nameInput).toHaveValue(name);
                await laptop.keyboard.press('Escape');
            }
            await laptop.goto('/scan');
        };
        await nameLaptop(scanner, 'Eingang links');
        await nameLaptop(second, 'Eingang rechts');
        await scanner.setViewportSize({ width: 390, height: 844 });
        expect(await scanner.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(scanner.locator('header')).toContainText('Eingang links');
        expect(await (await page.request.get('/api/moduleConfig')).json()).not.toHaveProperty('scannerStations');
        await page.goto('/display');
        await expect(page.getByRole('heading', { name: 'Scanner auswählen' })).toBeVisible();
        await page.getByRole('button', { name: /Eingang links.*Aktiv/ }).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('.student-display-connection')).toContainText('Eingang links');
        await expect(page.getByRole('heading', { name: 'Bereit für deinen Scan' })).toBeVisible();
        await scanner.getByPlaceholder('Barcode scannen').fill('9301');
        await scanner.getByPlaceholder('Barcode scannen').press('Enter');
        await expect(page.getByRole('heading', { name: 'Display Links' })).toBeVisible();

        const directLink = page.url();
        // A stale selection from an earlier version must not bypass the picker.
        await page.evaluate(id => localStorage.setItem('sponsorenlauf.displayDevice', JSON.stringify({ id, name: 'Eingang links' })),
            new URL(directLink).searchParams.get('device'));
        await page.goto('/display');
        await expect(page.getByRole('heading', { name: 'Scanner auswählen' })).toBeVisible();
        await expect(page.locator('.student-display-connection')).toHaveCount(0);
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Scanner auswählen' })).toBeVisible();
        await page.goto(directLink);
        await expect(page.locator('.student-display-connection')).toContainText('Eingang links');
        await expect(page.getByRole('heading', { name: 'Display Links' })).toBeVisible();
        await page.getByRole('button', { name: 'Anzeigeoptionen' }).click();
        await page.getByRole('button', { name: 'Scanner wechseln' }).click();
        await expect(page.getByRole('heading', { name: 'Scanner auswählen' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('button', { name: 'Anzeigeoptionen' })).toBeFocused();
        await page.getByRole('button', { name: 'Anzeigeoptionen' }).press('Enter');
        await page.getByRole('button', { name: 'Scanner wechseln' }).click();
        await page.getByRole('button', { name: /Eingang rechts.*Aktiv/ }).click();
        await expect(page.locator('.student-display-connection')).toContainText('Eingang rechts');
        await expect(page.getByRole('heading', { name: 'Display Links' })).toHaveCount(0);
        await nameLaptop(second, 'Ziel rechts');
        await expect(page.locator('.student-display-connection')).toContainText('Ziel rechts');
        await second.getByPlaceholder('Barcode scannen').fill('9302');
        await second.getByPlaceholder('Barcode scannen').press('Enter');
        await expect(page.getByRole('heading', { name: 'Display Rechts' })).toBeVisible();
        const selectedId = new URL(page.url()).searchParams.get('device');
        expect((await page.request.put('/api/scan-devices', { data: { deviceId: selectedId, name: ' ' } })).status()).toBe(400);
        expect((await page.request.put('/api/scan-devices', { data: { deviceId: selectedId, name: 'Fremd' }, headers: { Origin: 'https://untrusted.example' } })).status()).toBe(403);
        await page.request.post('/api/admin-auth', { data: { action: 'login', pin: '246810' } });
        await page.request.delete('/api/students/9301');
        await page.request.delete('/api/students/9302');
    } finally { await scannerContext.close(); await secondContext.close(); }
});
