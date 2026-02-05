const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  console.log('Navigating to home...');
  await page.goto('https://yossixthemes.web.app', { waitUntil: 'networkidle2' });

  console.log('Waiting for cards...');
  await page.waitForSelector('.theme-card', { timeout: 10000 });
  
  console.log('Clicking theme...');
  await page.click('.theme-card');

  console.log('Waiting for URL change or player...');
  // Wait for app-video-player to exist in DOM
  await page.waitForSelector('app-video-player', { timeout: 10000 });
  
  console.log(`Current URL: ${page.url()}`);

  // Give it a moment to load source
  await new Promise(r => setTimeout(r, 3000));

  const hasIframe = await page.$('iframe');
  const hasVideo = await page.$('video');
  
  console.log(`Has Iframe: ${!!hasIframe}, Has Video: ${!!hasVideo}`);

  if (hasIframe) {
      const src = await page.$eval('iframe', el => el.src);
      console.log(`IFRAME SRC: ${src}`);
  } else if (hasVideo) {
      const src = await page.$eval('video', el => el.src);
      console.log(`VIDEO SRC: ${src}`);
  }

  await browser.close();
})();