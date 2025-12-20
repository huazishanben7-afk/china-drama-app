
import * as fs from 'fs';
import * as path from 'path';
import { fetchBangumiData, DramaSchedule } from './crawl_bangumi';
import { fetchBS11Data } from './crawl_bs11';
import { fetchJcomData } from './crawl_jcom';

const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.json');

async function main() {
    try {
        console.log('--- Starting Crawler ---');

        // 1. Fetch from Bangumi
        const bangumiData = await fetchBangumiData();

        // 2. Fetch from BS11
        const bs11Data = await fetchBS11Data();

        // 3. Fetch from J:COM
        const jcomData = await fetchJcomData();

        console.log(`Bangumi items: ${bangumiData.length}`);
        console.log(`BS11 items: ${bs11Data.length}`);
        console.log(`J:COM items: ${jcomData.length}`);

        // 4. Merge Data
        const mergedMap = new Map<string, DramaSchedule>();

        // Helper to merge events
        const mergeEvents = (target: DramaSchedule, source: DramaSchedule) => {
            for (const event of source.nextBroadcasts) {
                const isDup = target.nextBroadcasts.some(e =>
                    e.date === event.date && e.startTime === event.startTime
                );
                if (!isDup) {
                    target.nextBroadcasts.push(event);
                }
            }
            // Sort after merging
            target.nextBroadcasts.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.startTime.localeCompare(b.startTime);
            });
        };

        // Priority 1: Bangumi (Richest Data for most channels)
        for (const d of bangumiData) {
            mergedMap.set(d.title, d);
        }

        // Priority 2: BS11 (Specific logic for BS11)
        for (const d of bs11Data) {
            if (mergedMap.has(d.title)) {
                const existing = mergedMap.get(d.title)!;
                // If existing is from Bangumi but channel is unknown/generic, favor BS11?
                // Or just merge events.
                mergeEvents(existing, d);

                // Update channel name if it looks better
                if (d.channel === 'BS11' && existing.channel !== 'BS11') {
                    // Maybe keep existing channel name if it's correct, but BS11 script is authority on BS11.
                    // But Bangumi usually has "BS11イレブン" etc.
                }
            } else {
                mergedMap.set(d.title, d);
            }
        }

        // Priority 3: J:COM (Covers missing channels)
        for (const d of jcomData) {
            if (mergedMap.has(d.title)) {
                const existing = mergedMap.get(d.title)!;
                mergeEvents(existing, d);

                // If J:COM has a better channel name (e.g. Bangumi said "Unknown"), use J:COM?
                if (existing.channel === 'Unknown Channel' || existing.channel === '') {
                    existing.channel = d.channel;
                }
            } else {
                mergedMap.set(d.title, d);
            }
        }

        // Re-generate scheduleText for all merged items
        const allSchedules = Array.from(mergedMap.values());
        for (const s of allSchedules) {
            const times = s.nextBroadcasts.map(b => {
                const shortDate = b.date.substring(5); // MM-DD
                return `${shortDate} ${b.startTime}`;
            }).join(', ');
            s.scheduleText = `${s.channel} ${times}`;
        }

        // Channel Name Normalization
        for (const s of allSchedules) {
            if (s.channel === 'BS12トゥエルビ') {
                s.channel = 'BS12';
            } else if (s.channel.includes('ホームドラマチャンネル')) {
                // Determine if it's the long name or just strict content match
                // User said: "ホームドラマチャンネルHD　韓流・時代劇・国内ドラマ" -> "ホームドラマチャンネル"
                if (s.channel.startsWith('ホームドラマチャンネル')) {
                    s.channel = 'ホームドラマチャンネル';
                }
            }
            // Re-generate scheduleText with new channel name
            const times = s.nextBroadcasts.map(b => {
                const shortDate = b.date.substring(5); // MM-DD
                return `${shortDate} ${b.startTime}`;
            }).join(', ');
            s.scheduleText = `${s.channel} ${times}`;
        }

        // Sort allSchedules by earliest broadcast date
        allSchedules.sort((a, b) => {
            const timeA = a.nextBroadcasts.length > 0
                ? `${a.nextBroadcasts[0].date} ${a.nextBroadcasts[0].startTime}`
                : '9999-99-99 99:99';
            const timeB = b.nextBroadcasts.length > 0
                ? `${b.nextBroadcasts[0].date} ${b.nextBroadcasts[0].startTime}`
                : '9999-99-99 99:99';
            return timeA.localeCompare(timeB);
        });

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allSchedules, null, 2));
        console.log(`Saved ${allSchedules.length} items to ${OUTPUT_FILE}`);

        // Generate CSV
        const CSV_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.csv');
        const csvHeader = 'Title,Channel,Schedule,URL\n';
        const csvRows = allSchedules.map(s => {
            // Escape quotes and commas
            const title = `"${s.title.replace(/"/g, '""')}"`;
            const channel = `"${s.channel.replace(/"/g, '""')}"`;
            const schedule = `"${s.scheduleText.replace(/"/g, '""')}"`;
            const url = `"${s.url.replace(/"/g, '""')}"`;
            return `${title},${channel},${schedule},${url}`;
        }).join('\n');

        fs.writeFileSync(CSV_FILE, '\uFEFF' + csvHeader + csvRows); // Add BOM for Excel compatibility
        console.log(`Saved CSV to ${CSV_FILE}`);

        console.log('--- Crawl Finished ---');

    } catch (error) {
        console.error('Crawl failed:', error);
        process.exit(1);
    }
}

main();
