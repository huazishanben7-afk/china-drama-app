
import axios from 'axios';
import * as cheerio from 'cheerio';

const SEARCH_KEYWORD = encodeURIComponent('中国ドラマ');
const SEARCH_API_URL = `https://bangumi.org/fetch_search_content/?q=${SEARCH_KEYWORD}&type=tv`;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

async function inspectSearch() {
    console.log(`Fetching: ${SEARCH_API_URL}`);
    try {
        const response = await axios.get(SEARCH_API_URL, { headers: HEADERS });
        const html = response.data;
        const $ = cheerio.load(html);

        const items: any[] = [];
        $('li.block').each((_, el) => {
            const $item = $(el);
            const repletions = $item.find('.box-2 .repletion');
            if (repletions.length >= 2) {
                const title = $(repletions[0]).text().trim();
                const dateAndChannel = $(repletions[1]).text().trim();
                const typeSi = $item.attr('type_si');

                items.push({ title, dateAndChannel, typeSi });
            }
        });

        console.log(`\nTotal Items Found via Search: ${items.length}`);

        // Filter for BS/CS (type_si includes "1" or "2")
        const bsCsItems = items.filter(item => {
            if (!item.typeSi) return false;
            try {
                const types = JSON.parse(item.typeSi);
                return types.includes("1") || types.includes("2");
            } catch { return false; }
        });

        console.log(`BS/CS Items: ${bsCsItems.length}`);
        bsCsItems.forEach(item => {
            console.log(`- [${item.title}] ${item.dateAndChannel}`);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

inspectSearch();
