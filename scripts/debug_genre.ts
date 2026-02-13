
import puppeteer from 'puppeteer';

async function scrapeByGenre() {
    console.log(`[Genre] Launching Browser...`);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    console.log(`[Genre] Navigating to Home...`);
    await page.goto('https://www.dimora.jp/', { waitUntil: 'networkidle2' });

    try {
        console.log('[Genre] Waiting for Genre Search button...');
        // 1. Click Genre Search
        const genreBtn = await page.waitForSelector('a[title="ジャンル別番組検索"]', { timeout: 10000 });
        if (genreBtn) {
            console.log('[Genre] Clicking Genre Search...');
            await genreBtn.click();
            // Wait for internal navigation or tab switch (usually just visibility)
            try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }); } catch (e) { }
        }

        console.log('[Genre] Selecting Overseas Drama & BS...');
        // 2. Click Overseas Drama (Label or Input)
        await page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('label, div, td'));
            const target = labels.find(l => (l as HTMLElement).innerText.includes('海外ドラマ'));
            if (target) {
                console.log('Found Overseas Drama label');
                (target as HTMLElement).click();
            }

            const bs = document.getElementById('broada4');
            if (bs) {
                console.log('Found BS button');
                bs.click();
            }

            const ter = document.getElementById('broada2');
            if (ter && ter.classList.contains('on')) ter.click();
        });

        // 3. Click Search
        console.log('[Genre] Waiting for Search button...');
        const searchBtn = await page.waitForSelector('a[title="ジャンル検索"]', { timeout: 10000 });
        if (searchBtn) {
            console.log('[Genre] Clicking Search...');
            await searchBtn.click();

            console.log('[Genre] Waiting for results (.pgmInnArea)...');
            try {
                await page.waitForSelector('.pgmInnArea', { timeout: 15000 });
                console.log('[Genre] Results appeared!');

                const count = await page.evaluate(() => document.querySelectorAll('.pgmInnArea').length);
                console.log(`[Genre] Result Page Loaded. Found ${count} items.`);

                // Test Scrape
                const rawItems = await page.evaluate(() => {
                    const nodes = document.querySelectorAll('.pgmInnArea');
                    return Array.from(nodes).map((node, i) => {
                        const titleEl = node.querySelector('.pgmLinkTtl');
                        const channelEl = node.querySelector('.pgmBcsTxt');
                        return {
                            title: titleEl ? titleEl.textContent?.trim() : '',
                            channel: channelEl ? channelEl.textContent?.trim() : ''
                        };
                    }).slice(0, 10);
                });
                console.log('[Genre] Sample Items:', JSON.stringify(rawItems, null, 2));

            } catch (e) {
                console.error('[Genre] Results timeout!');
                await page.screenshot({ path: 'genre_debug_timeout.png' });
            }

        } else {
            console.error('[Genre] Search button not found');
        }

    } catch (e) {
        console.error('[Genre] Debug Error:', e);
        await page.screenshot({ path: 'genre_debug_error.png' });
    } finally {
        await browser.close();
    }
}

scrapeByGenre();
