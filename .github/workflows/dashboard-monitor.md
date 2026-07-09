---
emoji: 📊
description: Monitor dashboard rendering and performance
on:
  schedule:
    - cron: '0 9 * * 1-5'  # Weekdays at 9am
  workflow_dispatch:
permissions:
  contents: read
  issues: write
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
steps:
  - name: Check dashboard status
    run: |
      mkdir -p /tmp/gh-aw/data
      echo '{"timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > /tmp/gh-aw/data/check.json
safe-outputs:
  create-issue:
    title: "Dashboard Monitoring Alert"
network:
  allowed:
    - defaults
    - node
    - playwright
---

# Dashboard Monitor Workflow

## Task

Monitor the CMS dashboard for rendering issues and performance problems.

## Instructions

1. Read `/tmp/gh-aw/data/check.json` for timestamp

2. Check if dev server is running:
   ```bash
   # Try to start dev server if not running
   pnpm run dev:3005 &
   sleep 5
   ```

3. Test dashboard rendering:
   ```bash
   # Use Puppeteer to check dashboard
   node -e "
   const puppeteer = require('puppeteer');
   (async () => {
     const browser = await puppeteer.launch({ headless: true });
     const page = await browser.newPage();
     await page.goto('http://localhost:3005/', { waitUntil: 'networkidle2' });
     const title = await page.title();
     const h1 = await page.\$eval('header h1', el => el.textContent).catch(() => 'N/A');
     const stats = await page.\$\$eval('[data-stat]', els => els.map(el => el.textContent));
     console.log(JSON.stringify({ title, h1, stats, timestamp: new Date().toISOString() }));
     await browser.close();
   })();
   " > /tmp/gh-aw/data/dashboard-status.json
   ```

4. Check for errors:
   - Console errors in browser
   - Failed network requests
   - Missing data or NaN values
   - Rendering timeouts

5. If issues found:
   - Create an issue with details
   - Include console errors and screenshots
   - Tag for immediate attention

6. If dashboard is healthy:
   - Log status (no issue created)

## Safe Outputs

- Use `create-issue` to report dashboard problems
- Call `noop` if dashboard is healthy

## Dashboard Health Checks

- Page loads without errors
- Stats render correctly (no NaN values)
- Charts display data
- Navigation works
- Responsive design functions
