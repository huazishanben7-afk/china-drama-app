
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { DramaSchedule, BroadcastEvent } from './crawl_bangumi'; // Reuse types

const API_URL = 'https://tvguide.myjcom.jp/api/getProgramInfo/';
const TARGET_CHANNELS = [
    'ホームドラマチャンネル',
    'アジアドラマチックTV',
    'J:COM', // Will catch J:COM BS, J:COM TV, etc.
    'LaLa TV',
    '衛星劇場'
];

interface JcomProgram {
    title: string;
    startTime: string; // YYYYMMDDHHmmss
    endTime: string;
    channelName: string;
    url: string;
    summary?: string;
}

interface JcomResponse {
    status: number | string;
    totalCount: number;
    programs: JcomProgram[];
}

interface BlogData {
    title: string;
    blogUrl: string;
}

const CSV_FILE = path.join(process.cwd(), 'public', 'data', 'drama_database_v2.csv');

// --- Helper Functions ---

function loadBlogData(): BlogData[] {
    try {
        if (!fs.existsSync(CSV_FILE)) return [];
        const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
        const lines = fileContent.split('\n');
        const data: BlogData[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(',');
            // Expecting col 1 to be title, col 2 to be URL
            if (cols.length >= 2 && cols[1] && cols[1].startsWith('http')) {
                data.push({
                    title: cols[0].trim(),
                    blogUrl: cols[1].trim()
                });
            }
        }
        return data;
    } catch (error) {
        console.warn('Failed to load CSV file:', error);
        return [];
    }
}

