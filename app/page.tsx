'use client';

import { useState } from 'react';
import { Search, Sparkles, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { SearchResult } from '@/lib/types';
import { Analytics } from "@vercel/analytics/react";

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      if (!response.ok || data.error) {
        throw new Error(data.error || 'サーバーエラーが発生しました');
      }
      
      if (!data.items || !Array.isArray(data.items)) {
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
            type="submit