'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Tv, Home, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface BroadcastEvent {
    date: string;
    startTime: string;
}

interface DramaSchedule {
    title: string;
    url: string;
    channel: string;
    scheduleText: string;
    nextBroadcasts: BroadcastEvent[];
}

interface FlattenedEvent {
    id: string;
    title: string;
    url: string;
    channel: string;
    date: string;
    startTime: string;
    dateObj: Date;
}

export default function SchedulePage() {
    const [schedules, setSchedules] = useState<DramaSchedule[]>([]);
    const [events, setEvents] = useState<FlattenedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await fetch('/data/schedule.json');
                if (!res.ok) throw new Error('スケジュールの取得に失敗しました');
                const data: DramaSchedule[] = await res.json();
                setSchedules(data);

                // イベントをフラット化して日付順にソート
                const allEvents: FlattenedEvent[] = [];
                data.forEach((item, index) => {
                    item.nextBroadcasts.forEach((broadcast, bIndex) => {
                        // Ensure time is padded "4:00" -> "04:00" just in case
                        const [h, m] = broadcast.startTime.split(':');
                        const paddedTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
                        const dateStr = `${broadcast.date}T${paddedTime}`;

                        const dateObj = new Date(dateStr);
                        if (!isNaN(dateObj.getTime())) {
                            allEvents.push({
                                id: `${index}-${bIndex}`,
                                title: item.title,
                                url: item.url,
                                channel: item.channel,
                                date: broadcast.date,
                                startTime: paddedTime, // Use padded time for display/sort consistency
                                dateObj
                            });
                        }
                    });
                });

                // 日付順にソート
                allEvents.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
                setEvents(allEvents);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    // ユニークなチャンネルリストを作成
    const channels = Array.from(new Set(events.map(e => e.channel))).sort();

    // フィルタリングされたイベント
    const filteredEvents = selectedChannel
        ? events.filter(e => e.channel === selectedChannel)
        : events;

    // フィルタリングされた作品リスト
    const filteredSchedules = selectedChannel
        ? schedules.filter(s => s.channel === selectedChannel)
        : schedules;

    // 日付フォーマットヘルパー
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const months = d.getMonth() + 1;
        const days = d.getDate();
        const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
        const w = weekDays[d.getDay()];
        return `${months}/${days}(${w})`;
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
            {/* ヘッダー */}
            <div className="bg-red-900 text-amber-50 py-6 px-4 shadow-md border-b-4 border-amber-600">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Home size={20} />
                        <span className="font-bold">TOPへ戻る</span>
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-wider flex items-center gap-2">
                        <Tv className="text-amber-400" />
                        放送予定
                    </h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 mt-6">

                {/* ローディング状態 */}
                {loading && (
                    <div className="text-center py-12 text-slate-500">
                        <Loader2 className="animate-spin mx-auto mb-2 w-8 h-8 text-red-800" />
                        <p>最新の放送予定を読み込んでいます...</p>
                    </div>
                )}

                {/* エラー状態 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 flex items-center gap-2">
                        <AlertCircle />
                        <span>{error}</span>
                    </div>
                )}

                {/* コンテンツ */}
                {!loading && !error && (
                    <>
                        {/* チャンネルフィルター */}
                        <div className="mb-8">
                            <h2 className="text-sm font-bold text-slate-500 mb-2">チャンネルで絞り込み</h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedChannel(null)}
                                    className={`px-3 py-1 rounded-full text-sm font-bold transition-colors border ${selectedChannel === null
                                        ? 'bg-red-800 text-white border-red-800'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                        }`}
                                >
                                    すべて
                                </button>
                                {channels.map(channel => (
                                    <button
                                        key={channel}
                                        onClick={() => setSelectedChannel(channel)}
                                        className={`px-3 py-1 rounded-full text-sm font-bold transition-colors border ${selectedChannel === channel
                                            ? 'bg-red-800 text-white border-red-800'
                                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                            }`}
                                    >
                                        {channel}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amazon おすすめ商品セクション (Compact) */}
                        <div className="mb-8 bg-gradient-to-r from-red-50 to-amber-50 rounded-lg p-3 border border-amber-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-amber-400 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-md z-10">
                                PR
                            </div>

                            <h2 className="text-xs sm:text-sm font-bold text-red-900 mb-3 flex items-center justify-center text-center gap-1 leading-tight flex-wrap">
                                <span className="text-sm">✨</span>
                                <span>AIに異能と呼ばれるえーこが選ぶ！</span>
                                <span className="block w-full sm:w-auto sm:inline">ドラマ疲れを癒やすグッズ3選</span>
                                <span className="text-sm">✨</span>
                            </h2>

                            <div className="grid grid-cols-3 gap-2">
                                {/* 商品1: あずきのチカラ */}
                                <div className="bg-white rounded p-2 shadow-sm border border-amber-50 flex flex-col items-center hover:shadow transition-shadow">
                                    <div className="w-full h-16 relative mb-1 flex items-center justify-center overflow-hidden bg-white">
                                        <img
                                            src="https://m.media-amazon.com/images/I/81bja9-OsFL._AC_SL1500_.jpg"
                                            alt="あずきのチカラ"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <h3 className="font-bold text-[10px] text-slate-700 text-center mb-1 line-clamp-2 h-7 leading-tight">
                                        あずきのチカラ 目もと用
                                    </h3>
                                    <a
                                        href="https://www.amazon.co.jp/%E3%80%90Amazon-co-jp%E9%99%90%E5%AE%9A%E3%80%91-%E3%81%82%E3%81%9A%E3%81%8D%E3%81%AE%E3%83%81%E3%82%AB%E3%83%A9-100-%E3%81%82%E3%81%9A%E3%81%8D%E3%81%AE%E5%A4%A9%E7%84%B6%E8%92%B8%E6%B0%97%E3%81%A7%E7%9B%AE%E8%96%AC%E3%82%82%E3%81%A8%E3%82%92%E6%B8%A9%E3%82%81%E3%82%8B-%E3%82%A2%E3%82%A4%E3%83%9E%E3%82%B9%E3%82%AF%E3%82%BF%E3%82%A4%E3%83%97-%E3%83%81%E3%83%B3%E3%81%97%E3%81%A6%E3%81%8F%E3%82%8A%E8%BF%94%E3%81%97%E4%BD%BF%E3%81%88%E3%82%8B/dp/B0CHR8MFTH?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=89COXCQEH7VW&dib=eyJ2IjoiMSJ9.BkgmzP71P2bqEoz4K8F3YdkcB_74bmoyfqgXtMBa0Seba8j8bA25W5FNKztpUpfo5MeB-Fh9w1Byi4Ij0uETIUI2_iFfDMy53ThlIjCBY6eh8W1EXkiHrColLeKsH2lkRqQ--vLNLJIsHwRNgZYJqfFNKgdtC1JLWJNJLB5tavbhMMxV0SyBC9Hcw6uGL_Bs0nWUU3AehwsCvPzIkvYBu1YfxNHa8MjNXsHD7pDG4cJ5akhQ_bIxqJhrrMUqS3CQxOIhHvQEAQj_gCaveg5Z_zgAovulkxe7uRi5phnjPaw.j76OD6jCH4cwNQPveF7OJKVhGrjkUZ1uoCYmHnZiM_w&dib_tag=se&keywords=%E3%82%A2%E3%82%A4%E3%83%9E%E3%82%B9%E3%82%AF&qid=1766275854&sprefix=%E3%82%A2%E3%82%A4%E3%83%9E%E3%82%B9%E3%82%AF%2Caps%2C635&sr=8-5&th=1&linkCode=ll1&tag=poupe-22&linkId=7d09d42246fde848535a55d9d48b2a61&language=ja_JP&ref_=as_li_ss_tl"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-auto w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-1 px-2 rounded text-[10px] text-center transition-colors shadow-sm"
                                    >
                                        見る
                                    </a>
                                </div>

                                {/* 商品2: 知覧紅茶 */}
                                <div className="bg-white rounded p-2 shadow-sm border border-amber-50 flex flex-col items-center hover:shadow transition-shadow">
                                    <div className="w-full h-16 relative mb-1 flex items-center justify-center overflow-hidden bg-white">
                                        <img
                                            src="https://m.media-amazon.com/images/I/51RkDW3IJeL._AC_SL1280_.jpg"
                                            alt="知覧紅茶"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <h3 className="font-bold text-[10px] text-slate-700 text-center mb-1 line-clamp-2 h-7 leading-tight">
                                        かごしま知覧紅茶
                                    </h3>
                                    <a
                                        href="https://www.amazon.co.jp/%E3%83%9D%E3%83%83%E3%82%AB%E3%82%B5%E3%83%83%E3%83%9D%E3%83%AD-%E3%81%8B%E3%81%94%E3%81%97%E3%81%BE%E7%9F%A5%E8%A6%A7%E7%B4%85%E8%8C%B6%E7%84%A1%E7%B3%96-500ml-PET-%C3%9724%E6%9C%AC/dp/B0D93FCH5G?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=3VIAGYW1HJ5KM&dib=eyJ2IjoiMSJ9.pQQsi0SYoCnnXC2PGkCWZkt6d6xV7XqmGCHUzjPww33fzlcrlJFfmSa3OaFMjRw-MW-OMxnVsF70dMIytx3APvQUxQTZIpful7_dKAABLLSwGHxPx98giRbTbIZefSMIlGOVAsHN7eIf3G3dZpTG3Lvw2ldqmAAccRFj1MFTbo1-zYGerqoGwMhiAYloQlfltXUsi6m49ptkUGYyZ_cqzTaDg3xizpiFoGnS6HDgmjhsXRcHxswJhS-L_IK4ZaN2fCNZbSmPfozRPvwa6WmNEy3aZao6-uqXEF6FKqVc_gg.GSylQ6KeZTozg8ZuZUt4p9AyigITb23Y1c3aOIoGFbY&dib_tag=se&keywords=%E7%9F%A5%E8%A6%A7%E7%B4%85%E8%8C%B6&qid=1766275937&sprefix=%E7%9F%A5%E8%A6%A7%E3%81%93%2Caps%2C175&sr=8-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1&linkCode=ll1&tag=poupe-22&linkId=64c2453a3a2b9b0b01f710a42808f0a9&language=ja_JP&ref_=as_li_ss_tl"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-auto w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-1 px-2 rounded text-[10px] text-center transition-colors shadow-sm"
                                    >
                                        見る
                                    </a>
                                </div>

                                {/* 商品3: ロートVアクティブ */}
                                <div className="bg-white rounded p-2 shadow-sm border border-amber-50 flex flex-col items-center hover:shadow transition-shadow">
                                    <div className="w-full h-16 relative mb-1 flex items-center justify-center overflow-hidden bg-white">
                                        <img
                                            src="https://m.media-amazon.com/images/I/61svDJkELZL._AC_SL1000_.jpg"
                                            alt="ロートVアクティブ"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <h3 className="font-bold text-[10px] text-slate-700 text-center mb-1 line-clamp-2 h-7 leading-tight">
                                        ロートVアクティブ
                                    </h3>
                                    <a
                                        href="https://www.amazon.co.jp/%E3%83%AD%E3%83%BC%E3%83%88%E7%9B%AE%E8%96%AC-%E3%80%90%E7%AC%AC3%E9%A1%9E%E5%8C%BB%E8%96%AC%E5%93%81%E3%80%91%E3%83%AD%E3%83%BC%E3%83%88V%E3%82%A2%E3%82%AF%E3%83%86%E3%82%A3%E3%83%96-13mL/dp/B00K1SZS4E?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=3RH9D0L7CE7WH&dib=eyJ2IjoiMSJ9.OJxke-ghPFjAJ1RjbTIuCOQ3OSGtnJ_MbQoOjzyun4B843yxAe7O945X_DoFJxfg0V66WrOvu7Abf_Wi8ox6BveRxFoQZNS9oi8CKk8d204kJINYRqOwTJycc2L-77d2g9skAm9cl53gWZ_GkcMIuTwdOBbOWMlgK9z9OLo6TDfRTZe3PDGgcJYsSx27yw4nkAqN7LiQl32tJEP1I1oo-I6ycJrfixHfrI1JiGdYUdBwdIBQ0FuKXG-fX1slTDlTnmYllUwG9WF8yU-N0xsMPTEpxaQ-pSzyTBv5vZHVUNc.7TTpjQyVMWzhfT9UkbNqFgagnDIAoaCEpJvTHNYg3zs&dib_tag=se&keywords=%E7%9B%AE%E8%96%AC+%E8%80%81%E5%8C%96&qid=1766276064&sprefix=%E7%9B%AE%E8%96%AC+%E8%80%81%E5%8C%96%2Caps%2C579&sr=8-1&linkCode=ll1&tag=poupe-22&linkId=5e0ff5ccf0611b0bade9ceee44ea4c58&language=ja_JP&ref_=as_li_ss_tl"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-auto w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-1 px-2 rounded text-[10px] text-center transition-colors shadow-sm"
                                    >
                                        見る
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* 直近の放送リスト */}
                        <div className="mb-10">
                            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 border-l-4 border-red-800 pl-3">
                                <Calendar className="text-red-800" size={20} />
                                これからの放送スケジュール
                            </h2>

                            {filteredEvents.length === 0 ? (
                                <p className="text-slate-500 text-center py-8 bg-white rounded-lg shadow-sm border border-slate-200">
                                    該当する放送予定はありません
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {filteredEvents.map((event, index) => {
                                        // 日付が変わるタイミングでヘッダーを入れるなどの工夫もできるが、今回はシンプルにリスト表示
                                        const isToday = new Date().toDateString() === event.dateObj.toDateString();

                                        return (
                                            <div key={event.id} className={`bg-white p-4 rounded-lg shadow-sm border flex gap-4 ${isToday ? 'border-red-400 ring-1 ring-red-100' : 'border-slate-200'}`}>
                                                <div className="flex flex-col items-center justify-center min-w-[3.5rem] bg-slate-100 rounded p-2 text-slate-700">
                                                    <span className="text-xs font-bold">{formatDate(event.date)}</span>
                                                    <span className="text-lg font-bold text-red-800">{event.startTime}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-amber-600 mb-1 flex items-center gap-1">
                                                        <Tv size={12} />
                                                        {event.channel}
                                                    </div>
                                                    <Link href={event.url} target="_blank" className="font-bold text-slate-800 text-lg hover:text-red-700 hover:underline line-clamp-2">
                                                        {event.title}
                                                    </Link>
                                                </div>
                                                <div className="flex items-center text-slate-300">
                                                    <ChevronRight />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 作品別リスト (アコーディオン的ではなく一覧で) */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 border-l-4 border-slate-500 pl-3">
                                <Tv className="text-slate-500" size={20} />
                                放送中の作品一覧 {selectedChannel ? `(${selectedChannel})` : ''}
                            </h2>
                            {filteredSchedules.length === 0 ? (
                                <p className="text-slate-500 text-center py-8 bg-white rounded-lg shadow-sm border border-slate-200">
                                    表示する作品はありません
                                </p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {filteredSchedules.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                            <h3 className="font-bold text-base text-slate-800 mb-2 line-clamp-2 min-h-[3rem]">
                                                <Link href={item.url} target="_blank" className="hover:text-red-700 hover:underline">
                                                    {item.title}
                                                </Link>
                                            </h3>
                                            <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded">
                                                {item.scheduleText}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
