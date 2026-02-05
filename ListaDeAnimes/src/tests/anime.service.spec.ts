import { describe, it, expect, vi } from 'vitest';
import { AnimeParser } from '../services/anime.parser';
import { AnimeFetcher } from '../services/anime.fetcher';
import { AnimeService } from '../services/anime.service';

// Mock content based on real HTML structure we observed
const MOCK_HTML_PAGE_1 = `
<!DOCTYPE html>
<html>
<body>
    <article class="card" data-user-library-anime-id="11291" data-library-status="completed">
        <div class="row-span-2">
            <img class="lc-aspect-poster" data-user-library-anime-target="poster" src="https://u.livechart.me/anime/11291/poster.jpg" />
        </div>
        <div class="pt-2">
            <a href="/anime/11291" data-user-library-anime-target="preferredTitle">Akiba Maid Sensou</a>
        </div>
    </article>
    <article class="card" data-user-library-anime-id="9831" data-library-status="skipping">
         <div class="row-span-2">
            <img class="lc-aspect-poster" data-user-library-anime-target="poster" src="https://u.livechart.me/anime/9831/poster.jpg" />
        </div>
        <div class="pt-2">
            <a href="/anime/9831" data-user-library-anime-target="preferredTitle">Akudama Drive</a>
        </div>
    </article>
</body>
</html>
`;

describe('AnimeParser', () => {
    it('should parse anime list from HTML string', () => {
        const parser = new AnimeParser();
        const result = parser.parseHtml(MOCK_HTML_PAGE_1);
        
        expect(result).toHaveLength(2);
        
        expect(result[0]).toEqual({
            id: '11291',
            title: 'Akiba Maid Sensou',
            url: 'https://www.livechart.me/anime/11291',
            image: 'https://u.livechart.me/anime/11291/poster.jpg',
            status: 'completed'
        });

        expect(result[1].status).toBe('skipping');
    });

    it('should handle empty HTML gracefully', () => {
        const parser = new AnimeParser();
        const result = parser.parseHtml('<html><body></body></html>');
        expect(result).toHaveLength(0);
    });
});

describe('AnimeService Integration', () => {
    it('should orchestrate fetching and parsing', async () => {
        // Mock dependencies
        const mockFetcher = {
            fetchPage: vi.fn().mockResolvedValue(MOCK_HTML_PAGE_1)
        } as unknown as AnimeFetcher;
        
        const parser = new AnimeParser(); // Real parser is fine here as it's pure logic
        
        const service = new AnimeService(mockFetcher, parser);
        
        // Mock fetcher to return null (end of pages) on second call
        mockFetcher.fetchPage = vi.fn()
            .mockResolvedValueOnce(MOCK_HTML_PAGE_1)
            .mockResolvedValueOnce(null);

        const animes = await service.fetchAllAnimes();
        
        expect(animes).toHaveLength(2);
        expect(mockFetcher.fetchPage).toHaveBeenCalledTimes(2);
    });
});
