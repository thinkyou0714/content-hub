#!/usr/bin/env node
// AI初稿(draft.md)と人間修正後の完成稿(final.md)の差分を「編集学習メモリ」に蓄積する。
//   1. 差分を content-hub/memory/edits/<日付>-<slug>.diff に保存(常に実行)
//   2. ANTHROPIC_API_KEY があれば Claude API でルールを自動抽出し
//      content-hub/memory/edit-learnings.md の「自動抽出(未確認)」に追記
//   3. キーが無ければ PENDING.md に登録し、Claude Code での抽出手順を案内
//
// 使い方: npm run note:learn -- <slug> [--no-distill]
// 環境変数:
//   ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN  自動抽出に使用(任意)
//   NOTE_LEARN_MODEL                          省略時 "claude-opus-4-8"
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  EDITS_DIR,
  EDIT_LEARNING_PROMPT,
  LEARNINGS_FILE,
  PENDING_FILE,
  REPO_ROOT,
  WORKS_DIR,
  appendMarkdown,
  ensureDir,
  readFileIfExists,
  summarizeDiff,
  todayStamp,
} from "./lib/pipeline-lib.mjs";

const MODEL = process.env.NOTE_LEARN_MODEL || "claude-opus-4-8";
const MAX_DIFF_CHARS = 100_000;

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const noDistill = args.includes("--no-distill");

if (!slug) {
  console.log("使い方: npm run note:learn -- <slug> [--no-distill]");
  process.exit(1);
}

const workDir = path.join(WORKS_DIR, slug);
const draftFile = path.join(workDir, "draft.md");
const finalFile = path.join(workDir, "final.md");

if (!fs.existsSync(draftFile)) {
  console.error(`draft.md がありません: ${path.relative(REPO_ROOT, draftFile)}`);
  process.exit(1);
}
if (!fs.existsSync(finalFile)) {
  console.error(`final.md がありません: ${path.relative(REPO_ROOT, finalFile)}`);
  console.error("人間が修正した完成稿を final.md として保存してから実行してください。");
  process.exit(1);
}

// git diff --no-index は差分ありのとき終了コード1を返す
const diffResult = spawnSync(
  "git",
  ["diff", "--no-index", "--unified=2", "--", draftFile, finalFile],
  { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
);
if (diffResult.status !== 0 && diffResult.status !== 1) {
  console.error(`git diff の実行に失敗しました: ${diffResult.stderr}`);
  process.exit(1);
}
const diffText = diffResult.stdout ?? "";
if (diffResult.status === 0 || diffText.trim() === "") {
  console.log("draft.md と final.md に差分はありません。学習する内容はありません。");
  process.exit(0);
}

ensureDir(EDITS_DIR);
const stamp = todayStamp();
const diffFile = path.join(EDITS_DIR, `${stamp}-${slug}.diff`);
fs.writeFileSync(diffFile, diffText);

const { added, removed } = summarizeDiff(diffText);
console.log(`差分を保存しました: ${path.relative(REPO_ROOT, diffFile)} (+${added} / -${removed} 行)`);

let diffForModel = diffText;
if (diffForModel.length > MAX_DIFF_CHARS) {
  diffForModel = `${diffForModel.slice(0, MAX_DIFF_CHARS)}\n\n[注意: 差分が大きいためここで切り詰めた]`;
  console.log(`注意: 差分が ${MAX_DIFF_CHARS.toLocaleString()} 文字を超えたため、抽出には先頭部分のみ使います。`);
}

// content-hub/prompts/edit-learning.md の最初の ```text ブロックを抽出指示として使う
function loadInstruction() {
  const md = readFileIfExists(EDIT_LEARNING_PROMPT);
  if (md) {
    const m = md.match(/```text\n([\s\S]*?)```/);
    if (m) return m[1].trim();
  }
  return [
    "あなたは編集差分から文章生成ルールを抽出するアシスタントです。",
    "与えられる unified diff は「AIが書いた初稿」に対して「人間が加えた修正」です。",
    "次回のAI生成で同じ修正を不要にするための、再利用可能なルールを抽出してください。",
    "出力は次の形式の箇条書きのみ。最大8行、日本語で書くこと。",
    "- [分類] ルール本文(根拠: 差分中の具体例を短く引用)",
    "分類は 語彙 / 文体 / 構成 / 主張 / 事実 / その他 のいずれか。",
    "固有の話題にしか使えない指摘は除外し、汎用的なルールだけを残すこと。",
  ].join("\n");
}

function appendPending(reason) {
  ensureDir(EDITS_DIR);
  if (readFileIfExists(PENDING_FILE) === null) {
    appendMarkdown(
      PENDING_FILE,
      [
        "# 未抽出の編集差分キュー",
        "",
        "`note:learn` が保存した差分のうち、ルール抽出が済んでいないもの。",
        "Claude Code で `content-hub/prompts/edit-learning.md` を実行して処理し、",
        "処理が終わった行は削除すること。",
        "",
      ].join("\n"),
    );
  }
  appendMarkdown(PENDING_FILE, `- ${stamp} \`${slug}\` → \`edits/${stamp}-${slug}.diff\`(${reason})\n`);
  console.log(`PENDING に登録しました: ${path.relative(REPO_ROOT, PENDING_FILE)}`);
  console.log("Claude Code で content-hub/prompts/edit-learning.md を使って抽出してください。");
}

function appendLearnings(rulesText) {
  const lines = rulesText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "));
  if (lines.length === 0) return false;
  appendMarkdown(LEARNINGS_FILE, `\n### ${stamp} ${slug}\n\n${lines.join("\n")}\n`);
  console.log(`ルールを追記しました: ${path.relative(REPO_ROOT, LEARNINGS_FILE)} (${lines.length}件)`);
  console.log("月次レビューで内容を確認し、有効なものを「確定ルール」へ昇格させてください。");
  return true;
}

const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
if (noDistill || !hasApiKey) {
  appendPending(noDistill ? "--no-distill 指定" : "APIキー未設定");
  process.exit(0);
}

try {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  console.log(`Claude API でルールを抽出しています(model: ${MODEL})...`);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: loadInstruction(),
    messages: [
      {
        role: "user",
        content: `記事slug: ${slug}\n\n以下が差分です。\n\n\`\`\`diff\n${diffForModel}\n\`\`\``,
      },
    ],
  });
  if (response.stop_reason === "refusal") {
    console.error("モデルが応答を拒否しました。PENDING に回します。");
    appendPending("モデルが拒否");
    process.exit(0);
  }
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  if (!appendLearnings(text)) {
    console.error("抽出結果からルール行(- で始まる行)が見つかりませんでした。PENDING に回します。");
    appendPending("抽出結果が不正");
  }
} catch (err) {
  console.error(`自動抽出に失敗しました: ${err?.message ?? err}`);
  appendPending("API呼び出し失敗");
}
