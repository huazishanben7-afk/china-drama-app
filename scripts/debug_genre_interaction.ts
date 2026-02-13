
import puppeteer from 'puppeteer';
import fs from 'fs';

async function debugGenreInteraction() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log('Navigating to DiMora...');
        await page.goto('https://www.dimora.jp/', { waitUntil: 'networkidle2' });

        // Click Genre Search button
        const genreBtnSelector = 'a[title="ジャンル別番組検索"]';
        await page.waitForSelector(genreBtnSelector);
        await page.click(genreBtnSelector);
        console.log('Clicked Genre Search button.');

        // Wait for potential menu expansion or navigation
        // Even if it stays on same page, wait a bit for JS to populate
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Dump all labels to see if we can find "海外ドラマ"
        const labels = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('label')).map(l => ({
                text: l.innerText.trim(),
                html: l.outerHTML,
                forAttr: l.getAttribute('for')
            }));
        });

        // Dump full HTML to inspect manually
        const content = await page.content();
        fs.writeFileSync('debug_menu.html', content);
        console.log('Saved HTML to debug_menu.html');

        // Filter for relevant one
        const overseas = labels.filter(l => l.text.includes('海外ドラマ'));
        console.log('Found "海外ドラマ" labels:', overseas);

        // Also check for inputs directly if possible
        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"]')).map(i => ({
                id: i.id,
                value: (i as HTMLInputElement).value,
                name: (i as HTMLInputElement).name
            }));
        });
        // Log inputs that might correspond to genre 
        // (Usually genre IDs on DiMora might look like 'genre_123' or have specific values)
        console.log('Found inputs (sample):', inputs.slice(0, 10));

        // Let's try to click one if we found it
        if (overseas.length > 0 && overseas[0].forAttr) {
            console.log(`Attempting to click label for=${overseas[0].forAttr}`);
            await page.click(`label[for="${overseas[0].forAttr}"]`);
        } else if (overseas.length > 0) {
            console.log('Attempting XPath click via evaluate...');
            await page.evaluate(() => {
                const xPathResult = document.evaluate("//label[contains(text(), '海外ドラマ')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const node = xPathResult.singleNodeValue;
                if (node) (node as HTMLElement).click();
            });
        }

        // Wait a moment and check active filters state if possible

    } catch (e) {
        console.error('Debug Error:', e);
    } finally {
        await browser.close();
    }
}

debugGenreInteraction();
