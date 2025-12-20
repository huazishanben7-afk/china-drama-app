
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// 型定義
// 型定義
export interface DramaSchedule {
    title: string;
    url: string;
    imageUrl?: string;
    channel: string;
    scheduleText: string;
    nextBroadcasts: BroadcastEvent[];
    blogUrl?: string;
}

export interface BroadcastEvent {
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime?: string; // HH:mm
    isNew?: boolean; // 新番組かどうか
}

interface BlogData {
    title: string;
    blogUrl: string;
}

const BASE_URL = 'https://www.bs11.jp';
const TARGET_URL = 'https://www.bs11.jp/drama/';
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.json');
const CSV_FILE = path.join(process.cwd(), 'public', 'data', 'drama_database_v2.csv');

// 曜日のマッピング
const DAY_MAP: { [key: string]: number } = {
    '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0
};

// CSVデータを読み込む関数
function loadBlogData(): BlogData[] {
    try {
        const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
        const lines = fileContent.split('\n');
        const data: BlogData[] = [];

        // 1行目はヘッダーなのでスキップ
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // CSVパース (簡易版: カンマ区切りだが、引用符内のカンマは考慮しない前提)
            // データを見る限り引用符で囲まれていない箇所もあるようなので、単純splitで対応
            // ただし、最後のカラムにカンマが含まれる可能性があるため注意が必要だが、
            // title(0)とblog_url(1)は先頭にあるので split(',') で十分取得可能
            const cols = line.split(',');

            // タイトルとブログURLがあれば追加
            // タイトルは cols[0], blog_urlは cols[1]
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

// タイトルを正規化して比較しやすくする
function normalizeTitle(title: string): string {
    return title
        .replace(/\s+/g, '') // 空白削除
        .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角→半角
        .toLowerCase();
}

// スケジュールテキストから放送予定日を計算する関数
function parseSchedule(text: string): BroadcastEvent[] {
    const events: BroadcastEvent[] = [];
    const today = new Date();

    // マッチパターン: "毎週月～金曜日" or "毎週火曜日" etc.
    // 時間パターン: "午後1時00分～2時00分"

    // 例: "毎週月～金曜日 午後1時00分～2時00分"
    const weeklyMatch = text.match(/毎週([月火水木金土日])(?:～([月火水木金土日]))?曜日/);
    const timeMatch = text.match(/午後(\d+)時(\d+)分/);

    if (weeklyMatch && timeMatch) {
        const startDayStr = weeklyMatch[1];
        const endDayStr = weeklyMatch[2];

        let targetDays: number[] = [];

        if (endDayStr) {
            // 範囲指定 (例: 月～金)
            const start = DAY_MAP[startDayStr];
            const end = DAY_MAP[endDayStr];
            // 0(日曜)が絡むと面倒だが、BS11の表記的に月～金が多いので簡易実装
            // 日曜始まり(0)～土曜(6)の順でループ
            for (let i = 1; i <= 6; i++) {
                if (i >= start && i <= end) targetDays.push(i);
            }
        } else {
            // 単発曜日 (例: 火曜日)
            targetDays.push(DAY_MAP[startDayStr]);
        }

        // 時間変換 (午後表記前提)
        let hour = parseInt(timeMatch[1], 10);
        if (hour < 12) hour += 12; // 午後なので+12 (12時は12時のまま)
        if (hour === 24) hour = 12; // 正午表記対応の揺らぎ吸収

        const minute = timeMatch[2];
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // 直近7日間の日付を計算
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);

            const dayOfWeek = checkDate.getDay(); // 0-6

            if (targetDays.includes(dayOfWeek)) {
                const yyyy = checkDate.getFullYear();
                const mm = (checkDate.getMonth() + 1).toString().padStart(2, '0');
                const dd = checkDate.getDate().toString().padStart(2, '0');

                events.push({
                    date: `${yyyy}-${mm}-${dd}`,
                    startTime: timeStr
                });
            }
        }
    }

    return events;
}

export async function fetchBS11Data(): Promise<DramaSchedule[]> {
    console.log(`Fetching ${TARGET_URL}...`);
    try {
        const blogDataList = loadBlogData();
        const { data } = await axios.get(TARGET_URL);
        const $ = cheerio.load(data);
        const results: DramaSchedule[] = [];
        let insideChinaSection = false;

        $('main, body').find('*').each((_, el) => {
            const $el = $(el);
            if ($el.is('h3')) {
                const text = $el.text().trim();
                if (text.includes('中国ドラマ')) {
                    insideChinaSection = true;
                } else if (text.includes('韓国ドラマ') || text.includes('ヨーロッパドラマ') || text.includes('国内ドラマ')) {
                    insideChinaSection = false;
                }
            }

            if (insideChinaSection && $el.is('a') && $el.attr('href')) {
                const url = $el.attr('href');
                const title = $el.text().trim();

                if (title && url && url.includes('/drama/') && title !== '番組情報へ') {
                    let scheduleText = '';
                    const parentText = $el.parent().text().replace(title, '').trim();
                    if (parentText.includes('毎週')) {
                        scheduleText = parentText;
                    }
                    if (!scheduleText) {
                        const siblingText = $el.parent().next().text().trim();
                        if (siblingText.includes('毎週')) {
                            scheduleText = siblingText;
                        }
                    }
                    if (!scheduleText) {
                        const grandParentText = $el.parent().parent().text().replace(title, '').trim();
                        const lines = grandParentText.split('\n');
                        const scheduleLine = lines.find(line => line.includes('毎週'));
                        if (scheduleLine) scheduleText = scheduleLine.trim();
                    }

                    if (scheduleText) {
                        const existing = results.find(r => r.title === title);
                        if (!existing) {
                            let broadcastUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
                            let blogUrl: string | undefined;

                            const normalizedTitle = normalizeTitle(title);
                            const blogEntry = blogDataList.find(b => normalizeTitle(b.title).includes(normalizedTitle) || normalizedTitle.includes(normalizeTitle(b.title)));

                            if (blogEntry) {
                                console.log(`[BS11 Link Replaced] ${title} -> ${blogEntry.blogUrl}`);
                                broadcastUrl = blogEntry.blogUrl;
                                blogUrl = blogEntry.blogUrl;
                            }

                            const nextBroadcasts = parseSchedule(scheduleText);

                            if (nextBroadcasts.length > 0) {
                                results.push({
                                    title,
                                    url: broadcastUrl,
                                    channel: 'BS11',
                                    scheduleText,
                                    nextBroadcasts,
                                    blogUrl
                                });
                            }
                        }
                    }
                }
            }
        });

        console.log(`Found ${results.length} BS11 Chinese dramas.`);
        return results;

    } catch (error) {
        console.error('Error fetching BS11:', error);
        return [];
    }
}
