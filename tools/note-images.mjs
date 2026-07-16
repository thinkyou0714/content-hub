#!/usr/bin/env node
// draft.md 内の gpt-image ディレクティブを検出し、OpenAI Images API(GPT Image 2)で
// 画像を生成して本文に埋め込む。生成済みは manifest.json で管理し、再実行しても再生成しない(冪等)。
//
// 使い方: npm run note:images -- <slug> [--dry-run] [--force] [--mock] [--file <markdown>]
//   --mock  課金APIを呼ばず単色プレースホルダー画像で全フローを検証する(実生成の前確認用)
// 環境変数:
//   OPENAI_API_KEY     必須(--dry-run / --mock 時は不要)
//   OPENAI_IMAGE_MODEL 省略時 "gpt-image-2"
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  DIRECTIVE_EXAMPLE,
  DIRECTIVE_FORMAT,
  PLACEHOLDER_RE,
  WORKS_DIR,
  ensureDir,
  findMalformedDirectiveLines,
  injectImageLinks,
  parseImageDirectives,
  placeholderPng,
  promptHash,
  readFileIfExists,
  relFromRepo,
  updateMeta,
  validateDirective,
} from "./lib/pipeline-lib.mjs";

const OPENAI_URL = "https://api.openai.com/v1/images/generations";
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

function usage() {
  console.log("使い方: npm run note:images -- <slug> [--dry-run] [--force] [--mock] [--file <markdown>]");
}

let values;
let positionals;
try {
  ({ values, positionals } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      mock: { type: "boolean", default: false },
      file: { type: "string" },
    },
    allowPositionals: true,
  }));
} catch (err) {
  console.error(err.message);
  usage();
  process.exit(1);
}

const dryRun = values["dry-run"];
const force = values.force;
const mock = values.mock;
const slug = positionals[0];

let targetFile;
if (values.file) {
  targetFile = path.resolve(values.file);
} else if (slug) {
  targetFile = path.join(WORKS_DIR, slug, "draft.md");
} else {
  usage();
  process.exit(1);
}
const workDir = path.dirname(targetFile);
// --file 実行では meta.json が無いことがあるため、meta更新は slug 実行時のみ行う
const metaWorkDir = values.file ? null : workDir;

const markdown = readFileIfExists(targetFile);
if (markdown === null) {
  console.error(`ファイルが見つかりません: ${targetFile}`);
  console.error("先に npm run note:new -- <slug> でワークスペースを作成してください。");
  process.exit(1);
}

const imagesDir = path.join(workDir, "images");
const manifestFile = path.join(imagesDir, "manifest.json");
const manifest = JSON.parse(readFileIfExists(manifestFile) ?? "{}");

function saveManifest() {
  ensureDir(imagesDir);
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
}

// 書き損じたディレクティブを黙って無視しない
let hasError = false;
for (const lineNo of findMalformedDirectiveLines(markdown)) {
  console.error(`行${lineNo + 1}: gpt-image ディレクティブの書式が不正です。正しい書式:`);
  console.error(`  ${DIRECTIVE_FORMAT}`);
  hasError = true;
}

const directives = parseImageDirectives(markdown);
if (!hasError && directives.length === 0) {
  console.log("gpt-image ディレクティブが見つかりません。本文に次の形式で追加してください:");
  console.log(`  ${DIRECTIVE_EXAMPLE}`);
  process.exit(0);
}

const seenIds = new Set();
for (const d of directives) {
  for (const err of validateDirective(d)) {
    console.error(`行${d.line + 1} [${d.id}] ${err}`);
    hasError = true;
  }
  if (seenIds.has(d.id)) {
    console.error(`行${d.line + 1}: id が重複しています: ${d.id}`);
    hasError = true;
  }
  seenIds.add(d.id);
}
if (hasError) process.exit(1);

const plan = directives.map((d) => {
  const hash = promptHash(d);
  const entry = manifest[d.id];
  const fileExists = entry && fs.existsSync(path.join(imagesDir, entry.file));
  const isMockEntry = entry?.mock === true;
  // プレースホルダー(【…】)入りのプロンプトは課金APIに送らず保留する
  const onHold = PLACEHOLDER_RE.test(d.prompt);
  // 実生成モードでは、以前のmock画像は本物で置き換える
  const needsGeneration =
    !onHold &&
    (force || !fileExists || entry.promptHash !== hash || (isMockEntry && !mock));
  return { directive: d, hash, needsGeneration, onHold };
});

