'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, BookOpen, Loader2, RefreshCw, AlertTriangle, Tv } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

// ドラマデータの型定義
interface Drama {
  title: string;
  mood_text: string;
  blog_url: string;
  affiliate_link: string;
  image_url?: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [filteredDramas, setFilteredDramas] = useState<Drama[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 診断ガチャ・表示制御用の状態
  const [tagOptions, setTagOptions] = useState<[string, string]>(['', '']);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // 利用可能なタグリスト
  const availableTags = [
    '秘密', 'ミステリー', '宮廷', '胸キュン', 'ドロドロ',
    'アクション', '時代劇', '現代劇', '復讐', '三角関係',
    '泣ける', '笑える', '癒し', 'サスペンス', 'イケメン',
    '記憶喪失', 'ファンタジー', 'ラブコメ', '溺愛', 'ホラー',
    '歴史', 'SF', 'ラブストーリー', '武侠', '仲間',
    'コメディ', '甘い', '師弟', '友情', '偽装結婚',
    '転生', 'シリアス', '陰謀', '感動', 'ドキドキ',
    '契約結婚', 'タイムスリップ', 'ほのぼの', '切ない', '家族愛',
    'キュンキュン', 'ハッピーエンド', 'バッドエンド', '爽快', '美男美女',
    '身分違い', 'スカッと'
  ];

  // CSVデータの読み込み
  useEffect(() => {
    const loadDramas = async () => {
      try {
        const response = await fetch('/data/drama_database_v2.csv');

        if (!response.ok) {
          throw new Error(`CSVが見つかりません: ${response.status}`);
        }

        const csvText = await response.text();

        // 改行で分割し、空行を除去
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');

        // ヘッダー行(1行目)を除外して処理
        const parsedDramas: Drama[] = lines.slice(1).map(line => {
          // 単純にカンマで分割
          const rawValues = line.split(',');

          // クォート除去とトリミングを行うヘルパー関数
          const clean = (str: string) => str ? str.trim().replace(/^"|"$/g, '') : '';

          // ★列の順番変更に対応（タグを最後に持ってくる変更は維持）
          // 0:タイトル, 1:ブログURL, 2:アフィリエイト, 3:画像, 4以降:タグ

          const title = clean(rawValues[0]);
          const blog_url = clean(rawValues[1]);
          const affiliate_link = clean(rawValues[2]);
          const image_url = clean(rawValues[3]);

          // 5列目(index 4)以降はすべて結合してタグとみなす
          const moodParts = rawValues.slice(4).map(v => clean(v));
          const mood_text = moodParts.join(',');

          return {
            title: title || '',
            mood_text: mood_text || '',
            blog_url: blog_url || '',
            affiliate_link: affiliate_link || '',
            image_url: image_url || undefined
          };
        });

        setDramas(parsedDramas);
      } catch (error: any) {
        console.error('CSV読み込みエラー:', error);
        setErrorMsg(`データの読み込みに失敗しました: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDramas();
  }, []);

  // ランダムに2つのタグを選択
  const selectRandomTags = () => {
    const shuffled = [...availableTags].sort(() => Math.random() - 0.5);
    setTagOptions([shuffled[0], shuffled[1]]);
  };

  useEffect(() => {
    selectRandomTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ローカルフィルタリング検索
  const executeLocalSearch = (query: string) => {
    setErrorMsg(null);

    if (dramas.length === 0) {
      setErrorMsg('データが読み込まれていません。リロードしてください。');
      return;
    }

    try {
      const normalizedQuery = query.toLowerCase().trim();

      const results = dramas.filter(drama => {
        const titleMatch = drama.title && drama.title.toLowerCase().includes(normalizedQuery);
        const moodMatch = drama.mood_text && drama.mood_text.toLowerCase().includes(normalizedQuery);
        return titleMatch || moodMatch;
      });

      const shuffled = results.sort(() => Math.random() - 0.5);
      setFilteredDramas(shuffled.slice(0, 3));

    } catch (error: any) {
      console.error(error);
      setErrorMsg('検索中にエラーが発生しました');
    }
  };

  // タグを選択して検索
  const handleTagSelect = async (tag: string) => {
    if (isProcessing) return;

    setSelectedTag(tag);
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 600));

    executeLocalSearch(tag);

    setIsProcessing(false);
    setShowResult(true);
  };

  // 通常検索
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setSelectedTag(null);
    setShowResult(true);

    executeLocalSearch(input);
  };

  // リセット
  const resetDiagnosis = () => {
    selectRandomTags();
    setSelectedTag(null);
    setShowResult(false);
    setFilteredDramas([]);
    setInput('');
  };

  // ★修正：ブログリンクは無条件で「タイトル検索」にする（元に戻した）
  const getBlogLink = (drama: Drama) => {
    return `https://poupe.hatenadiary.jp/search?q=${encodeURIComponent(drama.title)}`;
  };

  // Amazonリンク判定用ヘルパー関数
  const hasValidAffiliateLink = (drama: Drama) => {
    return drama.affiliate_link && drama.affiliate_link.trim().startsWith('http');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="bg-red-900 text-amber-50 pt-8 pb-16 px-4 shadow-md border-b-4 border-amber-600">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2 tracking-wider">
            中国ドラマ
            <br className="block sm:hidden" />
            <span className="hidden sm:inline"> </span>
            コンシェルジュ
          </h1>
          <p className="text-red-200 mb-4">1万記事の中から、あなたにぴったりの作品をご案内します</p>
          <Link href="/schedule" className="inline-flex items-center gap-2 bg-amber-500 text-red-900 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-amber-400 transition-colors">
            <Tv size={18} />
            中国ドラマのTV放送予定を見る
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow-lg flex flex-col sm:flex-row gap-3 border border-slate-200 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ドラマ名を入力"
            className="flex-1 text-sm sm:text-base p-2 sm:p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800 w-full"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-red-800 text-white px-6 py-3 rounded-md font-bold hover:bg-red-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
            検索
          </button>
        </form>

        <div className="mb-6 text-center">
          <p className="text-xs text-slate-400 mb-1">- PR -</p>
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mx-auto flex flex-col items-center justify-center gap-2" style={{ maxWidth: '468px', minHeight: '100px' }}>
            <a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3759936&pid=892405457" rel="nofollow" target="_blank" className="font-bold text-blue-600 hover:underline text-base leading-tight">
              【フレッツ光】安心と信頼の光回線｜最大79,000円キャッシュバック
            </a>
            <img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3759936&pid=892405457" height="1" width="1" style={{ border: 0, width: 1, height: 1, display: 'none' }} alt="" />
          </div>
          <p className="text-xs text-slate-500 mt-1">えーこのドラマ視聴を支えるネット回線</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber-400 mb-6 relative">
          <div className="absolute top-0 right-0 bg-amber-400 text-red-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
            診断ガチャ
          </div>

          {!showResult && (
            <div className="animate-fade-in">
              <h2 className="text-center font-bold text-lg mb-4 text-slate-700 flex items-center justify-center gap-2">
                <Sparkles className="text-amber-500" />
                まずは、何で探す？
                <Sparkles className="text-amber-500" />
              </h2>

              {isLoading ? (
                <div className="text-center py-4 text-slate-500 text-sm">
                  <Loader2 className="animate-spin mx-auto mb-2" />
                  ドラマデータを読み込んでいます...
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
                    <button
                      onClick={() => handleTagSelect(tagOptions[0])}
                      disabled={isProcessing}
                      className={`flex-1 py-4 px-2 rounded-xl font-bold text-lg shadow-sm transition-all ${selectedTag === tagOptions[0]
                        ? 'bg-red-200 border-2 border-red-400 text-red-900 scale-105'
                        : selectedTag === tagOptions[1]
                          ? 'bg-red-50 border-2 border-red-100 text-red-400 opacity-50 cursor-not-allowed'
                          : 'bg-red-50 border-2 border-red-100 text-red-800 hover:bg-red-100 hover:border-red-300 hover:scale-105'
                        }`}
                    >
                      {selectedTag === tagOptions[0] ? '診断中...' : tagOptions[0]}
                    </button>

                    <div className="flex items-center justify-center text-slate-400 font-bold text-sm">
                      OR
                    </div>

                    <button
                      onClick={() => handleTagSelect(tagOptions[1])}
                      disabled={isProcessing}
                      className={`flex-1 py-4 px-2 rounded-xl font-bold text-lg shadow-sm transition-all ${selectedTag === tagOptions[1]
                        ? 'bg-blue-200 border-2 border-blue-400 text-blue-900 scale-105'
                        : selectedTag === tagOptions[0]
                          ? 'bg-blue-50 border-2 border-blue-100 text-blue-400 opacity-50 cursor-not-allowed'
                          : 'bg-blue-50 border-2 border-blue-100 text-blue-800 hover:bg-blue-100 hover:border-blue-300 hover:scale-105'
                        }`}
                    >
                      {selectedTag === tagOptions[1] ? '診断中...' : tagOptions[1]}
                    </button>
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={selectRandomTags}
                      disabled={isProcessing}
                      className="bg-white border border-slate-300 text-slate-600 text-sm flex items-center justify-center gap-2 mx-auto hover:border-red-400 hover:text-red-800 hover:bg-red-50 py-3 px-6 rounded-full shadow-sm transition-all disabled:opacity-50 font-bold"
                    >
                      <RefreshCw size={16} />
                      違うタグにする
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {showResult && (
            <div className="animate-fade-in">
              <div className={`p-4 rounded-lg mb-4 border-l-4 ${selectedTag
                ? 'bg-gradient-to-r from-amber-50 to-red-50 border-amber-500'
                : filteredDramas.length > 0
                  ? 'bg-slate-50 border-blue-500'
                  : 'bg-yellow-50 border-yellow-500'
                }`}>
                {selectedTag ? (
                  <>
                    <h2 className="text-xl font-bold text-red-900 flex items-center gap-2 mb-2">
                      <Sparkles className="text-amber-500" />
                      おすすめの結果が出ました！
                    </h2>
                    <p className="text-slate-700">
                      「<span className="font-bold text-red-800">{selectedTag}</span>」に関する作品
                    </p>
                  </>
                ) : filteredDramas.length > 0 ? (
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Search className="text-blue-500" />
                    ドラマが見つかりました！
                  </h2>
                ) : (
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="text-yellow-500" />
                    該当する作品が見つかりませんでした
                  </h2>
                )}
              </div>

              {errorMsg ? (
                <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700 mb-4">
                  {errorMsg}
                </div>
              ) : filteredDramas.length > 0 && (
                <div className="space-y-3 mb-6">
                  {filteredDramas.map((drama, index) => {
                    const isAffiliateValid = hasValidAffiliateLink(drama);

                    return (
                      <div key={index} className="bg-slate-50 rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-red-900">
                            <span className="inline-block w-6 h-6 bg-amber-400 text-white rounded-full text-center text-sm leading-6 mr-2">
                              {index + 1}
                            </span>
                            {drama.title}
                          </h3>
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                          <a
                            href={isAffiliateValid ? drama.affiliate_link : `https://www.amazon.co.jp/s?k=${encodeURIComponent(drama.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block w-full text-center py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${isAffiliateValid
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                          >
                            {isAffiliateValid ? "今すぐ観る" : "Amazonで探す"}
                          </a>

                          <a
                            href={getBlogLink(drama)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-lg font-bold hover:bg-slate-700 transition-colors text-sm"
                          >
                            <BookOpen size={16} />
                            ブログで感想を読む
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-4 text-center">
                <p className="text-xs text-slate-400 mb-2">- PR -</p>
                <a
                  href="https://amzn.to/3MzbRpI"
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="block hover:opacity-90 transition-opacity"
                >
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-sm text-slate-600 font-medium">
                      🎬 ドラマ視聴に最適な商品はこちら
                    </p>
                  </div>
                </a>
              </div>

              <button
                onClick={resetDiagnosis}
                className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-colors"
              >
                <RefreshCw size={18} />
                {selectedTag ? '他のタグで探す' : '検索をリセット'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 mb-8 text-center">
          <p className="text-xs text-slate-400 mb-1">- PR -</p>
          <a href="//ck.jp.ap.valuecommerce.com/servlet/referral?sid=3759936&pid=892405440" rel="nofollow" target="_blank" className="block mx-auto rounded-lg shadow-md overflow-hidden hover:opacity-95 transition-opacity" style={{ maxWidth: '468px' }}>
            <img src="//ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=3759936&pid=892405440" style={{ border: 0, width: '100%', height: 'auto' }} alt="えーこのドラマ視聴を支えるネット回線" />
          </a>
          <p className="text-xs text-slate-500 mt-1">
            えーこのドラマ視聴を支えるネット回線
          </p>
        </div>
      </div>

      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-200 mt-12 bg-slate-50">
        <p className="mb-1">当サイトはアフィリエイト広告（Amazonアソシエイト含む）を利用しています。</p>
        <p>Amazonのアソシエイトとして、適格販売により収入を得ています。</p>
        <p className="mt-4">&copy; 中国ドラマ コンシェルジュ</p>
      </footer>

      <Analytics />
    </main>
  );
}