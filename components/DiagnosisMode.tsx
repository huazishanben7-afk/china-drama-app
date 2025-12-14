"use client";

import { useState } from 'react';

// ここに「直感で選ぶ」機能を作っていきます
export default function DiagnosisMode() {
  return (
    <div className="text-center py-10">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        🎬 直感でドラマ診断
      </h3>
      <p className="text-gray-600 mb-6">
        気分を選んでいくだけで、<br />
        あなたにぴったりのドラマが見つかります。
      </p>
      <div className="p-4 bg-gray-100 rounded-lg inline-block text-sm text-gray-500">
        🚧 機能準備中... 🚧<br/>
        （ここにボタンが表示されます）
      </div>
    </div>
  );
}