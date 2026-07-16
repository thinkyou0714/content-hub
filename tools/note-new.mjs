#!/usr/bin/env node
// note記事のワークスペースを作成し、AI生成に使うコンテキストパックを表示する。
// 使い方: npm run note:new -- <slug> [--title "記事タイトル"]
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, WORKS_DIR, ensureDir } from "./lib/pipeline-lib.mjs";

function usage() {
  console.log('使い方: npm run note:new -- <slug> [--title "記事タイトル"]');
  console.log("  slug は英小文字・数字・ハイフン(例: n8n-approval-flow)");
}

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const titleIndex = args.indexOf("--title");
const title = titleIndex >= 0 ? (args[titleIndex + 1] ?? "") : "";

if (!slug || !/^[a-z0-9][a-z0-9-]{2,60}$/.test(slug)) {
  usage();
  process.exit(1);
}

const workDir = path.join(WORKS_DIR, slug);
const draftFile = path.join(workDir, "draft.md");

if (fs.existsSync(draftFile)) {
  console.error(`既に存在します: ${path.relative(REPO_ROOT, draftFile)}`);
  process.exit(1);
}

ensureDir(path.join(workDir, "images"));

const scaffold = `# ${title || "【人間: タイトルを記入】"}

<!-- gpt-image: 001-hero | 1536x1024 | 記事のヘッダー画像 | 【画像プロンプトを記入。例: 夜の自宅デスクでPCに向かう人物、暖色のデスクライト、手描き風イラスト】 -->

## ── 無料部分 ──

### 導入: 問題提起と共感

【AI: prompts/note-paid-article.md に従って生成】

### 結論の一部開示

### 実績と前提の明示

【人間: 期間・コスト・環境などの実数を記入】

### 有料部分の目次と対象者

## ── 有料部分 ──

### 完全な手順(ステップバイステップ)

### テンプレート・成果物

### 落とし穴と対処

### 質問への対応方針
`;

fs.writeFileSync(draftFile, scaffold);

const meta = {
  slug,
  title: title || null,
  status: "draft",
  theme: "",
  evidence: "",
  price_jpy: null,
  created_at: new Date().toISOString(),
};
fs.writeFileSync(path.join(workDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

const rel = (p) => path.relative(REPO_ROOT, p);
console.log(`作成しました: ${rel(workDir)}/`);
console.log("");
console.log("次の手順:");
console.log("  1. Claude Code に draft.md の生成を依頼する。必読コンテキスト(コンテキストパック):");
console.log("     - content-hub/prompts/note-paid-article.md   (生成プロンプト)");
console.log("     - content-hub/voice/style-guide.md           (文体)");
console.log("     - content-hub/voice/emotional-writing.md     (心を動かす技法)");
console.log("     - content-hub/memory/edit-learnings.md       (過去の修正から学んだルール)");
console.log("     - content-hub/templates/note-article-template.md");
console.log(`  2. 画像生成:        npm run note:images -- ${slug}`);
console.log(`  3. 人間が修正して   note/works/${slug}/final.md に保存 → noteへ公開`);
console.log(`  4. 修正を学習:      npm run note:learn -- ${slug}`);
console.log("  5. 売上を記録:      note/kpi/revenue.csv → npm run note:kpi");
