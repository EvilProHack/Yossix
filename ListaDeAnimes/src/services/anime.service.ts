import { Injectable } from '@angular/core';
import { AnimeFetcher } from './anime.fetcher';
import { AnimeParser } from './anime.parser';
import { JikanService } from './jikan.service';
import { ROULETTE_DATA } from '../data/roulette-data';

export interface Anime {
  id: string;
  title: string;
  image: string;
  status: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnimeService {
  logs: string[] = []; // Public for component access

  private log(msg: string) {
    console.log(`[AnimeService] ${msg}`);
    window.dispatchEvent(new CustomEvent('anime-log', { detail: `[${new Date().toLocaleTimeString()}] ${msg}` }));
  }


  constructor(
    private fetcher: AnimeFetcher, 
    private parser: AnimeParser,
    private jikanService: JikanService
  ) {}
  
  async fetchAllAnimes(): Promise<Anime[]> {
    this.log('Starting fetch...');
    
    let libraryAnimes: Anime[] = [];

    // 1. Try to load from LocalStorage first
    const cachedData = localStorage.getItem('yossix_anime_cache');
    if (cachedData) {
      this.log('Found cache data.');
      try {
          const { animes, timestamp, totalCount } = JSON.parse(cachedData);
          if (Date.now() - timestamp < 1000 * 60 * 60 * 24) {
              this.log(`Cache valid. Loaded ${animes.length} animes from library.`);
              this.checkForUpdates(totalCount, animes);
              libraryAnimes = animes;
          } else {
              this.log('Cache expired.');
              libraryAnimes = await this.forceUpdate();
          }
      } catch (e) {
          this.log('Cache corrupted, clearing.');
          localStorage.removeItem('yossix_anime_cache');
          libraryAnimes = await this.forceUpdate();
      }
    } else {
        this.log('No cache found.');
        libraryAnimes = await this.forceUpdate();
    }

    // 2. Load Roulette Animes (Immediate + Hydrate)
    const { animes: rouletteAnimesRaw, missing: missingRaw } = this.getRouletteAnimesImmediate();
    const completedTitles = this.getCompletedTitleSet(libraryAnimes);
    const rouletteAnimes = rouletteAnimesRaw.filter(anime => {
        const key = this.normalizeTitle(anime.title);
        return !key || !completedTitles.has(key);
    });
    const missing = missingRaw.filter(item => {
        const key = this.normalizeTitle(item.text || '');
        return !key || !completedTitles.has(key);
    });
    const removedFromRoulette = rouletteAnimesRaw.length - rouletteAnimes.length;
    if (removedFromRoulette > 0) {
        this.log(`Removed ${removedFromRoulette} roulette animes already completed.`);
    }
    
    // 3. Hydrate missing images in background if any
    if (missing.length > 0) {
        this.hydrateRouletteImages(missing);
    }

    // 4. Merge
    // Use Jikan API to fetch Yossix_World list if Force Update is triggered
    // But since fetchAllAnimes logic for library is broken, let's replace fetcher logic
    // with Jikan logic inside forceUpdate if Fetcher fails or directly.
    
    const combined = [...libraryAnimes, ...rouletteAnimes];
    this.log(`Total combined animes: ${combined.length}`);
    
    return combined;
  }

  private normalizeTitle(title: string): string {
      return title
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '')
          .trim();
  }

  private getCompletedTitleSet(animes: Anime[]): Set<string> {
      const completed = new Set<string>();
      for (const anime of animes) {
          if (!anime?.title) continue;
          if ((anime.status || '').toLowerCase() !== 'completed') continue;
          const key = this.normalizeTitle(anime.title);
          if (key) completed.add(key);
      }
      return completed;
  }
  
