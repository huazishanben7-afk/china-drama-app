
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import qs from 'querystring';
// We keep re-using types from crawl_bangumi locally to avoid import errors if file missing
// But for now let's define them here to be self-contained or trust existing structure.
import { DramaSchedule } from './crawl_bangumi';

const SEARCH_API_URL = 'https://tvguide.myjcom.jp/api/mypage/get_searchresult/';

// Keywords: Expanded to cover missing channels
const SEARCH_KEYWORDS = [
    '中国ドラマ',
    'BS11 ドラマ',
    '華流',
    '中国時代劇',
    '中国',
    'BS12',
    'WOWOW',
    'チャンネル銀河',
    '衛星劇場' // Catch-all, filtered strictly by Genre 31
];

const TARGET_CHANNELS = [
    'WOWOW',
    '衛星劇場',
    'チャンネル銀河',
    'LaLa',
    'アジアドラマ',
    'アジドラ',
    'ホームドラマ',
    'BS11',
    'BS12',
    'J:COM',
    '日テレプラス'
];

interface JcomSearchItem {
    title: string;
    cid: string;
    channel_name: string;
    start_date: {
        date: string;
        timezone: string;
    };
    si_genre: string;
}

interface BlogData {
    title: string;
    blogUrl: string;
}

const CSV_FILE = path.join(process.cwd(), 'public', 'data', 'drama_database_v2.csv');

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

function isChineseDrama(title: string): boolean {
    const t = title;

    // Positive Indicators
    if (t.includes('華◆') || t.includes('華流') || t.includes('中国') || t.includes('[中]') || t.includes('【中】')) return true;
    if (t.includes('蔵海') || t.includes('ザンハイ')) return true; // Explicitly allow Zang Hai

    // Negative Indicators
    if (t.includes('韓◆') || t.includes('韓流') || t.includes('韓国') || t.includes('[韓]') || t.includes('(韓)')) return false;
    if (t.includes('台湾') || t.includes('タイ')) return false;

    // Korean Name Patterns
    if (/(?:チャン|イ|キム|ハン|パク|ユ|シン|カン|チョン|ソン|ジュ|ミン|ソ|オ|ク|コ|チ|ハ)・/.test(t)) return false;

    // Blocklist
    const blockList = [
        'シカゴ', 'FBI', 'CSI', 'NCIS', 'DOC', 'ドクター', 'グッド', 'クリミナル',
        'マダム', 'ミステリー', '事件簿', '警部', '捜査', 'ファイル', 'ブラウン神父',
        'ヴェラ', 'ブリティッシュ', 'ベイクオフ', 'オール・ライズ', 'クローザー',
        'ライン・オブ', 'キルミー', '彼女は', '星から', 'ミセン', 'ペク・ドンス',
        '馬医', '福寿草', '運命の', '三番目', '三姉弟', '優雅な', '白雪姫',
        '被告人', 'ペントハウス', '応答せよ', 'ブランディング', 'ロマンスは',
        'チェックイン', 'ウイスキー', 'タワー', 'アルゼンチーナ', 'MURDER',
        'シーズン', 'Season', 'ＳＩＳＩ',
        'バラエティ', '音楽', 'ライブ',
        'モンテ', '快楽', 'ストリッパー', 'ダイアリー', '人妻'
    ];

    if (blockList.some(k => t.includes(k))) return false;

    // Kana Filter
    const kanaOnly = t.replace(/[^\u3040-\u309F\u30A0-\u30FFー\s]/g, '');
    if (t.length > 5 && kanaOnly.length > t.length * 0.8) return false;

    return true;
}

