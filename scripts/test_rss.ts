
import axios from 'axios';
import fs from 'fs';

const RSS_URL = 'https://www.tvkingdom.jp/rss/schedules/search.action?keyword=%E4%B8%AD%E5%9B%BD%E3%83%89%E3%83%A9%E3%83%9E';

async function testFetch() {
    try {
        const response = await axios.get(RSS_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            responseType: 'text' // Ensure we get text
        });
        console.log('Status:', response.status);
        fs.writeFileSync('rss_response.html', response.data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testFetch();
