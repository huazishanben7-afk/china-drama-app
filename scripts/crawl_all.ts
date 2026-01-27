
import * as fs from 'fs';
import * as path from 'path';
import { fetchJcomData } from './crawl_jcom';

const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.json');

async function main() {
    try {
        console.log('--- Starting Crawler (J:COM Unified Edition) ---');

        // 1. Fetch from J:COM (Source of Truth)
        const jcomData = await fetchJcomData();

        console.log(`J:COM Total Items: ${jcomData.length}`);

        if (jcomData.length === 0) {
            console.error('ERROR: J:COM crawler returned 0 items. Check API or Network.');
        }

        // 2. Sort all schedules by earliest broadcast date
        jcomData.sort((a, b) => {
            const timeA = a.nextBroadcasts.length > 0
                ? `${a.nextBroadcasts[0].date} ${a.nextBroadcasts[0].startTime}`
                : '9999-99-99 99:99';
            const timeB = b.nextBroadcasts.length > 0
                ? `${b.nextBroadcasts[0].date} ${b.nextBroadcasts[0].startTime}`
                : '9999-99-99 99:99';
            return timeA.localeCompare(timeB);
        });

        // 3. Save JSON
        const jsonDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jcomData, null, 2));
        console.log(`Saved ${jcomData.length} items to ${OUTPUT_FILE}`);

        // 4. Generate CSV
        const CSV_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.csv');
        const csvHeader = 'Title,Channel,Schedule,URL\n';
        const csvRows = jcomData.map(s => {
            // Escape quotes and commas
            const title = `"${s.title.replace(/"/g, '""')}"`;
            const channel = `"${s.channel.replace(/"/g, '""')}"`;
            const schedule = `"${s.scheduleText.replace(/"/g, '""')}"`;
            // Ensure URL is not undefined
            const url = `"${(s.url || '').replace(/"/g, '""')}"`;
            return `${title},${channel},${schedule},${url}`;
        }).join('\n');

        fs.writeFileSync(CSV_FILE, '\uFEFF' + csvHeader + csvRows);
        console.log(`Saved CSV to ${CSV_FILE}`);

        console.log('--- Crawl Finished ---');

    } catch (e) {
        console.error('Crawler failed:', e);
        process.exit(1);
    }
}

main();
