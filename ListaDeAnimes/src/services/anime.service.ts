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
    const { animes: rouletteAnimes, missing } = this.getRouletteAnimesImmediate();
    
    // 3. Hydrate missing images in background if any
    if (missing.length > 0) {
        this.hydrateRouletteImages(missing);
    }

    // 4. Merge
    const combined = [...libraryAnimes, ...rouletteAnimes];
    this.log(`Total combined animes: ${combined.length}`);
    
    return combined;
  }

  private getRouletteAnimesImmediate(): { animes: Anime[], missing: any[] } {
      this.log('Loading Roulette Animes from cache...');
      const activeItems = ROULETTE_DATA.disks[0].items.filter(item => item.active);
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
    this.log('Starting Force Update...');
    let allAnimes: Anime[] = [];
    let page = 1;
    let hasMore = true;
    let totalCount = 0;

    // Hard limit to 20 pages for safety during debug
    while (hasMore && page <= 20) {
      this.log(`Fetching page ${page}...`);
      const html = await this.fetcher.fetchPage(page);
      
      if (!html) {
          this.log(`ERROR: Page ${page} returned null HTML.`);
          break;
      }
      
      this.log(`Page ${page} received ${html.length} chars.`);

      if (page === 1) {
         totalCount = this.parser.parseTotalCount(html);
         this.log(`Parsed total count: ${totalCount}`);
      }

      const pageAnimes = this.parser.parseHtml(html);
      this.log(`Parsed ${pageAnimes.length} animes from page ${page}.`);
      
      if (pageAnimes.length === 0) {
        hasMore = false;
        this.log('Stopping: No animes found on this page.');
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
            totalCount: totalCount > 0 ? totalCount : uniqueAnimes.length,
            timestamp: Date.now()
        }));
    }

    return uniqueAnimes;
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
