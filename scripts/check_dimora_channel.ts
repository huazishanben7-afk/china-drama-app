
import axios from 'axios';
import * as cheerio from 'cheerio';

const QUERY = encodeURIComponent('千輪桃花');
const URL = `https://www.dimora.jp/freeword-search/${QUERY}?chType=110&searchType=3`;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

async function checkDimora() {
    console.log(`Fetching: ${URL}`);
    try {
        const res = await axios.get(URL, { headers: HEADERS });
        const $ = cheerio.load(res.data);

        console.log("Results:");
        $('.m-search_result_list .m-main_title').each((_, el) => {
            console.log("Title: " + $(el).text().trim());
        });
        $('.m-search_result_list .m-channel').each((_, el) => {
            console.log("Channel: " + $(el).text().trim());
        });

    } catch (e) {
        console.error(e);
    }
}

checkDimora();