function normalizeTitle(fullTitle: string): string {
    let title = fullTitle.replace(/^(?:中国|韓流|華流|海外)[◇・]?(?:ドラマ)?\s*/, '');
    title = title.replace(/^【.*?】/, '').replace(/^\[.*?\]/, '').replace(/【.*?】/g, '').replace(/\[.*?\]/g, '');

    // Remove pronunciation guides <...> often found in J:COM (e.g. 蔵海<ザンハイ>伝)
    title = title.replace(/<.*?>/g, '');

    title = title.replace(/(?:第|＃|#)?[0-9０-９]+話/g, '');
    title = title.replace(/[\s　]+(第|＃|#)?[0-9０-９]+(?:話|)/g, '');
    title = title.replace(/(第|＃|#)[0-9０-９]+(?:話|)/g, '');
    title = title.replace(/[\s　]*（.*?）$/, '').replace(/[\s　]*＜.*?＞$/, '').replace(/[\s　]*\(.*?\)$/, '');
    title = title.replace(/^[「『](.*?)[」』]$/, '$1');
    title = title.replace(/^PR\s+/, '');
    return title.trim();
}

// Full-width to Half-width conversion for ASCII chars
function toHalfWidth(str: string): string {
    return str.replace(/[！-～]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

function normalizeChannelName(raw: string): string {
    const c = toHalfWidth(raw);
    if (c.includes('WOWOW')) {
        if (c.includes('プライム')) return 'WOWOWプライム';
        if (c.includes('ライブ')) return 'WOWOWライブ';
        if (c.includes('シネマ')) return 'WOWOWシネマ';
        if (c.includes('4K')) return 'WOWOW 4K';
        if (c.includes('プラス')) return 'WOWOWプラス';
        return 'WOWOW';
    }
    if (c.includes('BS11')) return 'BS11';
    if (c.includes('BS12') || c.includes('トゥエルビ')) return 'BS12';
    if (c.includes('衛星劇場')) return '衛星劇場';
    if (c.includes('LaLa')) return 'LaLa TV';
    if (c.includes('アジアドラマ') || c.includes('アジドラ')) return 'アジアドラマチックTV';
    if (c.includes('ホームドラマ')) return 'ホームドラマチャンネル';
    if (c.includes('チャンネル銀河')) return 'チャンネル銀河';
    if (c.includes('日テレプラス')) return '日テレプラス';
    if (c.includes('J:COM')) return 'J:COM';
    return c;
}

function findBlogEntry(title: string, blogData: BlogData[]): BlogData | undefined {
    // Normalization for matching: remove spaces, lowercase
    const t1 = title.replace(/[\s　・～〜<\(（\[【]/g, '').toLowerCase();
    // Simplified matching: check if core title part matches
    if (!t1 || t1.length < 2) return undefined;

    return blogData.find(b => {
        const t2 = b.title.replace(/[\s　・～〜<\(（\[【]/g, '').toLowerCase();
        if (!t2) return false;
        // Check partial match
        return t1.includes(t2) || t2.includes(t1);
    });
}

function formatDateStr(dateStr: string): { date: string, startTime: string } {
    // input: "2026-01-03 13:45:00.000000"
    const d = new Date(dateStr.split('.')[0].replace(/-/g, '/')); // simple parse
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return {
        date: `${y}-${m}-${day}`,
        startTime: `${h}:${min}`
    };
}

export async function fetchJcomData(): Promise<DramaSchedule[]> {
    console.log('Starting J:COM crawl (Multi-Keyword Search Mode)...');
    const schedules: DramaSchedule[] = [];
    const blogDataList = loadBlogData();
    console.log(`Loaded ${blogDataList.length} blog entries for matching.`);

    const visitedIds = new Set<string>();

    for (const keyword of SEARCH_KEYWORDS) {
        console.log(`Searching for keyword: ${keyword}`);
        let offset = 0;
        let hasMore = true;
        let pageCount = 0;

        while (hasMore && pageCount < 50) { // Safety break
            try {
                const params = { keyword, offset };
                const res = await axios.post(SEARCH_API_URL, qs.stringify(params), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest',
                        'User-Agent': 'Mozilla/5.0'
                    }
                });

                const body = res.data.body;
                if (!body || !body.value || body.value.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const p of body.value as JcomSearchItem[]) {
                    // Check if channel is target (Normalize to half-width first)
                    const normalizedChannel = toHalfWidth(p.channel_name);
                    const isTarget = TARGET_CHANNELS.some(t => normalizedChannel.includes(t));
                    if (!isTarget) continue;

                    // Deduplication by ID (cid+startTime)
                    const uniqueKey = `${p.cid}_${p.start_date.date}`;
                    if (visitedIds.has(uniqueKey)) continue;

                    // GENRE FILTER (Strict Whitelist):
                    // ONLY allow '31' (Overseas Drama).
                    // This is robust against Anime (70), Domestic (30), Info (FF), etc.


                    if (p.si_genre !== '31') continue;

                    // Filter Logic
                    if (!isChineseDrama(p.title)) {
                        continue;
                    }


                    visitedIds.add(uniqueKey);

                    const displayChannel = normalizeChannelName(p.channel_name);
                    const normalizedTitle = normalizeTitle(p.title);

                    if (p.title.includes('蔵海')) {
                        console.log(`[FOUND ZANGHAI] ${p.title} -> ${normalizedTitle} (MATCH BLOG? ${!!findBlogEntry(normalizedTitle, blogDataList)})`);
                    }

                    // Check duplicate objects logic (same title/channel)
                    let drama = schedules.find(d => d.title === normalizedTitle && d.channel === displayChannel);

                    if (!drama) {
                        const blogEntry = findBlogEntry(normalizedTitle, blogDataList);
                        const targetUrl = blogEntry
                            ? blogEntry.blogUrl
                            : `https://tvguide.myjcom.jp/detail/?eid=${p.cid}`;

                        drama = {
                            title: normalizedTitle,
                            url: targetUrl,
                            channel: displayChannel,
                            scheduleText: '',
                            nextBroadcasts: [],
                            blogUrl: blogEntry?.blogUrl
                        };
                        schedules.push(drama);
                    }

                    // Parse Time
                    const timeInfo = formatDateStr(p.start_date.date);
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

                offset += body.value.length;
                pageCount++;
                await new Promise(r => setTimeout(r, 200));

            } catch (error: any) {
                console.error(`Error fetching keyword ${keyword}:`, error.message);
                hasMore = false;
            }
        }
    }

    // Sort and Format
    for (const s of schedules) {
        s.nextBroadcasts.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });

        const times = s.nextBroadcasts.map(b => {
            const shortDate = b.date.substring(5); // MM-DD
            return `${shortDate} ${b.startTime}`;
        }).join(', ');
        s.scheduleText = `${s.channel} ${times}`;
    }

    console.log(`J:COM crawl complete. Found ${schedules.length} unique items.`);
    return schedules;
}