  private getRouletteAnimesImmediate(): { animes: Anime[], missing: any[] } {
      this.log('Loading Roulette Animes from cache...');
      const activeItems = ROULETTE_DATA.disks[0].items.filter(item => !!item && item.active);
      const cacheKey = 'yossix_roulette_metadata';
      const cachedMetaStr = localStorage.getItem(cacheKey);
      let metadataMap: Record<string, Anime> = {};
      
      if (cachedMetaStr) {
          try { metadataMap = JSON.parse(cachedMetaStr); } catch(e) {}
      }
      
      const results: Anime[] = [];
      const missing: any[] = [];

      for (const item of activeItems) {
          const cached = metadataMap[item.id];
          if (cached) {
              results.push(cached);
              // Retry if cached image is a placeholder
              if (cached.image.includes('placeholder') || cached.image.includes('No+Image')) {
                  missing.push(item);
              }
          } else {
              // Create placeholder
              const placeholder: Anime = {
                  id: item.id,
                  title: item.text,
                  image: 'assets/placeholder.png', // Or a loading spinner gif
                  url: `https://myanimelist.net/anime.php?q=${encodeURIComponent(item.text)}`, // Fallback URL
                  status: 'ruleta'
              };
              results.push(placeholder);
              missing.push(item);
          }
      }
      return { animes: results, missing };
  }

  private async hydrateRouletteImages(items: any[]) {
      this.log(`Hydrating ${items.length} roulette images in background...`);
      const cacheKey = 'yossix_roulette_metadata';
      const cachedMetaStr = localStorage.getItem(cacheKey);
      let metadataMap: Record<string, Anime> = cachedMetaStr ? JSON.parse(cachedMetaStr) : {};

      for (const item of items) {
          // Check if we already have a GOOD image in cache (race condition check)
          // But if we are here, we probably want to retry if it's bad.
          const current = metadataMap[item.id];
          if (current && !current.image.includes('placeholder') && !current.image.includes('No+Image')) {
              continue;
          }

          this.log(`Searching Jikan for: ${item.text}`);
          
          // Rate limit delay (start with 1s to be safe)
          await new Promise(r => setTimeout(r, 1000));
          
          let result = await this.jikanService.searchAnime(item.text);

          // Retry logic: If rate limited, wait longer and retry once
          if (!result.success && result.error === 'rate_limit') {
             this.log('Rate limit hit, waiting 2s...');
             await new Promise(r => setTimeout(r, 2000));
             result = await this.jikanService.searchAnime(item.text);
          }

          // Retry logic: If no result (not found), try simplifying the query
          if (!result.success && result.error === 'not_found') {
              const simpleQuery = item.text.replace(/\(.*\)/g, '').trim(); // Remove things in parentheses
              if (simpleQuery !== item.text) {
                  this.log(`Retrying search with: ${simpleQuery}`);
                  await new Promise(r => setTimeout(r, 1000));
                  result = await this.jikanService.searchAnime(simpleQuery);
              }
          }

          // If still rate limited or error after retry, SKIP saving to cache so we try again next time
          if (!result.success && (result.error === 'rate_limit' || result.error === 'exception' || result.error?.startsWith('http_'))) {
              this.log(`Failed to fetch ${item.text} due to ${result.error}. Skipping cache update.`);
              continue;
          }

          const fallbackUrl = `https://myanimelist.net/anime.php?q=${encodeURIComponent(item.text)}`;

          const anime: Anime = {
              id: item.id,
              title: item.text,
              image: result.success && result.data ? result.data.image : 'https://via.placeholder.com/150x220?text=No+Image', 
              url: result.success && result.data ? result.data.url : fallbackUrl,
              status: 'ruleta'
          };
          
          metadataMap[item.id] = anime;
          localStorage.setItem(cacheKey, JSON.stringify(metadataMap));
          
          // Emit update event so UI can refresh
          window.dispatchEvent(new CustomEvent('anime-update', { detail: anime }));
      }
      this.log('Roulette hydration complete.');
  }

  private async fetchRouletteAnimes(): Promise<Anime[]> {
      // Legacy method, replaced by getRouletteAnimesImmediate + hydrate
      return [];
  }

