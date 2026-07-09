---
emoji: 🔒
description: Scan for security vulnerabilities on pull requests
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  contents: read
  pull-requests: read
  security-events: write
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
steps:
  - name: Pre-fetch PR data
    run: |
      mkdir -p /tmp/gh-aw/data
      gh pr view ${{ github.event.pull_request.number }} --json files,additions,deletions,title > /tmp/gh-aw/data/pr.json
safe-outputs:
  add-comment:
    target: pull-request
network:
  allowed:
    - defaults
    - node
---

# Security Scan Workflow

## Task

Scan pull requests for security vulnerabilities in the Next.js CMS codebase.

## Instructions

1. Read `/tmp/gh-aw/data/pr.json` for PR context

2. Check for common security issues:
   - SQL injection (string interpolation in queries)
   - XSS vulnerabilities (unsafe HTML rendering)
   - Authentication bypass (missing auth checks)
   - Rate limiting issues
   - CSRF vulnerabilities
   - Hardcoded secrets or credentials

3. Review changed files for:
   - `src/lib/auth-check.ts` - auth bypass risks
   - `src/app/api/` routes - missing authentication
   - `src/lib/db.ts` - SQL injection risks
   - `src/middleware.ts` - rate limiting configuration

4. If vulnerabilities found:
   - Add a comment with severity levels (CRITICAL, HIGH, MEDIUM)
   - Include specific file:line references
   - Provide fix suggestions

5. If no issues found:
   - Add a comment confirming security scan passed

## Safe Outputs

- Use `add-comment` to post security findings on the PR
- Call `noop` if PR only changes documentation or tests

## Known Security Issues to Check

Based on project memory:
- `src/lib/auth-check.ts:13` - DEV_MODE bypass
- No auth on API endpoints (90+ routes)
- Wildcard image proxy SSRF in `next.config.ts`
- Missing Content-Security-Policy header
- In-memory rate limiter issues
