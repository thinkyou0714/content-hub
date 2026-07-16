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
3. `content-hub/memory/edit-learnings.md`(編集学習メモリ)も必ず含め、過去の人間修正を初稿から反映する
4. 体験談・実績数字は人間が提供したものだけを使う。不足は `【人間: ○○を記入】` を残し、**絶対に創作しない**
5. 生成後はプロンプト末尾のセルフチェックを実行し、該当チェックリスト(`content-hub/checklists/`)を案内する
6. 運用判断に迷ったら `content-hub/best-practices/`(BP-001〜100)を判断基準として参照する
7. 人間とAIの役割分担は `content-hub/workflows/human-tasks.md` に従う(公開判断・対人対応・体験提供は人間)

## note収益化パイプライン

有料noteは `content-hub/workflows/note-monetization.md` のパイプラインで作る。

- **原稿**: `npm run note:new -- <slug>` → `note/works/<slug>/draft.md` に生成
  (感情設計は `content-hub/voice/emotional-writing.md`)
- **確認**: `npm run note:doctor -- <slug>` で実行前チェック(API鍵・書式・未記入箇所)
- **画像**: 本文に `<!-- gpt-image: id | size | alt | プロンプト -->` を置き
  `npm run note:images -- <slug>`(GPT Image 2)。`--mock` で課金なし検証、
  `--dry-run` で計画確認。`【…】` 未記入プロンプトは自動で保留され課金APIに送られない
- **学習**: 人間修正後 `npm run note:learn -- <slug>` で差分を `content-hub/memory/` に蓄積。
  `PENDING.md` に未抽出があれば `content-hub/prompts/edit-learning.md` で抽出する
- **状況/計測**: `npm run note:status`(段階の俯瞰)/ `npm run note:kpi`(売上は `note/kpi/revenue.csv`)
- テスト: `npm run test:pipeline`

## Claude Code on the web

A cloud session auto-installs `zenn-cli` (SessionStart hook) and loads this `AGENTS.md` +
`.claude/skills/`. MCP is local-only. See `thinkyou0714/.github` →
`docs/claude-code-web-readiness.md`.
