# AGENTS.md — content-hub (旧 zenn-content)

THINK YOU LAB の発信マスターソース。Zenn 記事ソース + 全チャネル(X / note)向け文章生成のハブ。
`zenn-cli` で執筆・プレビューし、`zenn-auto-publish` ワークフローで公開する。

- **Stack**: Markdown 記事 (`articles/`) + 生成ハブ (`content-hub/`) + `zenn-cli` (npm)。Lint: markdownlint-cli2 + textlint (JP)。
- **Setup**: `.claude/bootstrap.sh` (SessionStart) が `npm ci` で `zenn-cli` を導入。手動: `npm ci`。
- **Preview**: `npm run preview` (→ `zenn preview`)。**Lint**: `npm run lint` (md + textlint + zenn list)。
- **New**: `npx zenn new:article`。
- **公開**: `main` push で `zenn-auto-publish` が反映。文章は textlint(JP) を通すこと。

## 文章生成のルール(重要)

**あらゆる文章生成(Zenn / X / note)は `content-hub/` をマスターソースとして行うこと。**

1. 生成依頼を受けたら、まず `content-hub/README.md` の「使い方」表で該当プロンプトを特定する
2. `content-hub/voice/style-guide.md`(文体)と該当プロンプト(`content-hub/prompts/`)を必ずコンテキストに含める
3. 体験談・実績数字は人間が提供したものだけを使う。不足は `【人間: ○○を記入】` を残し、**絶対に創作しない**
4. 生成後はプロンプト末尾のセルフチェックを実行し、該当チェックリスト(`content-hub/checklists/`)を案内する
5. 運用判断に迷ったら `content-hub/best-practices/`(BP-001〜100)を判断基準として参照する
6. 人間とAIの役割分担は `content-hub/workflows/human-tasks.md` に従う(公開判断・対人対応・体験提供は人間)

## Claude Code on the web

A cloud session auto-installs `zenn-cli` (SessionStart hook) and loads this `AGENTS.md` +
`.claude/skills/`. MCP is local-only. See `thinkyou0714/.github` →
`docs/claude-code-web-readiness.md`.
