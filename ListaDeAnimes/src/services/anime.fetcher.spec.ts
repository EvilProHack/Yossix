import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnimeFetcher } from './anime.fetcher';

describe('AnimeFetcher', () => {
    let fetcher: AnimeFetcher;
    
    // Valid HTML snippet that passes isValidContent check
    const VALID_HTML = '<div data-user-library-anime-id="123">Some Anime</div>';
    const INVALID_HTML = '<html><body>Just a moment...</body></html>';

    beforeEach(() => {
        fetcher = new AnimeFetcher();
        // Mock global fetch
        global.fetch = vi.fn();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should return content immediately if Direct strategy succeeds', async () => {
        // Prefetch check fails, then Direct succeeds
        (global.fetch as any).mockResolvedValueOnce({ ok: false });
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: () => Promise.resolve(VALID_HTML)
        });

        const result = await fetcher.fetchPage(1);
        
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result).toBe(VALID_HTML);
        // Verify it called the direct URL
        expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('livechart.me/users/Yossix_world'));
    });

    it('should retry with next strategy if first one fails (Network Error)', async () => {
        // Prefetch fails
        (global.fetch as any).mockResolvedValueOnce({ ok: false });
        // Direct fails (Network error / CORS)
        (global.fetch as any).mockRejectedValueOnce(new Error('CORS blocked'));
        
        // Second call succeeds (AllOrigins -> Direct)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ contents: VALID_HTML })
        });

        const promise = fetcher.fetchPage(1);
        
        // Fast-forward time for the first retry delay
        await vi.advanceTimersByTimeAsync(1100);
        
        const result = await promise;
        
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(result).toBe(VALID_HTML);
    });

    it('should retry if content is invalid (Cloudflare Challenge)', async () => {
        // Prefetch fails
        (global.fetch as any).mockResolvedValueOnce({ ok: false });
        // Direct returns 200 but is Cloudflare challenge
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: () => Promise.resolve(INVALID_HTML)
        });

        // Second call succeeds
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ contents: VALID_HTML })
        });

        const promise = fetcher.fetchPage(1);
        
        // Fast-forward time for the first retry delay
        await vi.advanceTimersByTimeAsync(1100);

        const result = await promise;
        
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(result).toBe(VALID_HTML);
    });

    it('should return null if all strategies fail', async () => {
        // Prefetch fails then all strategies fail
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: false })
            .mockRejectedValue(new Error('Failed'));

        const promise = fetcher.fetchPage(1);
        
        // Fast-forward time for all 5 strategies (which means 5 delays)
        for (let i = 0; i < 5; i++) {
            await vi.advanceTimersByTimeAsync(1100);
        }
        
        const result = await promise;
        
        expect(result).toBeNull();
        expect(global.fetch).toHaveBeenCalledTimes(6);
    });
});
