'use client';

import { useState } from 'react';
import { Search, Sparkles, BookOpen, Tv, Loader2, AlertTriangle } from 'lucide-react';
import { SearchResult } from '@/lib/types';

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // エラー表示用

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      
      const data = await response.json();

      // ここでエラーチェックを追加！
      if (!response.ok || data.error) {
        throw new Error(data.error || 'サーバーエラーが発生しました');
      }
      
      // データ形式の安全確認
      if (!data.items || !Array.isArray(data.items)) {
         // itemsがない場合は空配列として扱うかエラーにする
         setResult({ type: 'search', items: [] });
      } else {
         setResult(data);
      }

    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="bg-red-900 text-amber-50 py-8 px-4 shadow-md border-b-4 border-amber-600">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2 tracking-wider">中国ドラマ コンシェルジュ</h1>
          <p className="text-red-200">1万記事の中から、あなたにぴったりの作品をご案内します</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow-lg flex gap-2 border border-slate-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ドラマ名、または今の気分（例：泣ける時代劇）"
            className="flex-1 p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-red-800 text-white px-6 py-3 rounded-md font-bold hover:bg-red-900 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
            診断
          </button>
        </form>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* エラーがあれば表示するエリア */}
        {errorMsg && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm flex items-center gap-3">
            <AlertTriangle />
            <div>
              <p className="font-bold">エラーが発生しました</p>
              <p className="text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {result && result.items && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-6 justify-center text-slate-500">
              {result.type === 'ai' ? (
                <><Sparkles className="text-yellow-500" /> <span>AIがあなたの気分に合わせて選びました</span></>
              ) : (
                <><Search className="text-blue-500" /> <span>タイトル検索結果</span></>
              )}
            </div>

            <div className="space-y-6">
              {result.items.map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-red-900">{item.drama.title}</h2>
                      {item.drama.image_url && (
                        <div className="w-16 h-16 bg-slate-200 rounded-md bg-cover bg-center" style={{backgroundImage: `url(${item.drama.image_url})`}} />
                      )}
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4 border-l-4 border-yellow-400">
                      <p className="text-slate-700 font-medium">💡 おすすめポイント</p>
                      <p className="text-slate-600 text-sm mt-1">{item.reason}</p>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <a 
                        // ここを変更！CSVのURLを使わず、タイトルでブログ内検索をするURLを動的に作ります
  			href={`https://poupe.hatenadiary.jp/search?q=${encodeURIComponent(item.drama.title)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-lg font-bold hover:bg-slate-700 transition-colors text-sm"
                      >
                        <BookOpen size={16} />
                        ブログで感想を読む
                      </a>
                      
                      {item.drama.affiliate_link && (
                        <a 
                          href={item.drama.affiliate_link}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity text-sm"
                        >
                          <Tv size={16} />
                          今すぐ観る
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {result.items.length === 0 && (
               <p className="text-center text-slate-500">該当するドラマが見つかりませんでした。</p>
            )}
          </div>
        )}
      </div>
{/* フッター（PR表記・Amazon免責） */}
      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-200 mt-12 bg-slate-50">
        <p className="mb-1">当サイトはアフィリエイト広告（Amazonアソシエイト含む）を利用しています。</p>
        <p>Amazonのアソシエイトとして、適格販売により収入を得ています。</p>
        <p className="mt-4">&copy; 中国ドラマ コンシェルジュ</p>
      </footer>
    </main>
  );
}