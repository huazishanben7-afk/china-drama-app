
import axios from 'axios';
import qs from 'querystring';

const SEARCH_API_URL = 'https://tvguide.myjcom.jp/api/mypage/get_searchresult/';

// List of programs to verify their genre ID
const TARGETS = [
    { title: '蔵海', channel: 'WOWOW' },
    { title: '明蘭', channel: 'BS11' },
    { title: '星月楼', channel: 'Home Drama' },
    { title: '四方館', channel: 'Satellite' },
    { title: '情刺', channel: 'Nittele' },
    { title: '風とロック', channel: 'Home Drama (Non-Drama Test)' }
];

async function run() {
    console.log('--- Checking Genre IDs ---');

    for (const t of TARGETS) {
        try {
            const params = {
                keyword: t.title,
                offset: 0
            };

            const res = await axios.post(SEARCH_API_URL, qs.stringify(params), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest', 'User-Agent': 'Mozilla/5.0' }
            });

            const body = res.data.body;
            if (body && body.value && body.value.length > 0) {
                const item = body.value[0];
                console.log(`[${t.title}] Channel: ${item.channel_name} | Genre: ${item.si_genre} (${item.si_genre === '31' ? 'OK' : 'OTHER'}) | Title: ${item.title}`);
            } else {
                console.log(`[${t.title}] Not Found`);
            }

        } catch (e: any) {
            console.error(e.message);
        }
    }
}

run();
