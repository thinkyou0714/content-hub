#!/usr/bin/env node
// パイプライン実行前のプリフライト診断。
// 課金・不可逆な操作(画像の実生成など)の前に、環境と原稿の問題を洗い出す。
// 使い方: npm run note:doctor [-- <slug>]
//   slug を渡すと、その記事の draft.md も検査する。
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import {
  REPO_ROOT,
  REVENUE_CSV,
  REVENUE_CSV_HEADER,
  PLACEHOLDER_RE,
  findMalformedDirectiveLines,
  parseImageDirectives,
  readFileIfExists,
  relFromRepo,
  validateDirective,
  workDirForSlug,
} from "./lib/pipeline-lib.mjs";

let positionals;
try {
  ({ positionals } = parseArgs({ allowPositionals: true }));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const slug = positionals[0];

let errors = 0;
let warnings = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => {
  console.log(`  ⚠ ${msg}`);
  warnings += 1;
};
const fail = (msg) => {
  console.log(`  ✗ ${msg}`);
  errors += 1;
};

console.log("環境:");

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor >= 18) ok(`Node.js ${process.versions.node}`);
else fail(`Node.js ${process.versions.node}(18以上が必要)`);

const git = spawnSync("git", ["--version"], { encoding: "utf8" });
if (git.status === 0) ok(git.stdout.trim());
else fail("git が見つかりません(note:learn の差分抽出に必要)");

if (process.env.OPENAI_API_KEY) ok("OPENAI_API_KEY 設定済み(note:images 実生成が可能)");
else warn("OPENAI_API_KEY 未設定 — note:images は --mock でのみ実行可(実生成には必要)");

if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
  ok("ANTHROPIC_API_KEY/AUTH_TOKEN 設定済み(note:learn の自動抽出が可能)");
} else {
  warn("Anthropic の鍵が未設定 — note:learn は PENDING 登録にフォールバック(自動抽出には必要)");
}

const sdkPath = path.join(REPO_ROOT, "node_modules", "@anthropic-ai", "sdk", "package.json");
if (fs.existsSync(sdkPath)) ok("@anthropic-ai/sdk インストール済み");
else warn("@anthropic-ai/sdk 未インストール — `npm ci` 実行後に note:learn の自動抽出が有効");

console.log("");
console.log("売上記録:");
const csv = readFileIfExists(REVENUE_CSV);
if (csv === null) {
  warn(`${relFromRepo(REVENUE_CSV)} が無い — 初回の売上記録時に作成`);
} else {
  const header = csv.split(/\r?\n/)[0]?.trim();
  if (header === REVENUE_CSV_HEADER) ok(`ヘッダ正常: ${REVENUE_CSV_HEADER}`);
  else fail(`ヘッダが不正: "${header}"(期待値: ${REVENUE_CSV_HEADER})`);
}

if (slug) {
  console.log("");
  console.log(`記事チェック(${slug}):`);
  const workDir = workDirForSlug(slug);
  const draftFile = path.join(workDir, "draft.md");
  const markdown = readFileIfExists(draftFile);
  if (markdown === null) {
    fail(`draft.md が無い: ${relFromRepo(draftFile)}(先に npm run note:new -- ${slug})`);
  } else {
    ok(`draft.md あり: ${relFromRepo(draftFile)}`);

    const malformed = findMalformedDirectiveLines(markdown);
    for (const lineNo of malformed) fail(`行${lineNo + 1}: gpt-image ディレクティブの書式が不正`);

    const directives = parseImageDirectives(markdown);
    if (directives.length === 0 && malformed.length === 0) {
      warn("gpt-image ディレクティブが無い(画像を入れない記事なら問題なし)");
    }
    const seen = new Set();
    for (const d of directives) {
      for (const err of validateDirective(d)) fail(`行${d.line + 1} [${d.id}] ${err}`);
      if (seen.has(d.id)) fail(`行${d.line + 1}: id 重複 ${d.id}`);
      seen.add(d.id);
    }
    const held = directives.filter((d) => PLACEHOLDER_RE.test(d.prompt));
    if (held.length > 0) {
      warn(`${held.length}件の画像プロンプトが未記入(【…】)— 実生成前に書き換えが必要`);
    } else if (directives.length > 0) {
      ok(`画像ディレクティブ ${directives.length}件、すべて記入済み`);
    }

    const bodyPlaceholders = (markdown.match(/【人間:[^】]*】/g) ?? []).length;
    if (bodyPlaceholders > 0) warn(`本文に【人間: …】プレースホルダーが${bodyPlaceholders}件(公開前に要記入)`);

    ok(fs.existsSync(path.join(workDir, "final.md")) ? "final.md あり(人間修正済み)" : "final.md 未作成(修正前)");
  }
}

console.log("");
if (errors > 0) {
  console.log(`診断: エラー ${errors}件 / 警告 ${warnings}件 — 実行前に解消してください。`);
  process.exit(1);
}
console.log(`診断: エラーなし / 警告 ${warnings}件。`);
