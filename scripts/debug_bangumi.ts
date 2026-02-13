
import { fetchBangumiData } from './crawl_bangumi';

async function run() {
    try {
        const data = await fetchBangumiData();
        console.log(`Total items fetched: ${data.length}`);

        let maxDate = '';
        let minDate = '9999-99-99';

        data.forEach(d => {
            d.nextBroadcasts.forEach(b => {
                if (b.date > maxDate) maxDate = b.date;
                if (b.date < minDate) minDate = b.date;
            });
        });

        console.log(`Date Range: ${minDate} to ${maxDate}`);

        // Count items per channel
        const channelCounts: { [key: string]: number } = {};
        data.forEach(d => {
            channelCounts[d.channel] = (channelCounts[d.channel] || 0) + 1;
        });
        console.log('Items per channel:', channelCounts);

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
