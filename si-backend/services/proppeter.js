// linkedinEvents.js
import puppeteer from 'puppeteer';

export const fetchLinkedInEvents = async (query) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1200, height: 800 });

  // LinkedIn public event search URL
  const searchUrl = `https://www.linkedin.com/search/results/events/?keywords=${encodeURIComponent(query)}`;
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  const events = await page.evaluate(() => {
    const rows = [];
    document.querySelectorAll('a').forEach(a => {
      const text = a.innerText.trim();
      if (a.href && text && text.toLowerCase().includes('event')) {
        rows.push({
          eventTitle: text,
          date: '',          // Can be added later if available
          location: '',      // Can be added later if available
          eventURL: a.href,
          thirdPartyURL: a.href,
          source: window.location.hostname,
          boothNumber: ''
        });
      }
    });
    return rows;
  });

  await browser.close();
  return events;
};

// ---------- Example usage ----------
(async () => {
  const events = await fetchLinkedInEvents('missionware 2025');
  console.log('LinkedIn events found:', events.length);
  console.log(events);
})();
