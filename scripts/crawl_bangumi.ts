
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// --- Type Definitions ---
export interface DramaSchedule {
    title: string;
    url: string;
    channel: string;
    scheduleText: string; // Computed summary text
    nextBroadcasts: BroadcastEvent[];
    blogUrl?: string;
}

export interface BroadcastEvent {
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
}

interface BlogData {
    title: string;
    blogUrl: string;
}

// --- Constants ---
const SEARCH_KEYWORD = encodeURIComponent('中国ドラマ');
const SEARCH_API_URL = `https://bangumi.org/fetch_search_content/?q=${SEARCH_KEYWORD}&type=tv`;
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.json');
const CSV_FILE = path.join(process.cwd(), 'public', 'data', 'drama_database_v2.csv');

// Bangumi defines type_si as: ["1"] = BS, ["2"] = CS, ["3"] = Terrestrial
// We want BS (1) and CS (2).
const TARGET_SI_TYPES = ["1", "2"];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

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
    // Case A: (Optional Prefix) + Number + '話' (Explicit episode) -> No space required
    title = title.replace(/(?:第|＃|#)?[0-9０-９]+話.*/, '');
    // Case B: Space + Number + (Optional '話') -> Potential episode number
    title = title.replace(/[\s　]+(第|＃|#)?[0-9０-９]+(?:話|).*/, '');
    // Case C: Explicit prefix (第, ＃, #) -> No space required
    title = title.replace(/(第|＃|#)[0-9０-９]+(?:話|).*/, '');

    // 3. Remove parenthesis info often at end
    title = title.replace(/[\s　]*（.*?）$/, '');
    title = title.replace(/[\s　]*＜.*?＞$/, '');

    // 4. Strip surrounding brackets if any
    title = title.replace(/^[「『](.*?)[」』]$/, '$1');

    return title.trim();
}

function findBlogEntry(title: string, blogData: BlogData[]): BlogData | undefined {
    const t1 = title.replace(/\s+/g, '').toLowerCase();
    return blogData.find(b => {
        const t2 = b.title.replace(/\s+/g, '').toLowerCase();
        // Check mutual inclusion
        return t1.includes(t2) || t2.includes(t1);
    });
}

function parseDateStr(dateStr: string): { date: string, startTime: string } | null {
    // Expected format: "12月20日 土曜 16:00　衛星劇場"
    // We only need the date and time part.
    // Regex: (\d+)月(\d+)日\s+.\曜\s+(\d+):(\d+)
    const match = dateStr.match(/(\d+)月(\d+)日\s+.\曜\s+(\d+):(\d+)/);
    if (!match) return null;

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const hour = match[3];
    const minute = match[4];

    // Determine year. If scraping in Dec and date is Jan, it's next year.
    // Current assumption: The script runs near real-time.
    const now = new Date();
    let year = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Boundary case: Running in Dec, program is Jan -> Year + 1
    if (currentMonth === 12 && month === 1) {
        year += 1;
    }
    // Boundary case: Running in Jan, program is Dec (unlikely but possible for logs) -> Year - 1
    if (currentMonth === 1 && month === 12) {
        year -= 1;
    }

    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    const hh = hour.padStart(2, '0');
    const min = minute.padStart(2, '0');

    return {
        date: `${year}-${mm}-${dd}`,
        startTime: `${hh}:${min}`
    };
}

// --- Main Scraper ---

export async function fetchBangumiData(): Promise<DramaSchedule[]> {
    console.log('Starting Bangumi Scraper...');
    console.log(`Target URL: ${SEARCH_API_URL}`);

    try {
        const blogDataList = loadBlogData();
        console.log(`Loaded ${blogDataList.length} blog entries.`);

        const response = await axios.get(SEARCH_API_URL, { headers: HEADERS });
        const html = response.data;
        const $ = cheerio.load(html);

        const scheduleMap = new Map<string, DramaSchedule>();

        $('li.block').each((_, el) => {
            const $item = $(el);

            // Check Channel Type ("1"=BS, "2"=CS)
            const typeSiRaw = $item.attr('type_si');
            if (!typeSiRaw) return;

            // type_si is a JSON string like '["1"]' or '["2"]'
            let types: string[] = [];
            try {
                types = JSON.parse(typeSiRaw);
            } catch (e) { return; }

            const isTarget = types.some(t => TARGET_SI_TYPES.includes(t));
            if (!isTarget) return;

            // Extract Info
            // .box-2 > p.repletion (1st is Title, 2nd is Date/Channel)
            const repletions = $item.find('.box-2 .repletion');
            if (repletions.length < 2) return;

            const fullTitle = $(repletions[0]).text().trim();
            const dateAndChannel = $(repletions[1]).text().trim();

            // dateAndChannel: "12月20日 土曜 16:00　衛星劇場"
            // Split channel name (everything after the time)
            const timeMatch = dateAndChannel.match(/\d{1,2}:\d{2}/);
            let channel = "Unknown Channel";
            if (timeMatch) {
                const timeIndex = dateAndChannel.indexOf(timeMatch[0]);
                if (timeIndex !== -1) {
                    channel = dateAndChannel.substring(timeIndex + timeMatch[0].length).trim();
                }
            }

            // Url
            const relLink = $item.find('a').attr('href');
            const bangumiUrl = relLink ? `https://bangumi.org${relLink}` : '';

            // Normalize Title
            const title = normalizeTitle(fullTitle);

            // Parse Date
            const dateInfo = parseDateStr(dateAndChannel);
            if (!dateInfo) return; // Skip if date parse fails

            // --- Aggregation ---
            if (!scheduleMap.has(title)) {
                // Check for Blog URL Match
                const blogEntry = findBlogEntry(title, blogDataList);
                const finalUrl = blogEntry ? blogEntry.blogUrl : bangumiUrl;
                if (blogEntry) console.log(`[Link Match] ${title} -> ${blogEntry.title}`);

                scheduleMap.set(title, {
                    title,
                    url: finalUrl,
                    channel, // Use first found channel
                    scheduleText: channel, // Initial placeholder
                    nextBroadcasts: [],
                    blogUrl: blogEntry?.blogUrl
                });
            }

            const entry = scheduleMap.get(title)!;

            // Add broadcast event if unique
            const isDuplicate = entry.nextBroadcasts.some(b =>
                b.date === dateInfo.date && b.startTime === dateInfo.startTime
            );

            if (!isDuplicate) {
                entry.nextBroadcasts.push({
                    date: dateInfo.date,
                    startTime: dateInfo.startTime
                });
            }

            // Keep channel name updated (or comma separated if multiple channels?)
            // For simplicity, keep first one, or maybe append if different?
            // User requirement is simple listing.
        });

        // Finalize Data
        const results = Array.from(scheduleMap.values()).map(s => {
            // Sort broadcasts
            s.nextBroadcasts.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.startTime.localeCompare(b.startTime);
            });

            // Format scheduleText: "BS11 12-20 16:00, 12-21 16:00"
            const times = s.nextBroadcasts.map(b => {
                // Convert 2025-12-20 to 12-20
                const shortDate = b.date.substring(5);
                return `${shortDate} ${b.startTime}`;
            }).join(', ');
            s.scheduleText = `${s.channel} ${times}`;

            return s;
        });

        console.log(`Bangumi found ${results.length} dramas.`);
        return results;

    } catch (error) {
        console.error('Error scraping Bangumi:', error);
        return [];
    }
}
