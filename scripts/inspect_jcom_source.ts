
import axios from 'axios';
import * as fs from 'fs';

const URL = 'https://www2.myjcom.jp/special/tv/hualiu/';

async function downloadHtml() {
    try {
        const response = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        fs.writeFileSync('jcom_dump.html', response.data);
        console.log('Downloaded jcom_dump.html');

        // Simple check
        if (response.data.includes('ホームドラマチャンネル')) {
            console.log('Found "ホームドラマチャンネル" in raw HTML!');
        } else {
            console.log('Did NOT find "ホームドラマチャンネル" in raw HTML.');
        }
    } catch (e) {
        console.error(e);
    }
}

downloadHtml();
