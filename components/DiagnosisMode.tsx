'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function DiagnosisMode() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSelect = async (option: 'secret' | 'actor') => {
    // 連打防止
    if (isNavigating) return;
    
    setSelectedOption(option);
    setIsNavigating(true);

    // UX向上のため0.6秒待機
    await new Promise(resolve => setTimeout(resolve, 600));

    // 結果ページへ遷移（クエリパラメータで選択値を渡す）
    router.push(`/result?type=${option}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber-400 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-amber-400 text-red-900 text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
        診断ガチャ
      </div>
      
      <h2 className="text-center font-bold text-lg mb-4 text-slate-700 flex items-center justify-center gap-2">
        <Sparkles className="text-amber-500" />
        まずは、何で探す？
        <Sparkles className="text-amber-500" />
      </h2>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch animate-fade-in">
        <button
          onClick={() => handleSelect('secret')}
          disabled={isNavigating}
          className={`flex-1 py-4 px-2 rounded-xl font-bold text-lg shadow-sm transition-all ${
            selectedOption === 'secret'
              ? 'bg-red-200 border-2 border-red-400 text-red-900 scale-105'
              : selectedOption === 'actor'
              ? 'bg-red-50 border-2 border-red-100 text-red-400 opacity-50 cursor-not-allowed'
              : 'bg-red-50 border-2 border-red-100 text-red-800 hover:bg-red-100 hover:border-red-300 hover:scale-105'
          }`}
        >
          {selectedOption === 'secret' ? '診断中...' : '秘密'}
        </button>
        
        <div className="flex items-center justify-center text-slate-400 font-bold text-sm">
          OR
        </div>

        <button
          onClick={() => handleSelect('actor')}
          disabled={isNavigating}
          className={`flex-1 py-4 px-2 rounded-xl font-bold text-lg shadow-sm transition-all ${
            selectedOption === 'actor'
              ? 'bg-blue-200 border-2 border-blue-400 text-blue-900 scale-105'
              : selectedOption === 'secret'
              ? 'bg-blue-50 border-2 border-blue-100 text-blue-400 opacity-50 cursor-not-allowed'
              : 'bg-blue-50 border-2 border-blue-100 text-blue-800 hover:bg-blue-100 hover:border-blue-300 hover:scale-105'
          }`}
        >
          {selectedOption === 'actor' ? '診断中...' : '俳優'}
        </button>
      </div>
    </div>
  );
}