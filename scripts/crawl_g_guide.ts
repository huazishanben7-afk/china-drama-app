
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// 型定義
interface DramaSchedule {
    title: string;
    url: string;
    imageUrl?: string;
    channel: string;
    scheduleText: string;
    nextBroadcasts: BroadcastEvent[];
    blogUrl?: string;
}

interface BroadcastEvent {
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime?: string; // HH:mm
    isNew?: boolean; // 新番組かどうか
}

interface BlogData {
    title: string;
    blogUrl: string;
}

const SEARCH_URL = 'https://www.tvkingdom.jp/schedulesBySearch.action?stationPlatformId=2&condition.keyword=%E4%B8%AD%E5%9B%BD%E3%83%89%E3%83%A9%E3%83%9E';
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.json');
const CSV_FILE = path.join(process.cwd(), 'public', 'data', 'drama_database_v2.csv');

// User-Agent for requests
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// CSVデータを読み込む関数
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

// タイトル正規化
function normalizeTitle(fullTitle: string): string {
    // 1. "中国ドラマ" 削除
    let title = fullTitle.replace(/中国ドラマ\s*/g, '');

    // 2. "第○話", "＃○" 以降を削除 (簡易的)
    // カッコ書きの補足情報などを削除するかは要調整だが、まずはシリーズ名を抽出したい
    // 例: "双燕秘抄 乱世を舞う二羽の絆 第２３話（字幕）" -> "双燕秘抄 乱世を舞う二羽の絆"
    title = title.replace(/\s*第?[0-9０-９]+話.*/, '');
    title = title.replace(/\s*＃[０-９0-9]+.*/, '');
    title = title.replace(/\s*\[.*?\]$/, ''); // 末尾の[終]などを削除
    title = title.replace(/【.*?】/g, ''); // 【キャスト名】などを削除
    title = title.replace(/\s*（字幕.*）.*/, '');

    return title.trim();
}

// 類似タイトル検索
function findBlogEntry(title: string, blogData: BlogData[]): BlogData | undefined {
    // データ量少ないので単純検索
    // CSVタイトルがRSSタイトルに含まれる、あるいはその逆
    const t1 = title.replace(/\s+/g, '').toLowerCase();
    return blogData.find(b => {
        const t2 = b.title.replace(/\s+/g, '').toLowerCase();
        return t1.includes(t2) || t2.includes(t1);
    });
}

async function scrapeGGuide() {
    console.log('Fetching Search Page...');
    try {
        const blogDataList = loadBlogData();
        console.log(`Loaded ${blogDataList.length} blog entries.`);

        // 1. Get Search Page to find RSS Link
        const searchRes = await axios.get(SEARCH_URL, { headers: HEADERS });
        const $search = cheerio.load(searchRes.data);

        let rssRelPath = $search('a.rssArrw').attr('href');

        // フォールバック: RSSリンクが見つからない場合、hrefに "/rss/" を含むものを探す
        if (!rssRelPath) {
            $search('a').each((_, el) => {
                const h = $search(el).attr('href');
                if (h && h.includes('/rss/') && h.includes('condition.keyword')) {
                    rssRelPath = h;
                }
            });
        }

        if (!rssRelPath) {
            console.error('RSS Link NOT found on search page.');
            return;
        }

        const rssUrl = `https://www.tvkingdom.jp${rssRelPath}`;
        console.log('Fetching RSS:', rssUrl);

        // 2. Fetch RSS
        const rssRes = await axios.get(rssUrl, { headers: HEADERS });
        const $ = cheerio.load(rssRes.data, { xmlMode: true });

        const scheduleMap = new Map<string, DramaSchedule>();

        $('item').each((_, el) => {
            const $item = $(el);
            const fullTitle = $item.find('title').text();
            const link = $item.find('link').text();
            const dateStr = $item.find('dc\\:date').text(); // 2025-12-21T13:00+09:00
            const desc = $item.find('description').text(); // 12/21 13:00～14:50 [BS12 トゥエルビ(Ch.222)]

            // タイトル抽出
            const title = normalizeTitle(fullTitle);

            // チャンネル抽出
            const channelMatch = desc.match(/\[(.*?)\]/);
            const channel = channelMatch ? channelMatch[1] : 'Unknown Channel';

            // 日時抽出
            const dateObj = new Date(dateStr);
            const yyyy = dateObj.getFullYear();
            const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const dd = dateObj.getDate().toString().padStart(2, '0');
            const hh = dateObj.getHours().toString().padStart(2, '0');
            const min = dateObj.getMinutes().toString().padStart(2, '0');

            const date = `${yyyy}-${mm}-${dd}`;
            const startTime = `${hh}:${min}`;

            // Mapへ追加または更新
            if (!scheduleMap.has(title)) {
                // 初期データ作成
                // ブログリンク確認
                const blogEntry = findBlogEntry(title, blogDataList);
                const finalUrl = blogEntry ? blogEntry.blogUrl : link;
                if (blogEntry) console.log(`[Link Match] ${title} -> ${blogEntry.title}`);

                scheduleMap.set(title, {
                    title,
                    url: finalUrl,
                    channel, // 最初に検知したチャンネルを採用
                    scheduleText: channel, // UI表示用に簡易セット
                    nextBroadcasts: []
                });
            }

            const entry = scheduleMap.get(title)!;
            // 放送日時追加 (重複チェックなし、単純追加)
            entry.nextBroadcasts.push({
                date,
                startTime
            });

            // チャンネル名が更新できるなら更新 (複数ある場合は連結したほうがいいかもだが一旦最新優先)
            // entry.channel = channel; 
        });

        // 配列に変換してソート
        const results = Array.from(scheduleMap.values()).map(s => {
            // 日付順にソート
            s.nextBroadcasts.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.startTime.localeCompare(b.startTime);
            });
            // 過去の放送を除外するか？ -> RSSは未来のが多いはずだが、直近のものも含まれる。
            // 1週間以内の未来のものだけでいいならフィルタリング可能。
            // ここではそのまま出す。

            // scheduleTextをいい感じに生成
            const times = s.nextBroadcasts.map(b => `${b.date.substring(5)} ${b.startTime}`).join(', ');
            s.scheduleText = `${s.channel} ${times}`; // フォーマット調整

            return s;
        });

        // 保存
        if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
            fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
        }
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
        console.log(`Saved ${results.length} dramas to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error scraping G-Guide:', error);
    }
}

scrapeGGuide();