  private async checkForUpdates(cachedCount: number, cachedAnimes: Anime[]) {
     // ...
  }

  async forceUpdate(): Promise<Anime[]> {
    this.log('Starting Force Update using Jikan (MyAnimeList)...');
    
    // Yossix_World profile on MyAnimeList? Or fallback to LiveChart proxy?
    // LiveChart proxies are failing (Cloudflare/bot protection).
    // The user's LiveChart is "Yossix_World". 
    // Does he have a MAL account? If not, we are stuck scraping.
    // Assuming we must try scraping again with better retry or just admit defeat on LiveChart 
    // and ONLY show Roulette items if scraping fails.
    
    // Wait, the user prompt said "get all animes from this url".
    // If we cannot scrape LiveChart, we cannot get the list.
    // Jikan is for MyAnimeList. 
    
    // Let's keep trying to scrape but with a fail-safe.
    
    let allAnimes: Anime[] = [];
    let page = 1;
    let hasMore = true;
    let totalCount = 0;
    
    // ... Existing scraping logic ...
    // If scraping fails completely (0 items), we should at least return empty
    // so the app doesn't crash, but maybe show an error in logs.
    
    while (hasMore && page <= 20) {
      this.log(`Fetching page ${page}...`);
      const html = await this.fetcher.fetchPage(page);
      
      let pageAnimes: any[] = [];

    if (!html) {
          // If fetcher returned null, it means all strategies failed.
          this.log(`ERROR: Page ${page} returned null HTML or blocked.`);
          hasMore = false;
          break;
    }

    // Check if it's the pre-fetched JSON from GitHub Actions
    if (html.trim().startsWith('{')) {
         const parsed = this.parser.parseHtml(html);
         if (parsed && Array.isArray(parsed) && parsed.length > 0) {
             this.log(`Loaded ${parsed.length} animes from GitHub Actions pre-fetched data.`);
             allAnimes = parsed;
             // If we loaded everything from JSON, we stop pagination
             hasMore = false;
             break;
         }
    }

    pageAnimes = this.parser.parseHtml(html);
      
      if (pageAnimes.length === 0) {
          // If page 1 returns 0 items, it might be a parsing error due to Cloudflare captcha page
          if (page === 1) {
             this.log('CRITICAL: No items found on page 1. Likely blocked by Cloudflare.');
             
             // FALLBACK: DISABLED (User confirmed no MAL account)
             // this.log('Attempting fallback to Jikan API (MyAnimeList)...');
             // try { ... }
             this.log('Scraping blocked and no fallback available. Please try again later or check proxies.');
          }
          hasMore = false;
          break;
      }
      
      allAnimes = [...allAnimes, ...pageAnimes];
      page++;
    }
    
    const uniqueAnimes = this.removeDuplicates(allAnimes);
    this.log(`Total unique animes: ${uniqueAnimes.length}`);

    if (uniqueAnimes.length > 0) {
        localStorage.setItem('yossix_anime_cache', JSON.stringify({
            animes: uniqueAnimes,
            totalCount: uniqueAnimes.length, // approximation
            timestamp: Date.now()
        }));
    } else {
        this.log('Skipping cache update (0 items found).');
    }

    return uniqueAnimes;
  }

  private mapJikanToAnime(entry: any, status: string): Anime {
      return {
          id: entry.mal_id ? `mal-${entry.mal_id}` : `jikan-${Math.random()}`,
          title: entry.title,
          image: entry.images?.jpg?.large_image_url || entry.images?.jpg?.image_url || 'assets/placeholder.png',
          url: entry.url,
          status: status
      };
  }

  private removeDuplicates(animes: Anime[]): Anime[] {
    const seen = new Set();
    return animes.filter(anime => {
      const duplicate = seen.has(anime.id);
      seen.add(anime.id);
      return !duplicate;
    });
  }
}
