
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const SEARCH_URL = 'https://www.tvkingdom.jp/schedulesBySearch.action?stationPlatformId=2&condition.keyword=%E4%B8%AD%E5%9B%BD%E3%83%89%E3%83%A9%E3%83%9E';

async function fetchRSS() {
    try {
        // 1. Fetch Search Page
        console.log('Fetching Search Page...');
        const searchRes = await axios.get(SEARCH_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        const $ = cheerio.load(searchRes.data);
        const rssRelPath = $('a.rssArrw').attr('href');

        if (!rssRelPath) {
            console.error('RSS Link not found');
            return;
        }

        const rssUrl = `https://www.tvkingdom.jp${rssRelPath}`;
        console.log('Found RSS URL:', rssUrl);

        // 2. Fetch RSS XML
        const rssRes = await axios.get(rssUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        fs.writeFileSync('g_guide.xml', rssRes.data);
        console.log('Saved G-Guide RSS to g_guide.xml');

    } catch (error) {
        console.error('Error:', error);
    }
}

fetchRSS();
