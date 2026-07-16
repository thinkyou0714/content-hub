#!/usr/bin/env node
// AI初稿(draft.md)と人間修正後の完成稿(final.md)の差分を「編集学習メモリ」に蓄積する。
//   1. 差分を content-hub/memory/edits/<日付>-<slug>.diff に保存(常に実行)
//   2. ANTHROPIC_API_KEY があれば Claude API でルールを自動抽出し
//      content-hub/memory/edit-learnings.md の「自動抽出(未確認)」節に追記
//   3. キーが無い・抽出に失敗した場合は PENDING.md に登録し、Claude Code での抽出手順を案内
//
// 使い方: npm run note:learn -- <slug> [--no-distill]
// 環境変数:
//   ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN  自動抽出に使用(任意)
//   NOTE_LEARN_MODEL                          省略時 "claude-opus-4-8"
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  EDITS_DIR,
  EDIT_LEARNING_PROMPT,
  LEARNINGS_FILE,
  PENDING_FILE,
  WORKS_DIR,
  appendMarkdown,
  appendToSection,
  ensureDir,
  readFileIfExists,
  relFromRepo,
  summarizeDiff,
  todayStamp,
  updateMeta,
} from "./lib/pipeline-lib.mjs";

const MODEL = process.env.NOTE_LEARN_MODEL || "claude-opus-4-8";
const MAX_DIFF_CHARS = 100_000;
const AUTO_SECTION = "## 自動抽出(未確認)";

let values;
let positionals;
try {
  ({ values, positionals } = parseArgs({
    options: { "no-distill": { type: "boolean", default: false } },
    allowPositionals: true,
  }));
} catch (err) {
  console.error(err.message);
  console.log("使い方: npm run note:learn -- <slug> [--no-distill]");
  process.exit(1);
}

const slug = positionals[0];
const noDistill = values["no-distill"];

if (!slug) {
  console.log("使い方: npm run note:learn -- <slug> [--no-distill]");
  process.exit(1);
}

const workDir = path.join(WORKS_DIR, slug);
const draftFile = path.join(workDir, "draft.md");
const finalFile = path.join(workDir, "final.md");

if (!fs.existsSync(draftFile)) {
  console.error(`draft.md がありません: ${relFromRepo(draftFile)}`);
  process.exit(1);
}
if (!fs.existsSync(finalFile)) {
  console.error(`final.md がありません: ${relFromRepo(finalFile)}`);
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
console.log(`差分を保存しました: ${relFromRepo(diffFile)} (+${added} / -${removed} 行)`);

// final.md が保存されている = 人間の完成稿ができたので final 段階に進める
updateMeta(workDir, { status: "final", last_learned_at: stamp });

let diffForModel = diffText;
if (diffForModel.length > MAX_DIFF_CHARS) {
  diffForModel = `${diffForModel.slice(0, MAX_DIFF_CHARS)}\n\n[注意: 差分が大きいためここで切り詰めた]`;
  console.log(`注意: 差分が ${MAX_DIFF_CHARS.toLocaleString()} 文字を超えたため、抽出には先頭部分のみ使います。`);
}

// content-hub/prompts/edit-learning.md の最初の ```text ブロックを抽出指示として使う。
// 見つからない場合はフォールバックせず PENDING に回す(独自コピーの乖離を防ぐため)。
function loadInstruction() {
  const md = readFileIfExists(EDIT_LEARNING_PROMPT);
  if (!md) return null;
  const m = md.match(/```text\n([\s\S]*?)```/);
  return m ? m[1].trim() : null;
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
        "## キュー",
        "",
      ].join("\n"),
    );
  }
  appendMarkdown(PENDING_FILE, `- ${stamp} \`${slug}\` → \`edits/${stamp}-${slug}.diff\`(${reason})\n`);
  console.log(`PENDING に登録しました: ${relFromRepo(PENDING_FILE)}`);
  console.log("Claude Code で content-hub/prompts/edit-learning.md を使って抽出してください。");
}

function appendLearnings(rulesText) {
  const lines = rulesText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "));
  if (lines.length === 0) return false;
  const chunk = `### ${stamp} ${slug}\n\n${lines.join("\n")}\n`;
  // 「自動抽出(未確認)」節の末尾へ入れる。節が無ければ失敗として扱う
  if (!appendToSection(LEARNINGS_FILE, AUTO_SECTION, chunk)) {
    console.error(`${relFromRepo(LEARNINGS_FILE)} に「${AUTO_SECTION}」節が見つかりません。`);
    return false;
  }
  console.log(`ルールを追記しました: ${relFromRepo(LEARNINGS_FILE)} (${lines.length}件)`);
  console.log("月次レビューで内容を確認し、有効なものを「確定ルール」へ昇格させてください。");
  return true;
}

const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
if (noDistill || !hasApiKey) {
  appendPending(noDistill ? "--no-distill 指定" : "APIキー未設定");
  process.exit(0);
}

const instruction = loadInstruction();
if (!instruction) {
  console.error(`抽出プロンプトを読み込めませんでした: ${relFromRepo(EDIT_LEARNING_PROMPT)}`);
  appendPending("抽出プロンプト読込失敗");
  process.exit(0);
}

// 既存ルールを渡して重複抽出を防ぐ(edit-learning.md の制約5)
const existingRules = readFileIfExists(LEARNINGS_FILE) ?? "(既存ルールなし)";

try {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  console.log(`Claude API でルールを抽出しています(model: ${MODEL})...`);
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: instruction,
    messages: [
      {
        role: "user",
        content: [
          `記事slug: ${slug}`,
          "",
          "## 既存ルール(これと同じ内容は出力しない)",
          "",
          existingRules,
          "",
          "## 差分",
          "",
          "```diff",
          diffForModel,
          "```",
        ].join("\n"),
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
    console.error("抽出結果を追記できませんでした。PENDING に回します。");
    appendPending("抽出結果が不正");
  }
} catch (err) {
  console.error(`自動抽出に失敗しました: ${err?.message ?? err}`);
  appendPending("API呼び出し失敗");
}
