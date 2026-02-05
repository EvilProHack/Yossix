import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimeFetcher } from '../services/anime.fetcher';

describe('AnimeFetcher', () => {
    let fetcher: AnimeFetcher;
    
    beforeEach(() => {
        fetcher = new AnimeFetcher();
        global.fetch = vi.fn();
    });

    it('should return content from allorigins if successful', async () => {
        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue({ contents: '<html></html>' })
        };
        (global.fetch as any).mockResolvedValueOnce(mockResponse);

        const result = await fetcher.fetchPage(1);
        expect(result).toBe('<html></html>');
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api.allorigins.win'));
    });

    it('should fallback to corsproxy if allorigins fails', async () => {
        // First call fails
        (global.fetch as any)
            .mockRejectedValueOnce(new Error('Network error'))
            // Second call succeeds
            .mockResolvedValueOnce({
                ok: true,
                text: vi.fn().mockResolvedValue('<html>Fallback</html>')
            });

        const result = await fetcher.fetchPage(1);
        expect(result).toBe('<html>Fallback</html>');
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('corsproxy.io'));
    });
});
