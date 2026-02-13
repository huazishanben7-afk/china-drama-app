
import axios from 'axios';
import * as cheerio from 'cheerio';

const SEARCH_KEYWORD = encodeURIComponent('中国ドラマ');
const BASE_URL = `https://bangumi.org/fetch_search_content/?q=${SEARCH_KEYWORD}&type=tv`;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

async function getFirstTitle(url: string) {
    try {
        const response = await axios.get(url, { headers: HEADERS });
        const $ = cheerio.load(response.data);
        const firstItem = $('li.block .box-2 .repletion').first().text().trim();
        return firstItem || 'NO_ITEM_FOUND';
    } catch (e: any) {
        return `ERROR: ${e.message}`;
    }
}

async function run() {
    console.log('Testing Pagination...');

    const title1 = await getFirstTitle(BASE_URL);
    console.log(`Page 1 (Default): ${title1}`);

    const urlPage2 = `${BASE_URL}&page=2`;
    const titlePage2 = await getFirstTitle(urlPage2);
    console.log(`Page 2 (&page=2): ${titlePage2}`);

    const urlOffset20 = `${BASE_URL}&offset=20`;
    const titleOffset20 = await getFirstTitle(urlOffset20);
    console.log(`Offset 20 (&offset=20): ${titleOffset20}`);

    const urlP2 = `${BASE_URL}&p=2`;
    const titleP2 = await getFirstTitle(urlP2);
    console.log(`P 2 (&p=2): ${titleP2}`);
}

run();
