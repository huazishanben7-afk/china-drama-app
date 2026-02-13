
import puppeteer from 'puppeteer';
import fs from 'fs';

async function debugGenre() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to DiMora Home...');
    await page.goto('https://www.dimora.jp/', { waitUntil: 'networkidle2' });

    console.log('Clicking .btn_search_genre...');
    try {
        await page.waitForSelector('.btn_search_genre', { timeout: 5000 });
        await page.click('.btn_search_genre');

        console.log('Waiting 3s for menu...');
        await new Promise(r => setTimeout(r, 3000));

        console.log(' taking screenshot debug_menu_open.png');
        await page.screenshot({ path: 'debug_menu_open.png' });

        const content = await page.content();
        fs.writeFileSync('debug_home_after_click.html', content);

        const labels = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('label, div, td, a'))
                .map(el => el.textContent)
                .filter(t => t && t.includes('海外ドラマ'));
        });
        console.log('Found "海外ドラマ" elements:', labels);

    } catch (e) {
        console.error(e);
    }

    await browser.close();
}

debugGenre();
