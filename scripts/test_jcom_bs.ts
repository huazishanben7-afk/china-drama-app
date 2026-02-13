
import axios from 'axios';

const API_URL = 'https://tvguide.myjcom.jp/api/getProgramInfo/';
const CHANNELS = ['BS11', 'BS12', 'チャンネル銀河'];

async function run() {
    console.log('Testing J:COM API for BS Channels...');

    // Search keyword "中国"
    const params = {
        keyword: '中国',
        genreId: '31',
        areaId: 12,
        limit: 100, // Increased
        offset: 0
    };

    try {
        const res = await axios.get(API_URL, {
            params,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www2.myjcom.jp/'
            }
        });

        const programs = res.data.programs;
        console.log(`Total hits: ${res.data.totalCount}`);

        const foundChannels = new Set();
        programs.forEach((p: any) => {
            foundChannels.add(p.channelName);
            if (CHANNELS.some(c => p.channelName.includes(c))) {
                console.log(`[MATCH] ${p.channelName}: ${p.title} (${p.startTime})`);
            }
        });

        console.log('--- Found Channels in this batch ---');
        console.log(Array.from(foundChannels).join(', '));

    } catch (e: any) {
        console.error(e.message);
    }
}

run();
