
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import qs from 'querystring';
import * as cheerio from 'cheerio';
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
// ============================================================
// Blog index built from category page (faster, more reliable)
// ============================================================
const BLOG_CATEGORY_URL = 'https://poupe.hatenadiary.jp/archive/category/%E8%8F%AF%E6%B5%81%E3%83%89%E3%83%A9%E3%83%9E%E3%81%BE%E3%81%A8%E3%82%81';

interface BlogEntry {
    title: string;
    url: string;
}

let blogIndex: BlogEntry[] | null = null;

async function loadBlogIndex(): Promise<BlogEntry[]> {
    if (blogIndex !== null) return blogIndex;

    console.log('[Blog] Building index from category page...');
    const entries: BlogEntry[] = [];
    let url: string | null = BLOG_CATEGORY_URL;
    let page = 1;

    while (url) {
        try {
            await new Promise(r => setTimeout(r, 800));
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 10000
            });
            const $ = cheerio.load(response.data);
            $('a.entry-title-link').each((i, el) => {
                const title = $(el).text().trim();
                const href = $(el).attr('href');
                if (title && href) entries.push({ title, url: href });
            });

            url = null;
            $('a[rel=next]').each((i, el) => { url = $(el).attr('href') || null; });
            page++;
        } catch (e: any) {
            console.warn(`[Blog] Index fetch failed at page ${page}: ${e.message}`);
            break;
        }
    }

    console.log(`[Blog] Index built: ${entries.length} summary articles found.`);
    blogIndex = entries;
    return entries;
}

// Extract a clean search keyword from the raw schedule title (for local matching)
function extractSearchKeyword(rawTitle: string): string {
    let t = rawTitle;

    // Remove leading flags like [新], [初], [中], [無], [再], [終]
    t = t.replace(/^\[(?:新|初|中|無|再|終)\]\s*/, '');
    
    // Remove leading 【字】, 【字幕】 etc.
    t = t.replace(/^【.*?】\s*/, '');

    // Remove leading genre/flag prefixes
    t = t.replace(/^中国時代劇[\s　]+/, '');
    t = t.replace(/^時代劇[\s　]+/, '');
    t = t.replace(/^(?:日本初◆|TV初◆|初◆|TV再◆|再◆)?中国ドラマ「(.*?)」.*$/, '$1');
    t = t.replace(/^(?:日本初◆|TV初◆|初◆|TV再◆|再◆)?中国ドラマ[\s　]+/, '');
    t = t.replace(/^中国[◆◇●○＊★☆■□]/, '');
    t = t.replace(/^[華古装近代][◆◇●○＊★☆■□]/, '');
    t = t.replace(/^【中国時代劇】[\s　]*/, '');
    
    // Remove leading episode number like #33, ＃33, (終)
    t = t.replace(/^(?:＃|#)[0-9０-９]+[\s　]+/, '');
    t = t.replace(/^\(終\)[\s　]+/, '');

    // Remove trailing cast hints after ▼
    t = t.replace(/[\s　]*▼.*$/, '');

    // Remove trailing (全○話) total episode count
    t = t.replace(/[\s　]*[\(（]全[0-9０-９]+話[\)）].*$/, '');

    // Remove trailing episode range like 〜3, 〜12
    t = t.replace(/[〜～][０-９0-9]+$/, '');
    t = t.replace(/〜[一二三四五六七八九十百]+$/, '');

    // Remove trailing 「subtitles」
    t = t.replace(/[\s　]*[「『].*?[」』]$/, '');

    // Remove ruby text （せいめいじょうかず） etc.
    t = t.replace(/（[ぁ-んァ-ン]+）/g, '');
    t = t.replace(/\([ぁ-んァ-ン]+\)/g, '');

    // Remove <字> ＜字幕＞ [字] etc.
    t = t.replace(/[\s　]*[\[\[[][^\]\]]*[\]\]]]/g, '');
    t = t.replace(/[\s　]*[<＜][^>＞]*[>＞]/g, '');
    
    // Remove 【日本初放送】 【アンコール】 etc.
    t = t.replace(/[\s　]*【[^】]+】/g, '');
    
    // Remove ◆キャスト名
    t = t.replace(/[\s　]*◆.*$/, '');
    
    // Remove (字幕版), (吹替版) etc.
    t = t.replace(/[\s　]*\([^)]*(?:字幕|吹替|版|話)[^)]*\)/g, '');
    t = t.replace(/[\s　]*（[^）]*(?:字幕|吹替|版|話)[^）]*）/g, '');

    // Remove after colon or wave dash or normal/full-width dashes (subtitles)
    t = t.split(/[：:〜～\-−—–－]/)[0];

    // Remove episode markers
    t = t.replace(/[\s　]*(?:第|＃|#)?[0-9０-９]+話.*/g, '');

    // Normalize full-width to half-width
    t = t.replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    t = t.replace(/　/g, ' ').replace(/ +/g, ' ').trim();

    // Second pass after normalization
    t = t.replace(/\s*\[[^\]]*\]/g, '');
    t = t.replace(/\s*#[0-9]+\s*$/g, '');
    t = t.replace(/\s*一挙放送\s*$/g, '');
    t = t.trim();

    return t;
}

// Normalize a blog article title for matching
function normalizeBlogTitle(title: string): string {
    return title
        .replace(/[『』「」【】\[\]【】]/g, '')  // strip brackets
        .replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))  // full-width to half-width
        .replace(/〜/g, '~')   // wave dash 〜 -> ~
        .replace(/[<＜][^>\uff1e]*[>＞]/g, '') // remove <reading> annotations
        .replace(/\s+/g, '')
        .toLowerCase();
}

