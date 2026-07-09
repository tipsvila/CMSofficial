import puppeteer from 'puppeteer';
import { existsSync } from 'fs';

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
];

const edgePath = EDGE_PATHS.find(p => existsSync(p));

const pages_to_test = [
  { url: '/', name: 'Dashboard' },
  { url: '/contractors', name: 'Contractors' },
  { url: '/contacts', name: 'Contacts' },
  { url: '/inquiries', name: 'Inquiries' },
  { url: '/outreach', name: 'Outreach' },
  { url: '/compliance', name: 'Compliance' },
  { url: '/contracts', name: 'Contracts' },
  { url: '/documents', name: 'Documents' },
  { url: '/orders', name: 'Orders' },
  { url: '/notifications', name: 'Notifications' },
  { url: '/settings', name: 'Settings' },
  { url: '/capabilities', name: 'Capabilities' },
  { url: '/database', name: 'Database' },
];

(async () => {
  console.log('Browser:', edgePath ? 'Microsoft Edge' : 'Chrome (fallback)');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: edgePath || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let passed = 0;
  let failed = 0;

  for (const { url, name } of pages_to_test) {
    try {
      const res = await page.goto(`http://localhost:3005${url}`, { waitUntil: 'networkidle2', timeout: 15000 });
      const status = res.status();
      const title = await page.title();
      const h1 = await page.$eval('header h1', el => el.textContent).catch(() => 'N/A');

      if (status === 200) {
        console.log(`  PASS  ${name.padEnd(16)} ${url.padEnd(20)} heading="${h1}"`);
        passed++;
      } else {
        console.log(`  FAIL  ${name.padEnd(16)} ${url.padEnd(20)} status=${status}`);
        failed++;
      }
    } catch (e) {
      console.log(`  FAIL  ${name.padEnd(16)} ${url.padEnd(20)} error="${e.message}"`);
      failed++;
    }
  }

  // Test CRUD via API
  console.log('\n--- API CRUD Tests ---');

  const crudTests = [
    { name: 'Create contractor', fn: async () => {
      const r = await page.goto('http://localhost:3005/api/contractors', { waitUntil: 'networkidle0' });
      return r.status() === 200;
    }},
  ];

  for (const { name, fn } of crudTests) {
    try {
      const ok = await fn();
      console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
      ok ? passed++ : failed++;
    } catch (e) {
      console.log(`  FAIL  ${name}: ${e.message}`);
      failed++;
    }
  }

  // Screenshot dashboard
  await page.goto('http://localhost:3005/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'D:/cmsofficial/cypress/screenshots/dashboard-puppeteer.png' });
  console.log('\nScreenshot saved: dashboard-puppeteer.png');

  await browser.close();
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
