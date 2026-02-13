
import axios from 'axios';
import * as cheerio from 'cheerio';

const URL = 'https://bangumi.org/epg/bs';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

async function run() {
    try {
        const res = await axios.get(URL, { headers: HEADERS });
        // Save to file for inspection
        const fs = require('fs');
        fs.writeFileSync('bangumi_dump.html', res.data);
        console.log('Saved to bangumi_dump.html');

    } catch (e: any) {
        console.error(e.message);
    }
}
run();
