import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnimeFetcher {
    private baseUrl = 'https://www.livechart.me/users/Yossix_world/library?layout=regular&sort=next_release_countdown&statuses%5B%5D=completed&statuses%5B%5D=skipping&titles=romaji&username=Yossix_World';

    async fetchPage(page: number): Promise<string | null> {
        const targetUrl = `${this.baseUrl}&page=${page}`;
        console.log(`FETCHER: Fetching page ${page}...`);

        // Strategy 1: CodeTabs (High success rate)
        try {
            console.log('FETCHER: Trying CodeTabs...');
            const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
            if (response.ok) {
                const text = await response.text();
                // Log snippet
                console.log(`FETCHER: CodeTabs received ${text.length} chars. Snippet: ${text.substring(0, 500)}`);
                if (this.isValidContent(text)) return text;
            }
        } catch (err) {
            console.log(`FETCHER: CodeTabs failed: ${err}`);
        }

        // Strategy 2: allorigins.win
        try {
            console.log('FETCHER: Trying AllOrigins...');
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.contents) {
                     console.log(`FETCHER: AllOrigins received ${data.contents.length} chars.`);
                     if (this.isValidContent(data.contents)) return data.contents;
                }
            }
        } catch (err) {
            console.log(`FETCHER: AllOrigins failed: ${err}`);
        }

        // Strategy 3: corsproxy.io
        try {
            console.log('FETCHER: Trying CorsProxy.io...');
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
            if (response.ok) {
                const text = await response.text();
                console.log(`FETCHER: CorsProxy received ${text.length} chars.`);
                if (this.isValidContent(text)) return text;
            }
        } catch (err) {
             console.log(`FETCHER: CorsProxy failed: ${err}`);
        }

        console.log(`FETCHER: All strategies failed for page ${page}`);
        return null;
    }

    private isValidContent(text: string): boolean {
        // Basic check for LiveChart HTML structure
        const valid = text.includes('LiveChart.me') || text.includes('data-user-library-anime-id') || text.includes('anime-list');
        if (!valid) console.log('FETCHER: Content validation failed');
        return valid;
    }

    async searchAnime(query: string): Promise<string | null> {
        const targetUrl = `https://www.livechart.me/search?q=${encodeURIComponent(query)}`;
        console.log(`FETCHER: Searching for "${query}"...`);

        // Strategy 1: CodeTabs
        try {
            console.log('FETCHER: Search via CodeTabs...');
            const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
            if (response.ok) {
                const text = await response.text();
                if (this.isValidContent(text)) return text;
            }
        } catch (err) {
            console.log(`FETCHER: CodeTabs search failed: ${err}`);
        }

        // Strategy 2: corsproxy.io
        try {
            console.log('FETCHER: Search via CorsProxy...');
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
            if (response.ok) {
                const text = await response.text();
                if (this.isValidContent(text)) return text;
            }
        } catch (err) {
             console.log(`FETCHER: CorsProxy search failed: ${err}`);
        }

        // Strategy 3: AllOrigins (usually JSON)
        try {
            console.log('FETCHER: Search via AllOrigins...');
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.contents && this.isValidContent(data.contents)) return data.contents;
            }
        } catch (err) {
            console.log(`FETCHER: AllOrigins search failed: ${err}`);
        }

        console.log(`FETCHER: Search failed for "${query}"`);
        return null;
    }
}
