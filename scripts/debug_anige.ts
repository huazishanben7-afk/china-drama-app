
import axios from 'axios';
import qs from 'querystring';

const SEARCH_API_URL = 'https://tvguide.myjcom.jp/api/mypage/get_searchresult/';

async function run() {
    console.log('--- Analyzing "Anige Eleven" ---');

    try {
        const params = {
            keyword: 'アニゲー', // Search specifically for it
            offset: 0
        };

        const res = await axios.post(SEARCH_API_URL, qs.stringify(params), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest', 'User-Agent': 'Mozilla/5.0' }
        });

        const body = res.data.body;
        if (!body || !body.value) {
            console.log('No results found for debug.');
            return;
        }

        const item = body.value[0]; // Assuming first hit
        console.log(`Title: ${item.title}`);
        console.log(`Channel: ${item.channel_name}`);
        console.log(`Genre Code: ${item.si_genre}`);

        // Simulate isChineseDrama Logic
        console.log('\n--- Filter Logic Check ---');
        const t = item.title;

        // Kana Check
        const kanaOnly = t.replace(/[^\u3040-\u309F\u30A0-\u30FFー\s]/g, '');
        const ratio = kanaOnly.length / t.length;
        console.log(`Total Length: ${t.length}`);
        console.log(`Kana Only: ${kanaOnly} (len: ${kanaOnly.length})`);
        console.log(`Kana Ratio: ${ratio.toFixed(2)} (Threshold > 0.8 rejects)`);

        if (t.length > 5 && ratio > 0.8) {
            console.log('-> Would be Rejected by Kana Filter');
        } else {
            console.log('-> Passed Kana Filter');
        }

        const isDomestic = item.si_genre === '30';
        console.log(`Genre '30' check: ${isDomestic ? 'Rejected' : 'Passed'}`);

    } catch (e: any) {
        console.error(e);
    }
}

run();
