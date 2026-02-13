
import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    try {
        console.log('Navigating to home...');
        await page.goto('https://www.dimora.jp/', { waitUntil: 'networkidle2' });

        console.log('Clicking Genre Search...');
        const genreBtn = await page.waitForSelector('a[title="ジャンル別番組検索"]');
        if (genreBtn) await genreBtn.click();

        // Wait for the menu/scripts to load
        await new Promise(r => setTimeout(r, 5000));

        const funcData = await page.evaluate(() => {
            // @ts-ignore
            if (typeof searchKWP2321a === 'function') {
                // @ts-ignore
                return { name: 'searchKWP2321a', body: searchKWP2321a.toString() };
            }
            return { name: 'NotFound', body: 'searchKWP2321a not found' };
        });

        console.log(`--- ${funcData.name} Source ---`);
        console.log(funcData.body);
        console.log('----------------------------');

    } catch (e) { console.error(e); }

    await browser.close();
})();
