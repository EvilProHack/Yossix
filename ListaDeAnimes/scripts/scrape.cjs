const puppeteerCore = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting Pagination Scraper...');
    
    let browser;
    try {
        const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
        
        let launchOptions = {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };

        if (isGithubActions) {
            launchOptions.executablePath = '/usr/bin/google-chrome';
        }

        try {
            const p = require('puppeteer');
            console.log('Using puppeteer (full)...');
            browser = await p.launch(launchOptions);
        } catch (e) {
            console.log('Puppeteer full not found or failed, trying core...');
            browser = await puppeteerCore.launch(launchOptions);
        }

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Base URL without page param
        const baseUrl = 'https://www.livechart.me/users/Yossix_world/library?layout=regular&sort=next_release_countdown&statuses%5B%5D=completed&statuses%5B%5D=skipping&titles=romaji&username=Yossix_World';
        const minCountRaw = process.env.MIN_ANIME_COUNT || '500';
        const minCountParsed = Number.parseInt(minCountRaw, 10);
        const minCount = Number.isFinite(minCountParsed) ? minCountParsed : 500;
        
        let allAnimes = [];
        let currentPage = 1;
        let hasNextPage = true;
        const MAX_PAGES = 30; // Safety limit

        // Loop through pages
        while (hasNextPage && currentPage <= MAX_PAGES) {
            const pageUrl = `${baseUrl}&page=${currentPage}`;
            console.log(`Navigating to Page ${currentPage}...`);
            
            await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 90000 });
            
            // Auto-scroll logic (needed for lazy loaded images even on paginated views)
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 400;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if(totalHeight >= scrollHeight){
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
            
            // Wait for lazy load
            await new Promise(r => setTimeout(r, 2000));

            // Extract animes from current page
            const pageAnimes = await page.evaluate(() => {
                const results = [];
                const cards = document.querySelectorAll('article[data-user-library-anime-id], .anime-card, .lc-anime-card');
                
                cards.forEach(card => {
                    const id = card.getAttribute('data-user-library-anime-id');
                    if (!id) return;

                    const titleEl = card.querySelector('[data-user-library-anime-target="preferredTitle"], .anime-title a');
                    const imgEl = card.querySelector('img[data-user-library-anime-target="poster"], .poster-image img');
                    const status = card.getAttribute('data-library-status') || 'unknown';
                    
                    let title = card.getAttribute('data-user-library-anime-title') || titleEl?.innerText?.trim() || 'Unknown Title';
                    let image = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
                    
                    if (image && !image.startsWith('http')) {
                        if (image.startsWith('//')) {
                            image = 'https:' + image;
                        } else {
                            image = 'https://www.livechart.me' + image;
                        }
                    }
                    
                    results.push({
                        id,
                        title,
                        url: `https://www.livechart.me/anime/${id}`,
                        image,
                        status
                    });
                });
                return results;
            });

            if (pageAnimes.length === 0) {
                console.log(`Page ${currentPage} returned 0 items. Stopping pagination.`);
                hasNextPage = false;
            } else {
                console.log(`Page ${currentPage} found ${pageAnimes.length} animes.`);
                allAnimes = [...allAnimes, ...pageAnimes];
                currentPage++;
                
                // Add delay to be polite
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        console.log(`Total Scraped: ${allAnimes.length} animes.`);

        // Deduplication Logic
        const uniqueAnimes = [];
        const seenIds = new Set();
        allAnimes.forEach(anime => {
            if (!seenIds.has(anime.id)) {
                seenIds.add(anime.id);
                uniqueAnimes.push(anime);
            }
        });
        console.log(`Unique Animes: ${uniqueAnimes.length} (removed ${allAnimes.length - uniqueAnimes.length} duplicates)`);

        const publicDir = path.join(__dirname, '../public');
        const outputPath = path.join(publicDir, 'animes.json');

        if (uniqueAnimes.length < minCount) {
            console.error(`Scrape too small (${uniqueAnimes.length}). Expected at least ${minCount}.`);
            if (fs.existsSync(outputPath)) {
                console.error('Keeping existing animes.json to avoid deploying empty data.');
            } else {
                console.error('No existing animes.json found to preserve.');
            }
            process.exit(2);
        }

        // Ensure public directory exists
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        fs.writeFileSync(outputPath, JSON.stringify(uniqueAnimes, null, 2));
        console.log(`Data saved to ${outputPath}`);
        
    } catch (error) {
        console.error('Scraping Error:', error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        console.log('Browser closed.');
    }
})();
