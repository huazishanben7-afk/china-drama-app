
import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

const CHANNELS = ['BS11', 'BS12', 'チャンネル銀河', 'LaLa TV', 'アジアドラマチックTV', 'ホームドラマチャンネル'];

async function run() {
    for (const ch of CHANNELS) {
        const q = encodeURIComponent(`${ch} 中国ドラマ`);
        const url = `https://bangumi.org/fetch_search_content/?q=${q}&type=tv`;
        console.log(`Searching: ${ch} -> ${url}`);

        try {
            const res = await axios.get(url, { headers: HEADERS });
            const $ = cheerio.load(res.data);
            const count = $('li.block').length;

            // Check first item title and channel
            const firstTitle = $('li.block').first().find('.repletion').first().text().trim();
            const firstMeta = $('li.block').first().find('.repletion').eq(1).text().trim();

            console.log(`Results: ${count}, First: ${firstTitle}, Meta: ${firstMeta}`);
        } catch (e: any) {
            console.error(`Error: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}

run();
