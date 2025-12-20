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
