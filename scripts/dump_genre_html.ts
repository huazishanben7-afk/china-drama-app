
import puppeteer from 'puppeteer';
import fs from 'fs';

async function dumpGenrePage() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    await page.goto('https://www.dimora.jp/', { waitUntil: 'networkidle2' });

    // Click Genre Search
    const genreBtn = await page.waitForSelector('a[title="ジャンル別番組検索"]');
    if (genreBtn) await genreBtn.click();

    try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }); } catch (e) { }

    // Dump HTML
    const html = await page.content();
    fs.writeFileSync('genre_search_page.html', html);
    console.log('Dumped genre_search_page.html');

    await browser.close();
}

dumpGenrePage();
