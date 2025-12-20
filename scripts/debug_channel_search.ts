
import axios from 'axios';
import * as cheerio from 'cheerio';

const SEARCH_API_URL = 'https://bangumi.org/fetch_search_content/';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

async function searchChannel(channelName: string) {
    const url = `${SEARCH_API_URL}?q=${encodeURIComponent(channelName)}&type=tv`;
    console.log(`Searching for "${channelName}"...`);
    try {
        const response = await axios.get(url, { headers: HEADERS });
        const html = response.data;
        const $ = cheerio.load(html);
        const count = $('li.block').length;
        console.log(`Results: ${count}`);
    } catch (e) {
        console.error(`Error: ${e}`);
    }
}

async function main() {
    await searchChannel('ホームドラマチャンネル');
    await searchChannel('アジアドラマチックTV');
    await searchChannel('J:COM');
    await searchChannel('JCOM');
    await searchChannel('BS243');
}

main();