function normalizeTitle(fullTitle: string): string {
    // 1. Remove obvious prefixes/suffixes
    let title = fullTitle.replace(/^中国ドラマ\s*/, '');
    title = title.replace(/^【.*?】/, ''); // 【字】 etc
    title = title.replace(/^\[.*?\]/, ''); // [新] etc
    title = title.replace(/【.*?】/g, ''); // Inline tags

    // 2. Remove episode numbers
    // Case A: (Optional Prefix) + Number + '話' (Explicit episode)
    title = title.replace(/(?:第|＃|#)?[0-9０-９]+話/g, '');
    // Case B: Space + Number + (Optional '話')
    title = title.replace(/[\s　]+(第|＃|#)?[0-9０-９]+(?:話|)/g, '');
    // Case C: Explicit prefix (第, ＃, #)
    title = title.replace(/(第|＃|#)[0-9０-９]+(?:話|)/g, '');

    // 3. Remove parenthesis info often at end
    title = title.replace(/[\s　]*（.*?）$/, '');
    title = title.replace(/[\s　]*＜.*?＞$/, '');

    // 4. Strip surrounding brackets if any
    title = title.replace(/^[「『](.*?)[」』]$/, '$1');

    return title.trim();
}

function findBlogEntry(title: string, blogData: BlogData[]): BlogData | undefined {
    const t1 = title.replace(/\s+/g, '').toLowerCase();

    // Safety check: if title becomes empty or too short, don't match
    if (!t1 || t1.length < 2) return undefined;

    return blogData.find(b => {
        const t2 = b.title.replace(/\s+/g, '').toLowerCase();
        if (!t2) return false;
        // Check mutual inclusion
        return t1.includes(t2) || t2.includes(t1);
    });
}


// Helper to format date
function formatDateStr(date: Date): { date: string, startTime: string } {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return {
        date: `${y}-${m}-${d}`,
        startTime: `${h}:${min}`
    };
}

export async function fetchJcomData(): Promise<DramaSchedule[]> {
    console.log('Starting J:COM crawl...');
    const schedules: DramaSchedule[] = [];
    const blogDataList = loadBlogData();
    console.log(`Loaded ${blogDataList.length} blog entries for matching.`);

    const limit = 100;
    let offset = 0;
    let total = 0;

    const MAX_PAGES = 20;

    try {
        for (let page = 0; page < MAX_PAGES; page++) {
            const params = {
                keyword: '中国',
                genreId: '31',
                areaId: 12,
                limit: limit,
                offset: offset
            };

            const response = await axios.get(API_URL, {
                params,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://www2.myjcom.jp/'
                }
            });

            const data = response.data as JcomResponse;
            if (data.status != 0 || !data.programs || data.programs.length === 0) {
                break;
            }

            total = data.totalCount;

            for (const p of data.programs) {
                // Normalize Channel Names for Display & Filtering
                if (p.channelName.includes('LaLa')) p.channelName = 'LaLa TV';
                if (p.channelName.includes('衛星劇場')) p.channelName = '衛星劇場';

                const isTarget = TARGET_CHANNELS.some(t => p.channelName.includes(t));
                if (!isTarget) continue;

                // User-defined filters to exclude non-Chinese dramas
                // J:COM BS -> Starts with "中国"
                // Asian Dramatic TV -> Starts with "[中]"
                // Home Drama Channel, LaLa TV, Eiseigekijo -> Starts with "華" (often "華◆")
                // Adding "中国" check for safety
                if (p.channelName.includes('J:COM') && !p.title.startsWith('中国')) continue;
                if (p.channelName.includes('アジアドラマチックTV') && !p.title.startsWith('[中]')) continue;

                const requireHana = ['ホームドラマチャンネル', 'LaLa TV', '衛星劇場'];
                if (requireHana.some(c => p.channelName.includes(c))) {
                    if (!p.title.startsWith('華') && !p.title.includes('中国')) continue;
                }

                // Parse Start Time
                const y = parseInt(p.startTime.substring(0, 4));
                const m = parseInt(p.startTime.substring(4, 6)) - 1;
                const d = parseInt(p.startTime.substring(6, 8));
                const h = parseInt(p.startTime.substring(8, 10));
                const min = parseInt(p.startTime.substring(10, 12));
                const start = new Date(y, m, d, h, min);

                // Format to strings
                const timeInfo = formatDateStr(start);

                // Find or create drama
                // Verify unique by Title AND Channel to avoid mixing schedules if same drama is on multiple channels
                // (Bangumi crawler logic might differ, but this is safer for J:COM mixed list)
                let drama = schedules.find(d => d.title === p.title && d.channel === p.channelName);
                if (!drama) {
                    const normalized = normalizeTitle(p.title);
                    const blogEntry = findBlogEntry(normalized, blogDataList);
                    if (blogEntry) {
                        console.log(`[J:COM Link Match] ${p.title} -> ${blogEntry.title}`);
                    }

                    drama = {
                        title: p.title,
                        url: blogEntry ? blogEntry.blogUrl : (p.url ? (p.url.startsWith('http') ? p.url : `https://tvguide.myjcom.jp${p.url}`) : ''),
                        channel: p.channelName,
                        scheduleText: '', // Will update later
                        nextBroadcasts: [],
                        blogUrl: blogEntry?.blogUrl
                    };
                    schedules.push(drama);
                }


                // Add event if unique
                const exists = drama.nextBroadcasts.some(e =>
                    e.date === timeInfo.date &&
                    e.startTime === timeInfo.startTime
                );
                if (!exists) {
                    drama.nextBroadcasts.push({
                        date: timeInfo.date,
                        startTime: timeInfo.startTime
                    });
                }
            }

            offset += limit;
            if (offset >= total) break;

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Post-process to generate scheduleText and sort
        for (const s of schedules) {
            s.nextBroadcasts.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.startTime.localeCompare(b.startTime);
            });

            // Format scheduleText: "Channel 12-20 16:00, ..."
            const times = s.nextBroadcasts.map(b => {
                const shortDate = b.date.substring(5); // MM-DD
                return `${shortDate} ${b.startTime}`;
            }).join(', ');
            s.scheduleText = `${s.channel} ${times}`;
        }

        console.log(`J:COM crawl complete. Found ${schedules.length} dramas.`);
        return schedules;

    } catch (e: any) {
        console.error('J:COM crawl error:', e.message);
        return [];
    }
}