async function searchBlogForDrama(rawTitle: string): Promise<string | null> {
    const searchKeyword = extractSearchKeyword(rawTitle);
    if (!searchKeyword || searchKeyword.length < 2) return null;

    const index = await loadBlogIndex();
    const normalizedKeyword = searchKeyword
        .replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))  // full-width to half-width
        .replace(/〜/g, '~')   // wave dash 〜 -> ~
        .replace(/[<\uff1c][^>\uff1e]*[>\uff1e]/g, '') // remove <reading> annotations
        .replace(/\s+/g, '').toLowerCase();

    // Find all entries whose title matches
    const matches = index.filter(entry => {
        const normalizedTitle = normalizeBlogTitle(entry.title);
        // Check if blog title contains the drama keyword, or vice versa (for short drama names)
        const titleCore = normalizedTitle.replace(/全話あらすじネタバレ感想/g, '').replace(/全話/g, '');
        return normalizedTitle.includes(normalizedKeyword) || 
               (normalizedKeyword.length >= 2 && normalizedKeyword.includes(titleCore) && titleCore.length >= 2);
    });

    if (matches.length > 0) {
        // Score matches to find the best one
        // Rank 1: Blog title contains the full keyword (strong match)
        // Rank 2: Keyword contains the blog title (weak match, usually means blog title is just the short main title)
        matches.sort((a, b) => {
            const aTitle = normalizeBlogTitle(a.title);
            const bTitle = normalizeBlogTitle(b.title);
            const aStrong = aTitle.includes(normalizedKeyword);
            const bStrong = bTitle.includes(normalizedKeyword);
            
            if (aStrong && !bStrong) return -1;
            if (!aStrong && bStrong) return 1;
            
            // If same rank, sort by length (shortest wins to avoid sequels/compilations when searching for season 1)
            return aTitle.length - bTitle.length;
        });
        
        const bestMatch = matches[0];
        console.log(`[Blog Match] ${rawTitle} -> ${bestMatch.url} (out of ${matches.length} matches)`);
        return bestMatch.url;
    }

    return null;
}