console.log(`対象: ${relFromRepo(targetFile)} / モデル: ${mock ? "mock(placeholder)" : MODEL}`);
for (const p of plan) {
  const mark = p.onHold
    ? "保留(プロンプト未記入)"
    : p.needsGeneration
      ? mock
        ? "生成(mock)"
        : "生成"
      : "スキップ(生成済み)";
  console.log(`  [${mark}] ${p.directive.id} (${p.directive.size}) ${p.directive.prompt.slice(0, 60)}`);
}
const held = plan.filter((p) => p.onHold);
if (held.length > 0) {
  console.log("保留分は【…】のプレースホルダーを実際のプロンプトに書き換えると生成されます。");
}

if (dryRun) {
  console.log("--dry-run のため生成せず終了します。");
  process.exit(0);
}

const toGenerate = plan.filter((p) => p.needsGeneration);
if (!mock && toGenerate.length > 0 && !process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY が設定されていません(課金なしで試すなら --mock)。");
  process.exit(1);
}

async function callOpenAI(body) {
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
      const wait = 2000 * attempt;
      console.log(`  HTTP ${res.status}: ${wait / 1000}秒後にリトライします(${attempt}/${maxAttempts - 1})`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`OpenAI API エラー HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
}

async function generateBuffer(d) {
  if (mock) return placeholderPng();
  const body = { model: MODEL, prompt: d.prompt, n: 1 };
  if (d.size !== "auto") body.size = d.size;
  const json = await callOpenAI(body);
  const data = json.data?.[0];
  if (data?.b64_json) return Buffer.from(data.b64_json, "base64");
  if (data?.url) {
    const imgRes = await fetch(data.url);
    if (!imgRes.ok) throw new Error(`画像ダウンロード失敗 HTTP ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer());
  }
  throw new Error(`想定外のレスポンス: ${JSON.stringify(json).slice(0, 300)}`);
}

ensureDir(imagesDir);

for (const p of toGenerate) {
  const d = p.directive;
  console.log(`生成中${mock ? "(mock)" : ""}: ${d.id} ...`);
  const buffer = await generateBuffer(d);
  const fileName = `${d.id}.png`;
  fs.writeFileSync(path.join(imagesDir, fileName), buffer);
  manifest[d.id] = {
    file: fileName,
    prompt: d.prompt,
    size: d.size,
    model: mock ? "mock(placeholder)" : MODEL,
    mock: mock || undefined,
    promptHash: p.hash,
    generatedAt: new Date().toISOString(),
  };
  // 途中で失敗しても生成済み分を失わないよう、1枚ごとに保存する
  saveManifest();
  console.log(`  保存: images/${fileName} (${Math.round(buffer.length / 1024)} KB)`);
}

// 生成済み画像(スキップ分も含む)のリンクを本文へ挿入・更新する
const entries = plan
  .filter((p) => manifest[p.directive.id])
  .map((p) => ({
    id: p.directive.id,
    alt: p.directive.alt || p.directive.id,
    relPath: `images/${manifest[p.directive.id].file}`,
  }));
const updated = injectImageLinks(markdown, entries);
if (updated !== markdown) {
  fs.writeFileSync(targetFile, updated);
  console.log("本文に画像リンクを挿入しました。");
}

// meta を更新(実生成が1枚でもあれば images 段階に進める)
if (metaWorkDir && !mock && toGenerate.length > 0) {
  updateMeta(metaWorkDir, { status: "images", images_generated: Object.keys(manifest).length });
}

console.log(
  `完了: 生成 ${toGenerate.length}件 / スキップ ${plan.length - toGenerate.length - held.length}件 / 保留 ${held.length}件`,
);
if (mock) {
  console.log("※ mock画像です。公開前に --mock なしで実生成し直してください。");
}
console.log("注意: note へは手動アップロードが必要です(note に画像APIはありません)。");
