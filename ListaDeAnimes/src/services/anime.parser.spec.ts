import { describe, it, expect } from 'vitest';
import { AnimeParserLogic } from './anime.parser.logic';

// Mock DOMParser since we run in Node
import { JSDOM } from 'jsdom';
global.DOMParser = new JSDOM().window.DOMParser;

describe('AnimeParser', () => {
    const parser = new AnimeParserLogic();

    it('should parse anime list correctly from LiveChart HTML', () => {
        const mockHtml = `
        <!DOCTYPE html>
        <html>
        <body>
            <div class="grid lc-grid-template-small-anime-cards gap-4">
                <article class="card overflow-hidden bg-base-300 shadow-md lc-bg-current-mark-bg pr-2" 
                    data-controller="user-library-anime" 
                    data-user-library-anime-id="13118" 
                    data-user-library-anime-title="Ao no Hako 2nd Season" 
                    data-library-status="skipping">
                    <div class="grid lc-small-anime-card-content-grid">
                        <div class="row-span-2 mr-4 relative overflow-hidden text-white">
                            <img alt="Ao no Hako 2nd Season" 
                                class="lc-aspect-poster overflow-hidden" 
                                data-user-library-anime-target="poster" 
                                src="https://u.livechart.me/anime/13118/poster_image/small.jpg" />
                        </div>
                        <div class="pt-2">
                            <div class="line-clamp-2">
                                <a class="link link-hover font-medium" 
                                   href="/anime/13118" 
                                   title="Ao no Hako 2nd Season" 
                                   data-user-library-anime-target="preferredTitle">Ao no Hako 2nd Season</a>
                            </div>
                        </div>
                    </div>
                </article>
                
                <!-- Another one with relative image path -->
                <article class="card" 
                    data-user-library-anime-id="999" 
                    data-library-status="completed">
                     <div class="grid">
                        <div><img data-user-library-anime-target="poster" src="//u.livechart.me/anime/999.jpg"></div>
                        <div><a href="/anime/999" data-user-library-anime-target="preferredTitle">Another Anime</a></div>
                     </div>
                </article>
            </div>
            
            <!-- Filter counts -->
            <a data-library-status="completed" title="Completed">
                <div></div> 10
            </a>
            <a data-library-status="skipping" title="Skipping">
                <div></div> 5
            </a>
        </body>
        </html>
        `;

        const result = parser.parseHtml(mockHtml);
        
        expect(result).toHaveLength(2);
        
        expect(result[0]).toEqual({
            id: '13118',
            title: 'Ao no Hako 2nd Season',
            url: 'https://www.livechart.me/anime/13118',
            image: 'https://u.livechart.me/anime/13118/poster_image/small.jpg',
            status: 'skipping'
        });

        expect(result[1]).toEqual({
            id: '999',
            title: 'Another Anime',
            url: 'https://www.livechart.me/anime/999',
            image: 'https://u.livechart.me/anime/999.jpg',
            status: 'completed'
        });
        
        const count = parser.parseTotalCount(mockHtml);
        expect(count).toBe(15); // 10 + 5
    });

    it('should return empty array for invalid HTML', () => {
        const result = parser.parseHtml('<html><body>No items here</body></html>');
        expect(result).toHaveLength(0);
    });
});
