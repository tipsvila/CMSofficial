---
emoji: 🧪
description: Run Cypress and Puppeteer tests on pull requests
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  contents: read
  pull-requests: read
  checks: write
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
steps:
  - name: Pre-fetch PR data
    run: |
      mkdir -p /tmp/gh-aw/data
      gh pr view ${{ github.event.pull_request.number }} --json files,additions,deletions,title,body > /tmp/gh-aw/data/pr.json
safe-outputs:
  add-comment:
    target: pull-request
network:
  allowed:
    - defaults
    - node
    - playwright
---

# PR Testing Workflow

## Task

Run automated tests on pull requests to catch regressions before merging.

## Instructions

1. Read `/tmp/gh-aw/data/pr.json` for PR context (changed files, title, description)

2. Run the test suite:
   ```bash
   # Install dependencies
   pnpm install
   
   # Run unit tests
   pnpm test
   
   # Run Cypress E2E tests
   pnpm exec cypress run --config baseUrl=http://localhost:3005
   
   # Run Puppeteer tests
   node test-puppeteer.mjs
   ```

3. If tests fail:
   - Add a comment on the PR with failure details
   - Include which tests failed and suggestions for fixes

4. If tests pass:
   - Add a comment confirming all tests passed
   - Include test summary (unit, E2E, Puppeteer)

## Safe Outputs

- Use `add-comment` to post test results on the PR
- Call `noop` with reason if PR is a draft or only changes documentation

## Comments

Post a formatted comment with:
- Test results summary (passed/failed counts)
- Links to any failed test screenshots
- Suggestions for fixing failures if applicable
