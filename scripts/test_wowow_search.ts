
import puppeteer from 'puppeteer';

async function testWowowSearch() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const SEARCH_TERM = 'WOWOW'; // Searching for WOWOW keyword
    const q = encodeURIComponent(SEARCH_TERM);
    // Use the same search URL pattern
    const targetUrl = `https://www.dimora.jp/freeword-search/${q}?chType=110&searchType=3`;
    console.log(`Navigating to: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    console.log('Expanding list (max 5 clicks)...');
    let clickCount = 0;
    while (clickCount < 5) {
        try {
            const btn = await page.$('#linkMoreResult');
            if (btn) {
                const visible = await page.evaluate((el: any) => window.getComputedStyle(el).display !== 'none', btn);
                if (visible) {
                    await btn.click();
                    await new Promise(r => setTimeout(r, 1000));
                    clickCount++;
                } else break;
            } else break;
        } catch (e) { break; }
    }

    console.log('Scraping items...');
    const items = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.pgmInnArea');
        return Array.from(nodes).map(node => {
            const title = node.querySelector('.pgmLinkTtl')?.textContent?.trim() || '';
            const channel = node.querySelector('.pgmBcsTxt')?.textContent?.trim() || '';
            return { title, channel };
        });
    });

    console.log(`Found ${items.length} items.`);

    // Check for Chinese Dramas
    const knownChinese = ['唐朝', '国色', '中国', '華流', '長楽曲', '贅婿', '蓮花楼'];
    const matches = items.filter(i => knownChinese.some(k => i.title.includes(k)));

    console.log(`Found ${matches.length} potential Chinese Dramas in WOWOW search:`);
    matches.forEach(m => console.log(`- ${m.title} (${m.channel})`));

    await browser.close();
}

testWowowSearch();
