const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser launched successfully!');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to launch browser:', err);
    process.exit(1);
  }
})();