export function isChineseDrama(title: string): boolean {
    const t = title;

    // Positive Indicators (Prioritize 'China' effectively)
    // ユーザー要望: 「さすがに『中国』って入ってたら優先して」
    if (t.includes('中国')) return true;

    // Standard Positive Indicators
    if (t.includes('華◆') || t.includes('華流') || t.includes('[中]') || t.includes('【中】')) return true;
    if (t.includes('蔵海') || t.includes('ザンハイ')) return true; // Explicitly allow Zang Hai

    // Negative Indicators - Specific Korean/Taiwanese markers
    if (t.includes('韓◆') || t.includes('韓流') || t.includes('韓国') || t.includes('[韓]') || t.includes('(韓)') || t.includes('〈韓〉')) return false;
    if (t.includes('台◆') || t.includes('台湾') || t.includes('タイ')) return false;

    // Specific Korean/Non-Chinese titles reported by user or common in results
    const blockList = [
        '福寿草', 'ペントハウス', '復讐の花束をあなたに', '紳士とお嬢さん', '三姉弟', '優雅な家',
        'シカゴ', 'FBI', 'CSI', 'NCIS', 'DOC', 'S.W.A.T',
        'ヴィエナ・ブラッド', 'vienna blood', 'マルプラクティス', 'ヴェラ'
    ];
    if (blockList.some(k => t.includes(k))) return false;

    // Korean Name Patterns in titles (e.g., "チャン・ヒョク")
    if (/(?:チャン|イ|キム|ハン|パク|ユ|シン|カン|チョン|ソン|ジュ|ミン|ソ|オ|ク|コ|チ|ハ)・/.test(t)) return false;

    // Kana Filter (Too much Katakana usually means Western or Korean names)
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
    
    // Remove trailing flags like 「最終回」 only if preceded by a space
    title = title.replace(/[\s　]+[「『][^」』]+[」』]$/, '');
    
    // Remove ruby text like （せいめいじょうかず） anywhere
    title = title.replace(/（[ぁ-んァ-ン]+）/g, ''); 
    title = title.replace(/\([ぁ-んァ-ン]+\)/g, '');

    // Unwrap if the ENTIRE remaining string is wrapped in quotes
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

// CSV based findBlogEntry removed.

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

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function fetchWithRetry(url: string, data: any, retries = MAX_RETRIES): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.post(url, qs.stringify(data), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Mozilla/5.0'
                },
                timeout: 15000 // 15s timeout
            });
        } catch (error: any) {
            const isLastAttempt = i === retries - 1;
            console.warn(`Attempt ${i + 1}/${retries} failed for ${url}: ${error.message}`);

            if (isLastAttempt) throw error;

            // Wait with exponential backoff
            const delay = RETRY_DELAY_MS * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export async function fetchJcomData(): Promise<DramaSchedule[]> {
    console.log('Starting J:COM crawl (Multi-Keyword Search Mode with Blog Scraping)...');
    const schedules: DramaSchedule[] = [];

    const visitedIds = new Set<string>();

    for (const keyword of SEARCH_KEYWORDS) {
        console.log(`Searching for keyword: ${keyword}`);
        let offset = 0;
        let hasMore = true;
        let pageCount = 0;

        while (hasMore && pageCount < 50) { // Safety break
            try {
                const params = { keyword, offset };
                const res = await fetchWithRetry(SEARCH_API_URL, params);

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


                    // GENRE FILTER
                    if (p.si_genre !== '31') {
                        if (TARGET_CHANNELS.some(t => toHalfWidth(p.channel_name).includes(t))) {
                            console.log(`[GENRE SKIP] ${p.title} (${p.si_genre}) channel: ${p.channel_name}`);
                        }
                        continue;
                    }

                    // Filter Logic
                    if (!isChineseDrama(p.title)) {
                        continue;
                    }


                    visitedIds.add(uniqueKey);

                    const displayChannel = normalizeChannelName(p.channel_name);
                    const normalizedTitle = normalizeTitle(p.title);

                    if (p.title.includes('蔵海')) {
                        console.log(`[FOUND ZANGHAI] ${p.title} -> ${normalizedTitle}`);
                    }

                    // Check duplicate objects logic (same title/channel)
                    let drama = schedules.find(d => d.title === normalizedTitle && d.channel === displayChannel);

                    if (!drama) {
                        const blogUrl = await searchBlogForDrama(p.title);
                        const targetUrl = blogUrl
                            ? blogUrl
                            : `https://tvguide.myjcom.jp/detail/?eid=${p.cid}`;

                        drama = {
                            title: normalizedTitle,
                            url: targetUrl,
                            channel: displayChannel,
                            scheduleText: '',
                            nextBroadcasts: [],
                            blogUrl: blogUrl || undefined
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
