import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimeFetcher } from '../services/anime.fetcher';

describe('AnimeFetcher', () => {
    let fetcher: AnimeFetcher;
    
    beforeEach(() => {
        fetcher = new AnimeFetcher();
        global.fetch = vi.fn();
    });

    it('should return content from allorigins if successful', async () => {
        const validHtml = '<div data-user-library-anime-id="1"></div>';
        const prefetchResponse = { ok: false };
        const directResponse = { ok: false, status: 500 };
        const mockResponse = {
            ok: true,
            json: vi.fn().mockResolvedValue({ contents: validHtml })
        };
        (global.fetch as any)
            .mockResolvedValueOnce(prefetchResponse)
            .mockResolvedValueOnce(directResponse)
            .mockResolvedValueOnce(mockResponse);

        const result = await fetcher.fetchPage(1);
        expect(result).toBe(validHtml);
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api.allorigins.win'));
    });

    it('should fallback to corsproxy if allorigins fails', async () => {
        // First call fails
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: false })
            // Direct fails
            .mockRejectedValueOnce(new Error('Network error'))
            // AllOrigins -> Direct fails
            .mockResolvedValueOnce({ ok: false, status: 500 })
            // AllOrigins -> GTranslate fails
            .mockResolvedValueOnce({ ok: false, status: 500 })
            // CorsProxy succeeds
            .mockResolvedValueOnce({
                ok: true,
                text: vi.fn().mockResolvedValue('<div data-user-library-anime-id="2"></div>')
            });

        const result = await fetcher.fetchPage(1);
        expect(result).toBe('<div data-user-library-anime-id="2"></div>');
        expect(global.fetch).toHaveBeenCalledTimes(5);
        expect(global.fetch).toHaveBeenNthCalledWith(5, expect.stringContaining('corsproxy.io'));
    });
});
