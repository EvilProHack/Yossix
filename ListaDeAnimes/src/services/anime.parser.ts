import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnimeParser {
    parseTotalCount(html: string): number {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Based on LiveChart UI: "Completed (X)" and "Skipping (Y)" in the filter tabs
        // Selectors need to be precise. 
        // Searching for tabs that contain "Completed" or "Skipping"
        
        try {
            // LiveChart uses .tab-bordered or .tabs links for filters.
            // Let's look for text content directly as classes might change
            const links = Array.from(doc.querySelectorAll('a'));
            let total = 0;
            
            links.forEach(link => {
                const text = link.textContent || '';
                // Matches "Completed (152)" or "Skipping (10)"
                if (text.includes('Completed') || text.includes('Skipping')) {
                    const match = text.match(/\((\d+)\)/);
                    if (match && match[1]) {
                        console.log(`PARSER: Found count in "${text}": ${match[1]}`);
                        total += parseInt(match[1], 10);
                    }
                }
            });
            
            if (total === 0) {
                 // Fallback: check if we are on the "All" tab which might have a count
                 // Or maybe the user has 0. 
                 console.log('PARSER: No counts found in tabs. Might be parsing wrong elements.');
            }
            
            return total;
        } catch (e) {
            console.warn('PARSER: Failed to parse total count', e);
            return 0;
        }
    }

    parseSearchResult(html: string): any | null {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Find the first anime card in the results
        // LiveChart search results usually are in a list
        const firstAnime = doc.querySelector('.anime-list article.anime') || doc.querySelector('article.anime');
        
        if (!firstAnime) {
            console.log('PARSER: No anime found in search results.');
            return null;
        }
        
        const titleEl = firstAnime.querySelector('.main-title a');
        const imgEl = firstAnime.querySelector('.poster-container img');
        
        let imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
             imageUrl = 'https:' + imageUrl;
        }
        
        const link = titleEl?.getAttribute('href');
        
        return {
            title: titleEl?.textContent?.trim() || 'Unknown',
            url: link ? `https://www.livechart.me${link}` : '',
            image: imageUrl
        };
    }

    parseHtml(html: string): any[] {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Selector based on inspection: article with data-user-library-anime-id
        const animeElements = Array.from(doc.querySelectorAll('article[data-user-library-anime-id]'));
        
        return animeElements.map(el => {
          const titleEl = el.querySelector('[data-user-library-anime-target="preferredTitle"]');
          const imgEl = el.querySelector('img[data-user-library-anime-target="poster"]');
          const status = el.getAttribute('data-library-status') || 'unknown';
          const link = titleEl?.getAttribute('href');
          
          let imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
          if (imageUrl && !imageUrl.startsWith('http')) {
             imageUrl = 'https:' + imageUrl;
          }

          return {
            id: el.getAttribute('data-user-library-anime-id') || Math.random().toString(),
            title: titleEl?.textContent?.trim() || 'Unknown',
            url: link ? `https://www.livechart.me${link}` : '',
            image: imageUrl,
            status: status
          };
        });
    }
}
