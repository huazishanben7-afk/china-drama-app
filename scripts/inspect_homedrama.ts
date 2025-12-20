
import axios from 'axios';
import * as cheerio from 'cheerio';

const SEARCH_API_URL = 'https://bangumi.org/fetch_search_content/?q=%E3%83%9B%E3%83%BC%E3%83%A0%E3%83%89%E3%83%A9%E3%83%9E%E3%83%81%E3%83%A3%E3%83%B3%E3%83%8D%E3%83%AB&type=tv';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

async function inspectResult() {
    try {
        const response = await axios.get(SEARCH_API_URL, { headers: HEADERS });
        console.log(response.data);
    } catch (e) {
        console.error(e);
    }
}

inspectResult();
