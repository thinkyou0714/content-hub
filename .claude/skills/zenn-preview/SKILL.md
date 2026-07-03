---
name: zenn-preview
description: Preview and lint Zenn articles before publishing. Use when asked to preview, lint, or check an article.
---

Preview and lint articles, then report.

1. Ensure `zenn-cli` is present (SessionStart bootstrap runs `npm ci`; else run it).
2. Preview: `npm run preview` (→ `zenn preview`, serves locally). Lint: `npm run lint` (markdownlint + textlint JP + `zenn list:articles`).
3. Report lint failures with file/line; textlint (JP) is the main gate for prose.
4. New article: `npx zenn new:article`. Do not publish or edit article bodies unless asked.
