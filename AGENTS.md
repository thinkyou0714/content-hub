# AGENTS.md — zenn-content

Zenn 記事ソース (THINK YOU LAB — AI 自動化・LAB infra)。`zenn-cli` で執筆・プレビューし、
`zenn-auto-publish` ワークフローで公開する。

- **Stack**: Markdown 記事 (`articles/`) + `zenn-cli` (npm)。Lint: markdownlint-cli2 + textlint (JP)。
- **Setup**: `.claude/bootstrap.sh` (SessionStart) が `npm ci` で `zenn-cli` を導入。手動: `npm ci`。
- **Preview**: `npm run preview` (→ `zenn preview`)。**Lint**: `npm run lint` (md + textlint + zenn list)。
- **New**: `npx zenn new:article`。
- **公開**: `main` push で `zenn-auto-publish` が反映。文章は textlint(JP) を通すこと。

## Claude Code on the web

A cloud session auto-installs `zenn-cli` (SessionStart hook) and loads this `AGENTS.md` +
`.claude/skills/`. MCP is local-only. See `thinkyou0714/.github` →
`docs/claude-code-web-readiness.md`.
