import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnimeFetcher {
    private baseUrl = 'https://www.livechart.me/users/Yossix_world/library?layout=regular&sort=next_release_countdown&statuses%5B%5D=completed&statuses%5B%5D=skipping&titles=romaji&username=Yossix_World';

    async fetchPage(page: number): Promise<string | null> {
        console.log(`FETCHER: V3.1 - Direct First Strategy - Page ${page}`);
        const timestamp = Date.now();
        
        // Strategy -1: Try local JSON (Scraped by GitHub Actions)
        if (page === 1) {
            try {
                console.log('FETCHER: Trying pre-fetched data from /animes.json...');
                const jsonResponse = await fetch(`/animes.json?_cb=${timestamp}`);
                if (jsonResponse.ok) {
                    const jsonData = await jsonResponse.json();
                    if (Array.isArray(jsonData) && jsonData.length > 0) {
                        console.log(`FETCHER: Found pre-fetched data with ${jsonData.length} animes!`);
                        return JSON.stringify({ source: 'github_actions', data: jsonData });
                    }
                }
            } catch (e) {
                console.warn('FETCHER: Pre-fetched data check failed', e);
            }
        }

        const directUrl = `${this.baseUrl}&page=${page}&_cb=${timestamp}`;
        
        // Google Translate Subdomain URL
        const baseTranslateUrl = 'https://www-livechart-me.translate.goog/users/Yossix_world/library?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en&_x_tr_pto=wapp';
        const params = `&layout=regular&sort=next_release_countdown&statuses%5B%5D=completed&statuses%5B%5D=skipping&titles=romaji&username=Yossix_World&page=${page}&_cb=${timestamp}`;
        const translateUrl = `${baseTranslateUrl}${params}`;
        
        const strategies = [
            // Strategy 0: Direct (User requested - usually blocked by CORS unless user has extension)
            { 
                name: 'Direct (No Proxy)', 
                url: () => directUrl,
                type: 'text'
            },
            // Strategy 1: AllOrigins (JSON) -> Direct (Standard)
            { 
                name: 'AllOrigins -> Direct', 
                url: () => `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`,
                type: 'json'
            },
             // Strategy 2: AllOrigins (JSON) -> GTranslate (Bypass Cloudflare via Google)
            { 
                name: 'AllOrigins -> GTranslate', 
                url: () => `https://api.allorigins.win/get?url=${encodeURIComponent(translateUrl)}`,
                type: 'json'
            },
            // Strategy 3: CorsProxy.io -> Direct
            { 
                name: 'CorsProxy.io -> Direct', 
                url: () => `https://corsproxy.io/?${encodeURIComponent(directUrl)}`,
                type: 'text'
            },
            // Strategy 4: CodeTabs -> Direct
            { 
                name: 'CodeTabs -> Direct', 
                url: () => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`,
                type: 'text'
            }
        ];

        for (const strategy of strategies) {
            try {
                console.log(`FETCHER: Trying ${strategy.name}...`);
                const response = await fetch(strategy.url());
                
                if (!response.ok) {
                    console.warn(`FETCHER: ${strategy.name} failed with status ${response.status}`);
                    continue;
                }

                let text = '';
                if (strategy.type === 'json') {
                    const data = await response.json();
                    text = data.contents || '';
                } else {
                    text = await response.text();
                }

                if (!text) {
                    console.warn(`FETCHER: ${strategy.name} returned empty text.`);
                    continue;
                }

                if (this.isValidContent(text)) {
                    console.log(`FETCHER: Success via ${strategy.name}. Received ${text.length} chars.`);
                    return text;
                } else {
                    console.warn(`FETCHER: ${strategy.name} returned invalid content (Length: ${text.length}).`);
                }
            } catch (err) {
                console.warn(`FETCHER: ${strategy.name} error:`, err);
            }
            // Small delay to be polite
            await new Promise(r => setTimeout(r, 1000));
        }

        console.error(`FETCHER: All strategies failed for page ${page}`);
        return null;
    }

    private isValidContent(text: string): boolean {
        // Must contain anime data attributes
        // Google translate might wrap it, but the attribute should still be there.
        // It might be URL encoded or slightly modified, but usually intact.
        
        // Also check if it's the Cloudflare challenge page
        if (text.includes('Just a moment...') || text.includes('Enable JavaScript and cookies')) {
            console.log('FETCHER: Validation failed - Cloudflare Challenge detected');
            return false;
        }

        const valid = text.includes('data-user-library-anime-id');
        if (!valid) console.log('FETCHER: Validation failed - content missing data-user-library-anime-id');
        return valid;
    }

    async searchAnime(query: string): Promise<string | null> {
        // Simplified search logic reusing valid proxies implicitly if we extracted them
        // But for now, let's just stick to one reliable one for search
        const targetUrl = `https://www.livechart.me/search?q=${encodeURIComponent(query)}`;
        console.log(`FETCHER: Searching for "${query}"...`);
        
        try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.contents) return data.contents;
            }
        } catch (e) {
            console.error('Search fetch failed', e);
        }
        return null;
    }
}