// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { AnimeParser } from '../services/anime.parser';
import { AnimeFetcher } from '../services/anime.fetcher';
import { AnimeService } from '../services/anime.service';
import { JikanService } from '../services/jikan.service';

vi.mock('../data/roulette-data', () => ({
    ROULETTE_DATA: {
        disks: [
            {
                items: [
                    { active: true, text: 'Akiba Maid Sensou', id: 'r1' },
                    { active: true, text: 'Some Other Anime', id: 'r2' }
                ]
            }
        ]
    }
}));


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
        
        const mockJikan = {
            searchAnime: vi.fn()
        } as unknown as JikanService;

        localStorage.clear();
        localStorage.setItem('yossix_roulette_metadata', JSON.stringify({
            r1: {
                id: 'r1',
                title: 'Akiba Maid Sensou',
                image: 'https://example.com/a.jpg',
                url: 'https://example.com/a',
                status: 'ruleta'
            },
            r2: {
                id: 'r2',
                title: 'Some Other Anime',
                image: 'https://example.com/b.jpg',
                url: 'https://example.com/b',
                status: 'ruleta'
            }
        }));

        const service = new AnimeService(mockFetcher, parser, mockJikan);
        
        // Mock fetcher to return null (end of pages) on second call
        mockFetcher.fetchPage = vi.fn()
            .mockResolvedValueOnce(MOCK_HTML_PAGE_1)
            .mockResolvedValueOnce(null);

        const animes = await service.fetchAllAnimes();
        
        expect(animes).toHaveLength(3);
        expect(animes.filter(anime => anime.title === 'Akiba Maid Sensou')).toHaveLength(1);
        expect(animes.some(anime => anime.title === 'Some Other Anime' && anime.status === 'ruleta')).toBe(true);
        expect(mockFetcher.fetchPage).toHaveBeenCalledTimes(2);
    });
});
