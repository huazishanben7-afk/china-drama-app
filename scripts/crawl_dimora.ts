
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export interface DramaSchedule {
    title: string;
    url: string;
    channel: string;
    scheduleText: string;
    nextBroadcasts: BroadcastEvent[];
    blogUrl?: string; // Optional blog URL
}

export interface BroadcastEvent {
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
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
            if (cols.length >= 2 && cols[1].startsWith('http')) {
                data.push({ title: cols[0].trim(), blogUrl: cols[1].trim() });
            }
        }
        return data;
    } catch { return []; }
}

function findBlogEntry(title: string, blogData: BlogData[]): BlogData | undefined {
    const t1 = title.replace(/[\s　]+/g, '').toLowerCase();
    if (!t1 || t1.length < 2) return undefined;

    return blogData.find(b => {
        const t2 = b.title.replace(/[\s　]+/g, '').toLowerCase();
        if (!t2) return false;
        return t1.includes(t2) || t2.includes(t1);
    });
}

function normalizeTitle(fullTitle: string): string {
    let title = fullTitle.replace(/^(?:中国|韓流|華流|海外)[◇・]?(?:ドラマ)?\s*/, '');
    title = title.replace(/^【.*?】/, '');
    title = title.replace(/^\[.*?\]/, '');
    title = title.replace(/【.*?】/g, '');
    title = title.replace(/(?:第|＃|#)?[0-9０-９]+話/g, '');
    title = title.replace(/[\s　]+(第|＃|#)?[0-9０-９]+(?:話|)/g, '');
    title = title.replace(/(第|＃|#)[0-9０-９]+(?:話|)/g, '');
    title = title.replace(/[\s　]*（.*?）$/, '');
    title = title.replace(/[\s　]*＜.*?＞$/, '');
    title = title.replace(/^[「『](.*?)[」』]$/, '$1');
    title = title.replace(/^PR\s+/, '');
    title = title.replace(/^1分で/, '');
    return title.trim();
}

function normalizeChannelName(ch: string): string {
    let name = ch.trim();
    if (name.includes('WOWOW')) return name;
    if (name.includes('BS12')) return 'BS12';
    // if (name.includes('松竹東急')) return 'BS松竹東急'; // User requested removal
    return name;
}

function isTargetChannel(channel: string): boolean {
    const c = channel.trim();

    // 1. Exclude BS11 (Has own crawler)
    if (c === 'BS11') return false;

    // 2. Exclude J:COM covered / CS channels
    if (c.includes('LaLa')) return false;
    if (c.includes('銀河')) return false;
    if (c.includes('アジアドラマ')) return false;
    if (c.includes('アジドラ')) return false;
    if (c.includes('ホームドラマ')) return false;
    if (c.includes('日テレプラス')) return false;
    if (c.includes('衛星劇場')) return false;

    // 3. Exclude BS10 / Star Channel (User Request)
    if (c.includes('BS10')) return false;
    if (c.includes('スターch')) return false;

    // 4. Exclude BS Shochiku Tokyu (User Request)
    if (c.includes('松竹東急')) return false;
    if (c.includes('J:COM BS')) return false; // Mentioned as equivalent

    return true;
}

export function isChineseDrama(title: string, channel: string): boolean {
    const t = title.toLowerCase();

    // Explicit Exclusion (Western/Misc)
    if (t.includes('クリミナル') || t.includes('マインド')) return false;
    if (t.includes('シカゴ') || t.includes('med') || t.includes('pd') || t.includes('fire')) return false;
    if (t.includes('csi') || t.includes('fbi') || t.includes('ncis') || t.includes('law') || t.includes('order')) return false;
    if (t.includes('オースティン') || t.includes('ドクター')) return false;
    if (t.includes('swat') || t.includes('s.w.a.t')) return false;
    if (t.includes('トランスポーター')) return false;
    if (t.includes('アストリッド')) return false;
    if (t.includes('ヴィエナ・ブラッド') || t.includes('vienna blood')) return false;

    // New exclusions for user reported "Keiji Morse" (Endeavour)
    if (t.includes('刑事')) return false; // Detective
    if (t.includes('事件')) return false; // Incident/Case (e.g. Oxford Casebook)
    if (t.includes('ミステリー')) return false; // Mystery
    if (t.includes('捜査')) return false; // Investigation

    // Korean indicators
    if (t.includes('韓国') || t.includes('韓ドラ') || t.includes('k-pop')) return false;
    if (t.includes('世子') || t.includes('セジャ')) return false;
    if (t.includes('王女') && t.includes('ピョンガン')) return false;
    if (t.includes('誓い') && t.includes('愛')) return false;
    if (t.includes('ペントハウス')) return false;
    if (t.includes('マイ・ラブリー・ジャーニー')) return false;
    if (t.includes('vip') && t.includes('迷路')) return false;

    // Korean Name Patterns (Katakana + Bullet)
    if (/(?:チャン|イ|キム|ハン|パク|ユ|シン|カン|チョン|ソン|ジュ)・/.test(title)) return false;

    // PR / Misc
    if (title.startsWith('PR') || title.includes('1分で')) return false;
    if (title.includes('ショップ') || title.includes('天気') || title.includes('ニュース')) return false;

    // Kanji Requirement
    const cleanTitle = title.replace(/[\[【][字二解新終再\s]*?[\]】]/g, '');
    if (!/[一-龯]/.test(cleanTitle)) return false;

    // Positive Checks
    if (channel.includes('WOWOW') || channel.includes('BS') || channel.includes('NHK')) {
        if (cleanTitle.includes('中国') || cleanTitle.includes('華流')) return true;
        if (cleanTitle.includes('韓国')) return false;

        if (channel.includes('NHK') && !cleanTitle.includes('中国')) return false;
        return true;
    }

    return true;
}

function resolveBSChannelFromLogo(logoPath: string): string | null {
    if (!logoPath) return null;
    const match = logoPath.match(/_([0-9A-F]{4})_/i);
    if (!match) return null;

    const hex = match[1].toUpperCase();
    const map: { [key: string]: string } = {
        '00BF': 'WOWOWプライム', // 191
        '00C0': 'WOWOWライブ',   // 192
        '00C1': 'WOWOWシネマ',   // 193
        '00FC': 'WOWOWプラス',   // 252
        '0065': 'NHK BS',
        '0066': 'NHK BS',
        '0067': 'NHK BSプレミアム',
        '00D3': 'BS11',
        '00DE': 'BS12',
        '0104': 'BS松竹東急',     // 260
        '0107': 'BSJapanext',    // 263
        '0109': 'BSよしもと',     // 265
        '008D': 'BS日テレ',
        '0097': 'BS朝日',
        '00A1': 'BS-TBS',
        '00AB': 'BSテレ東',
        '00B5': 'BSフジ',
    };

    if (['00C8', '00C9', '00CA', '0100'].includes(hex)) return 'BS10';

    return map[hex] || `BS (ID:${hex})`;
}

async function scrapeList(page: any, label: string): Promise<any[]> {
    console.log(`[${label}] Expanding list...`);
    let hasMore = true;
    let clickCount = 0;
    while (hasMore && clickCount < 15) {
        try {
            const button = await page.$('#linkMoreResult');
            if (button && await page.evaluate((el: any) => el.offsetParent !== null, button)) {
                process.stdout.write('.');
                await button.click();
                await new Promise(r => setTimeout(r, 1000));
                clickCount++;
            } else { hasMore = false; }
        } catch (e) { hasMore = false; }
    }
    console.log('');
    return page.evaluate(() => {
        return Array.from(document.querySelectorAll('.pgmInnArea')).map((node: any) => {
            const titleEl = node.querySelector('.pgmLinkTtl');
            const channelEl = node.querySelector('.pgmBcsTxt');
            const linkEl = node.querySelector('a.pgmLinkTtl');
            const link = linkEl ? linkEl.getAttribute('href') : '';

            let startTimeStr = null;
            if (link) {
                const match = link.match(/\/digital-program\/(\d{12,14})-/);
                if (match && match[1].length >= 12) {
                    startTimeStr = match[1].substring(0, 4) + '-' + match[1].substring(4, 6) + '-' + match[1].substring(6, 8) + 'T' + match[1].substring(8, 10) + ':' + match[1].substring(10, 12) + ':00';
                }
            }
            return {
                title: titleEl?.textContent?.trim(),
                channel: channelEl?.textContent?.trim(),
                link: link ? `https://www.dimora.jp${link}` : '',
                startTimeStr
            };
        });
    });
}

async function scrapeByKeyword(page: any): Promise<any[]> {
    const SEARCH_TERM = '中国ドラマ';
    const targetUrl = `https://www.dimora.jp/freeword-search/${encodeURIComponent(SEARCH_TERM)}?chType=110&searchType=3`;
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    return scrapeList(page, 'Keyword');
}

async function scrapeByGenreAPI(page: any): Promise<any[]> {
    console.log(`[GenreAPI] Navigating to Home to load scripts...`);
    await page.goto('https://www.dimora.jp/', { waitUntil: 'networkidle2' });

    const genreBtn = await page.waitForSelector('a[title="ジャンル別番組検索"]');
    if (genreBtn) await genreBtn.click();
    await new Promise(r => setTimeout(r, 4000));

    console.log('[GenreAPI] Executing direct API call...');
    const items = await page.evaluate(() => {
        let n = "", p = "", a = "", b = "";
        let k, h = 0;
        for (k = 0; k < 10; k++) { n += "&kwin" + k + "="; if (h < 10) { p += "&kwin_ter" + k + "="; } }
        for (k = 0; k < 5; k++) { a += "&kwout" + h + "="; if (h < 5) { b += "&kwout_ter" + h + "="; } }
        let l = "&kw_num=" + n + a + p + b + "&ch_type=4&sr_type=";
        l += "&BRTABLED=&BRTABLEB=&BRTABLEC=";
        // @ts-ignore
        const isLoginVal = (typeof isLogin !== 'undefined') ? isLogin : "1";
        l += "&genre_Nm=31&rebroad=&start_time=&end_time=&br_strtime=&br_endtime=&max_num=1000&isLogin=" + isLoginVal;

        // @ts-ignore
        if (typeof callIF2 !== 'function') return { error: 'callIF2 not found' };
        // @ts-ignore
        const responseParam = callIF2("searchKW", l);
        // @ts-ignore
        make_gnr_list(responseParam);
        // @ts-ignore
        return gnr_list;
    });

    if (items.error) return [];
    if (!Array.isArray(items)) return [];

    return items.map((item: any) => {
        if (typeof item !== 'string') return { title: '', channel: '', startTimeStr: null, link: '' };
        const logoMatch = item.match(/(\/bcs\/logo\/[^,"]+)/);
        const logoPath = logoMatch ? logoMatch[1] : '';
        const bsMatch = item.match(/(BS\s\d{3})/);
        const bsCode = bsMatch ? bsMatch[1] : '';
        const cols = item.split(',');
        const titleRaw = cols[3] || '';
        const rawStart = cols[4] || '';
        const id = cols[2] || '';

        let channel = 'BS';
        const mapped = resolveBSChannelFromLogo(logoPath);
        if (mapped) channel = mapped;
        else if (bsCode) channel = bsCode;

        let link = '';
        let startTimeStr = null;
        if (rawStart.length >= 12) {
            startTimeStr = `${rawStart.substring(0, 4)}-${rawStart.substring(4, 6)}-${rawStart.substring(6, 8)}T${rawStart.substring(8, 10)}:${rawStart.substring(10, 12)}:00`;
            if (id) link = `https://www.dimora.jp/digital-program/${rawStart}-${id}`;
        }
        return {
            title: normalizeTitle(titleRaw),
            channel: channel,
            startTimeStr: startTimeStr,
            link: link,
            rawTitle: titleRaw
        };
    }).filter((item: any) => {
        const t = item.rawTitle || item.title;
        return isChineseDrama(t, item.channel);
    });
}

// DiMora Scraper Main
export async function fetchDimoraData(): Promise<DramaSchedule[]> {
    console.log('Starting DiMora Scraper (Puppeteer)...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const schedules: DramaSchedule[] = [];
    const blogDataList = loadBlogData();
    let debugLog = '';

    try {
        const keywordItems = await scrapeByKeyword(page);
        console.log(`[Keyword] Found ${keywordItems.length} items.`);

        let genreItems: any[] = [];
        try {
            genreItems = await scrapeByGenreAPI(page);
            debugLog += `[GenreAPI] Found ${genreItems.length} items (after content filter).\n`;
            const uniqCh = [...new Set(genreItems.map(i => i.channel))];
            debugLog += `[Channels] ${uniqCh.join(', ')}\n`;
        } catch (e) {
            console.error('[GenreAPI] Error:', e);
        }

        console.log(`[GenreAPI] Filtered to ${genreItems.length} items.`);
        fs.writeFileSync('genre_debug.log', debugLog);

        const allItems = [...keywordItems, ...genreItems];

        for (const item of allItems) {
            // Apply Channel Filter from isTargetChannel
            if (!isTargetChannel(item.channel)) continue;

            if (!item.startTimeStr) continue;
            const [dateStr, fullTime] = item.startTimeStr.split('T');
            if (!dateStr || !fullTime) continue;
            const timeStr = fullTime.substring(0, 5);

            const title = normalizeTitle(item.title);
            const channelName = normalizeChannelName(item.channel || 'BS');

            let drama = schedules.find(d => d.title === title && d.channel === channelName);
            if (!drama) {
                const blogEntry = findBlogEntry(title, blogDataList);
                const finalUrl = (blogEntry && blogEntry.blogUrl) ? blogEntry.blogUrl : (item.link || 'https://www.dimora.jp/');

                drama = {
                    title,
                    url: finalUrl,
                    channel: channelName,
                    scheduleText: '',
                    nextBroadcasts: [],
                    blogUrl: blogEntry?.blogUrl
                };
                schedules.push(drama);
            }

            const isDup = drama.nextBroadcasts.some(b => b.date === dateStr && b.startTime === timeStr);
            if (!isDup) {
                drama.nextBroadcasts.push({ date: dateStr, startTime: timeStr });
            }
        }

    } catch (e) {
        console.error('DiMora scrape error:', e);
    } finally {
        await browser.close();
    }

    for (const s of schedules) {
        s.nextBroadcasts.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });
        const times = s.nextBroadcasts.map(b => `${b.date.substring(5)} ${b.startTime}`).join(', ');
        s.scheduleText = `${s.channel} ${times}`;
    }

    return schedules;
}
