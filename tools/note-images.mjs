#!/usr/bin/env node
// draft.md 内の gpt-image ディレクティブを検出し、OpenAI Images API(GPT Image 2)で
// 画像を生成して本文に埋め込む。生成済みは manifest.json で管理し、再実行しても再生成しない(冪等)。
//
// 使い方: npm run note:images -- <slug> [--dry-run] [--force] [--file <markdown>]
// 環境変数:
//   OPENAI_API_KEY     必須(--dry-run 時は不要)
//   OPENAI_IMAGE_MODEL 省略時 "gpt-image-2"
import fs from "node:fs";
import path from "node:path";
import {
  REPO_ROOT,
  WORKS_DIR,
  ensureDir,
  injectImageLinks,
  parseImageDirectives,
  promptHash,
  readFileIfExists,
  validateDirective,
} from "./lib/pipeline-lib.mjs";

const OPENAI_URL = "https://api.openai.com/v1/images/generations";
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

function usage() {
  console.log("使い方: npm run note:images -- <slug> [--dry-run] [--force] [--file <markdown>]");
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const fileIndex = args.indexOf("--file");
const slug = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--file");

let targetFile;
if (fileIndex >= 0 && args[fileIndex + 1]) {
  targetFile = path.resolve(args[fileIndex + 1]);
} else if (slug) {
  targetFile = path.join(WORKS_DIR, slug, "draft.md");
} else {
  usage();
  process.exit(1);
}

const markdown = readFileIfExists(targetFile);
if (markdown === null) {
  console.error(`ファイルが見つかりません: ${targetFile}`);
  console.error("先に npm run note:new -- <slug> でワークスペースを作成してください。");
  process.exit(1);
}

const imagesDir = path.join(path.dirname(targetFile), "images");
const manifestFile = path.join(imagesDir, "manifest.json");
const manifest = JSON.parse(readFileIfExists(manifestFile) ?? "{}");

const directives = parseImageDirectives(markdown);
if (directives.length === 0) {
  console.log("gpt-image ディレクティブが見つかりません。本文に次の形式で追加してください:");
  console.log("  <!-- gpt-image: 001-hero | 1536x1024 | 代替テキスト | 画像の内容を表すプロンプト -->");
  process.exit(0);
}

let hasError = false;
for (const d of directives) {
  for (const err of validateDirective(d)) {
    console.error(`行${d.line + 1} [${d.id}] ${err}`);
    hasError = true;
  }
}
const ids = directives.map((d) => d.id);
for (const id of new Set(ids)) {
  if (ids.filter((x) => x === id).length > 1) {
    console.error(`id が重複しています: ${id}`);
    hasError = true;
  }
}
if (hasError) process.exit(1);

const plan = directives.map((d) => {
  const hash = promptHash(d);
  const entry = manifest[d.id];
  const fileExists = entry && fs.existsSync(path.join(imagesDir, entry.file));
  const needsGeneration = force || !fileExists || entry.promptHash !== hash;
  return { directive: d, hash, needsGeneration };
});

console.log(`対象: ${path.relative(REPO_ROOT, targetFile)} / モデル: ${MODEL}`);
for (const p of plan) {
  const mark = p.needsGeneration ? "生成" : "スキップ(生成済み)";
  console.log(`  [${mark}] ${p.directive.id} (${p.directive.size}) ${p.directive.prompt.slice(0, 60)}`);
}

if (dryRun) {
  console.log("--dry-run のため生成せず終了します。");
  process.exit(0);
}

const toGenerate = plan.filter((p) => p.needsGeneration);
if (toGenerate.length > 0 && !process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY が設定されていません。");
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

ensureDir(imagesDir);

for (const p of toGenerate) {
  const d = p.directive;
  console.log(`生成中: ${d.id} ...`);
  const body = { model: MODEL, prompt: d.prompt, n: 1 };
  if (d.size !== "auto") body.size = d.size;

  const json = await callOpenAI(body);
  const data = json.data?.[0];
  let buffer;
  if (data?.b64_json) {
    buffer = Buffer.from(data.b64_json, "base64");
  } else if (data?.url) {
    const imgRes = await fetch(data.url);
    if (!imgRes.ok) throw new Error(`画像ダウンロード失敗 HTTP ${imgRes.status}`);
    buffer = Buffer.from(await imgRes.arrayBuffer());
  } else {
    throw new Error(`想定外のレスポンス: ${JSON.stringify(json).slice(0, 300)}`);
  }

  const fileName = `${d.id}.png`;
  fs.writeFileSync(path.join(imagesDir, fileName), buffer);
  manifest[d.id] = {
    file: fileName,
    prompt: d.prompt,
    size: d.size,
    model: MODEL,
    promptHash: p.hash,
    generatedAt: new Date().toISOString(),
  };
  console.log(`  保存: images/${fileName} (${Math.round(buffer.length / 1024)} KB)`);
}

fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

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

console.log(`完了: 生成 ${toGenerate.length}件 / スキップ ${plan.length - toGenerate.length}件`);
console.log("注意: note へは手動アップロードが必要です(note に画像APIはありません)。");
