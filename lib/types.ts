export interface Drama {
  title: string;
  mood_text: string;
  blog_url: string;
  affiliate_link?: string;
  image_url?: string;
}

export interface DramaRecommendation {
  drama: Drama;
  reason: string;
}

export type SearchResult = {
  type: 'search' | 'ai';
  items: DramaRecommendation[];
};