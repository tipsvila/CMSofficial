const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

// Sidebar order: DASHBOARDS > CRM > OPERATIONS > SYSTEM
const pages = [
  { name: '01-dashboard', path: '/' },
  { name: '02-sam-data', path: '/sam-data' },
  { name: '03-sam-data-detail', path: '/sam-data/1' },
  { name: '04-contracts', path: '/contracts' },
  { name: '05-contract-detail', path: '/contracts/1' },
  { name: '06-contractors', path: '/contractors' },
  { name: '07-contractor-detail', path: '/contractors/1' },
  { name: '08-contacts', path: '/contacts' },
  { name: '09-contact-detail', path: '/contacts/1' },
  { name: '10-outreach', path: '/outreach' },
  { name: '11-outreach-detail', path: '/outreach/1' },
  { name: '12-compliance', path: '/compliance' },
  { name: '13-compliance-detail', path: '/compliance/1' },
  { name: '14-inquiries', path: '/inquiries' },
  { name: '15-inquiry-detail', path: '/inquiries/1' },
  { name: '16-capabilities', path: '/capabilities' },
  { name: '17-documents', path: '/documents' },
  { name: '18-orders', path: '/orders' },
  { name: '19-notifications', path: '/notifications' },
  { name: '20-settings', path: '/settings' },
  { name: '21-database', path: '/database' },
];

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  for (const { name, path: pagePath } of pages) {
    try {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle2', timeout: 15000 });
      const filePath = path.join(OUTPUT_DIR, `${name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`✓ ${name}`);
    } catch (err) {
      console.log(`✗ ${name} — ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${OUTPUT_DIR}`);
})();
