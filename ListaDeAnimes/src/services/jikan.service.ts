import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JikanService {
  private baseUrl = 'https://api.jikan.moe/v4/anime';

  async searchAnime(query: string): Promise<{ success: boolean, data?: { title: string, image: string, url: string }, error?: string }> {
    try {
      // Jikan has rate limits (3 requests/second). 
      const url = `${this.baseUrl}?q=${encodeURIComponent(query)}&limit=1`;
      const response = await fetch(url);
      
      if (response.status === 429) {
          console.warn('Jikan API rate limit reached.');
          return { success: false, error: 'rate_limit' };
      }

      if (!response.ok) return { success: false, error: `http_${response.status}` };

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const anime = data.data[0];
        return {
            success: true,
            data: {
                title: anime.title,
                image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
                url: anime.url
            }
        };
      }
      
      return { success: false, error: 'not_found' };
    } catch (e) {
      console.error('Jikan API error:', e);
      return { success: false, error: 'exception' };
    }
  }

  async getAnimeByUser(username: string, status: 'completed' | 'dropped'): Promise<any[]> {
    let allAnimes: any[] = [];
    let page = 1;
    let hasMore = true;

    // Jikan pagination loop
    while (hasMore) {
        // Status mapping: Jikan uses 'completed', 'dropped'
        // Jikan v4 uses query params: /users/{username}/animelist?status={status}&page={page}
        const url = `https://api.jikan.moe/v4/users/${username}/animelist?status=${status}&page=${page}`;
        console.log(`JIKAN: Fetching user list page ${page} for status ${status}...`);
        
        try {
            const response = await fetch(url);
            
            if (response.status === 429) {
                console.warn('Jikan API rate limit reached. Waiting...');
                await new Promise(r => setTimeout(r, 2000));
                continue; // Retry same page
            }
            
            if (!response.ok) break;

            const data = await response.json();
            const animes = data.data || [];
            
            if (animes.length === 0) {
                hasMore = false;
            } else {
                allAnimes = [...allAnimes, ...animes];
                page++;
                // Gentle delay to avoid rate limits
                await new Promise(r => setTimeout(r, 500));
            }
        } catch (e) {
            console.error('Jikan fetch error:', e);
            break;
        }
    }
    return allAnimes;
  }
}
