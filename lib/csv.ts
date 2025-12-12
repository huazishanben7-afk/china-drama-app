import Papa from 'papaparse';
import { Drama } from './types';
import { promises as fs } from 'fs';
import path from 'path';

let cachedDramas: Drama[] | null = null;

export async function getAllDramas(): Promise<Drama[]> {
  if (cachedDramas) return cachedDramas;

  // CSVファイルのパス (public/data/drama_database_v2.csv)
  const filePath = path.join(process.cwd(), 'public', 'data', 'drama_database_v2.csv');
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    // CSVのデータを型に合わせて整形
    cachedDramas = (data as any[]).map((row) => ({
      title: row.title || '',
      mood_text: row.mood_text || '',
      blog_url: row.blog_url || '',
      affiliate_link: row.affiliate_link || '',
      image_url: row.image_url || '',
    }));

    return cachedDramas || [];
  } catch (error) {
    console.error('CSV Read Error:', error);
    return [];
  }
}

export async function searchDramasByKeyword(keyword: string): Promise<Drama[]> {
  const dramas = await getAllDramas();
  const lowerKeyword = keyword.toLowerCase();
  
  // タイトルにキーワードが含まれるものを探す
  return dramas.filter(drama => 
    drama.title.toLowerCase().includes(lowerKeyword)
  );
}