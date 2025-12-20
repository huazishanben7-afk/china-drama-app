
import axios from 'axios';
import * as cheerio from 'cheerio';

const SEARCH_API_URL = 'https://bangumi.org/fetch_search_content/?q=%E4%B8%AD%E5%9B%BD%E3%83%89%E3%83%A9%E3%83%9E&type=tv';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

async function checkMissingChannels() {
    console.log(`Fetching from ${SEARCH_API_URL}...`);
    try {
        const response = await axios.get(SEARCH_API_URL, { headers: HEADERS });
        const html = response.data;
        const $ = cheerio.load(html);

        const channelStats = new Map<string, Set<string>>();

        $('li.block').each((_, el) => {
            const $item = $(el);
            const typeSiRaw = $item.attr('type_si') || 'unknown';

            // Extract Channel Name
            const repletions = $item.find('.box-2 .repletion');
            if (repletions.length >= 2) {
                const dateAndChannel = $(repletions[1]).text().trim();
                const timeMatch = dateAndChannel.match(/\d{1,2}:\d{2}/);
                if (timeMatch) {
                    const timeIndex = dateAndChannel.indexOf(timeMatch[0]);
                    const channel = dateAndChannel.substring(timeIndex + timeMatch[0].length).trim();

                    if (!channelStats.has(channel)) {
                        channelStats.set(channel, new Set());
                    }
                    channelStats.get(channel)?.add(typeSiRaw);
                }
            }
        });

        console.log('\n--- Channels Found in "Chinese Drama" Search ---');
        const sortedChannels = Array.from(channelStats.keys()).sort();

        sortedChannels.forEach(ch => {
            const types = Array.from(channelStats.get(ch)!).join(', ');
            console.log(`Channel: ${ch.padEnd(20)} | Types: ${types}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

checkMissingChannels();
