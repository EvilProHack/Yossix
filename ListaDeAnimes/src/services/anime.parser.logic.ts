export interface ParsedAnime {
    id: string;
    title: string;
    url: string;
    image: string;
    status: string;
}

export class AnimeParserLogic {
    parseTotalCount(html: string): number {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        try {
            let total = 0;
            const completedBtn = doc.querySelector('a[data-library-status="completed"][title="Completed"]');
            const skippingBtn = doc.querySelector('a[data-library-status="skipping"][title="Skipping"]');
            
            if (completedBtn) {
                 const txt = completedBtn.textContent?.trim().match(/(\d+)/);
                 if (txt) total += parseInt(txt[1], 10);
            }
            if (skippingBtn) {
                 const txt = skippingBtn.textContent?.trim().match(/(\d+)/);
                 if (txt) total += parseInt(txt[1], 10);
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
        
        const firstAnime = doc.querySelector('.anime-list article.anime') || doc.querySelector('article.anime');
        
        if (!firstAnime) {
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
        // Handle pre-fetched JSON from GitHub Actions
        if (html.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(html);
                if (parsed.source === 'github_actions' && Array.isArray(parsed.data)) {
                    console.log(`PARSER: Using pre-fetched data (${parsed.data.length} items)`);
                    return parsed.data;
                }
            } catch (e) {
                // Not JSON or not our JSON, continue to HTML parsing
            }
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        let animeElements = Array.from(doc.querySelectorAll('article[data-user-library-anime-id]'));

        if (animeElements.length === 0) {
            animeElements = Array.from(doc.querySelectorAll('*[data-user-library-anime-id]'));
        }
        
        return animeElements.map(el => {
          const id = el.getAttribute('data-user-library-anime-id');
          if (!id) return null; // Should not happen due to selector

          const titleEl = el.querySelector('[data-user-library-anime-target="preferredTitle"]');
          const imgEl = el.querySelector('img[data-user-library-anime-target="poster"]');
          const status = el.getAttribute('data-library-status') || 'unknown';
          
          // Use data attribute for title if available (cleaner), otherwise fallback to text
          let title = el.getAttribute('data-user-library-anime-title') || 
                      titleEl?.textContent?.trim() || 
                      'Unknown';
          
          let imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
          
          // Handle Google Translate image wrapping
          // Sometimes src points to googleusercontent or similar. 
          // If we can find the original URL in srcset or another attribute, great.
          // But usually src is enough if it loads.
          
          if (imageUrl && !imageUrl.startsWith('http')) {
             if (imageUrl.startsWith('//')) {
                 imageUrl = 'https:' + imageUrl;
             } else {
                 imageUrl = 'https://www.livechart.me' + imageUrl; 
             }
          }

          // Construct clean URL from ID to avoid Google Translate junk
          const url = `https://www.livechart.me/anime/${id}`;
          
          return {
            id: id,
            title: title,
            url: url,
            image: imageUrl,
            status: status
          };
        })
        .filter((a): a is ParsedAnime => a !== null && a.title !== 'Unknown');
    }
}
