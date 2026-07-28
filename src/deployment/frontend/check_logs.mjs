import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  try {
    await page.goto('http://localhost:5173/#admin', { waitUntil: 'networkidle', timeout: 5000 });
  } catch(e) {
    console.log('Timeout or error:', e.message);
  }
  
  await browser.close();
})();
