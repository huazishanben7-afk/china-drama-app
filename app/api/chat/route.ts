import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getAllDramas, searchDramasByKeyword } from '@/lib/csv';
import { DramaRecommendation } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. キーワード検索
    const searchResults = await searchDramasByKeyword(message);
    
    if (searchResults.length > 0) {
      const formattedResults: DramaRecommendation[] = searchResults.map(drama => ({
        drama,
        reason: `タイトルに「${message}」が含まれる作品が見つかりました。`
      }));
      return NextResponse.json({ type: 'search', items: formattedResults });
    }

    // 2. AI相談
    const allDramas = await getAllDramas();
    
    if (allDramas.length === 0) {
      return NextResponse.json({ type: 'error', items: [] }, { status: 500 });
    }

    const prompt = `
      ユーザーは次の気分や要望を持っています: "${message}"
      以下のドラマリストから、このユーザーに最もおすすめの3作品を選んでください。
      
     [ドラマリスト]
      ${allDramas.map(d => d.title).join(', ')}
    `;

    // ★ここを、あなたのリストにあった 'gemini-1.5-flash' に変更！
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'), 
      schema: z.object({
        recommendations: z.array(z.object({
          title: z.string(),
          reason: z.string().describe('なぜこのドラマがおすすめなのか、20文字〜50文字程度の短い推薦コメント'),
        })),
      }),
      prompt: prompt,
    });

    const aiResults: DramaRecommendation[] = object.recommendations
      .map(rec => {
        const original = allDramas.find(d => d.title === rec.title);
        if (!original) return null;
        return {
          drama: original,
          reason: rec.reason
        };
      })
      .filter((item): item is DramaRecommendation => item !== null);

    return NextResponse.json({ type: 'ai', items: aiResults });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'AIサービスの呼び出しに失敗しました' }, { status: 500 });
  }
}