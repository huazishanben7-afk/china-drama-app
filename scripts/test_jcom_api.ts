
import axios from 'axios';

const API_URL = 'https://tvguide.myjcom.jp/api/getProgramInfo/';

async function testApi() {
    try {
        const params = {
            keyword: '中国',
            limit: 100,
            genreId: '31',
            areaId: 12
        };
        console.log(`Fetching from ${API_URL}...`);
        const response = await axios.get(API_URL, {
            params,
            headers: {
                // Mimic a browser to be safe
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www2.myjcom.jp/'
            }
        });

        console.log('Status:', response.status);
        console.log('Data sample:', JSON.stringify(response.data).substring(0, 500));

        if (response.data && response.data.programs) {
            console.log('Programs found:', response.data.programs.length);
            const targets = ['ホームドラマチャンネル', 'アジアドラマチックTV', 'J:COM'];
            const counts: { [key: string]: number } = {};
            targets.forEach(t => counts[t] = 0);

            response.data.programs.forEach((p: any) => {
                targets.forEach(t => {
                    if (p.channelName && p.channelName.includes(t)) {
                        counts[t]++;
                    }
                });
            });
            console.log('Channel counts:', counts);
        } else {
            console.log('No "programs" field in response.');
        }

    } catch (e: any) {
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Response data:', e.response.data);
        }
    }
}

testApi();
