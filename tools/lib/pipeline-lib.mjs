// note収益化パイプライン 共有ライブラリ
// Node.js 18+ / 標準モジュールのみ。パス解決は CONTENT_HUB_ROOT 環境変数で上書き可能(テスト用)。
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = process.env.CONTENT_HUB_ROOT
  ? path.resolve(process.env.CONTENT_HUB_ROOT)
  : path.resolve(__dirname, "..", "..");

export const NOTE_DIR = path.join(REPO_ROOT, "note");
export const WORKS_DIR = path.join(NOTE_DIR, "works");
export const REVENUE_CSV = path.join(NOTE_DIR, "kpi", "revenue.csv");
export const MEMORY_DIR = path.join(REPO_ROOT, "content-hub", "memory");
export const EDITS_DIR = path.join(MEMORY_DIR, "edits");
export const PENDING_FILE = path.join(EDITS_DIR, "PENDING.md");
export const LEARNINGS_FILE = path.join(MEMORY_DIR, "edit-learnings.md");
export const EDIT_LEARNING_PROMPT = path.join(
  REPO_ROOT,
  "content-hub",
  "prompts",
  "edit-learning.md",
);

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// ユーザー向け表示用の相対パス
export function relFromRepo(p) {
  return path.relative(REPO_ROOT, p);
}

export function readFileIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 画像ディレクティブ
//   <!-- gpt-image: <id> | <size> | <alt> | <プロンプト> -->
//   例: <!-- gpt-image: 001-hero | 1536x1024 | 夜のデスクの図 | 夜の自宅デスクでPCに向かう人物、暖色 -->
// ---------------------------------------------------------------------------

// 行頭インデントは許容する(リスト内などに書かれるため)
const DIRECTIVE_RE = /^\s*<!--\s*gpt-image:\s*([^|]+)\|([^|]+)\|([^|]*)\|(.+?)\s*-->\s*$/;

// 【人間: 記入】等のプレースホルダー検出(未記入プロンプトを課金APIに送らないため)
export const PLACEHOLDER_RE = /[【】]/;

// 書式の単一ソース。scaffold・ヘルプ表示はこれを使う
export const DIRECTIVE_FORMAT =
  "<!-- gpt-image: <id> | <サイズ> | <代替テキスト> | <画像プロンプト> -->";
export const DIRECTIVE_EXAMPLE =
  "<!-- gpt-image: 001-hero | 1536x1024 | 代替テキスト | 画像の内容を表すプロンプト -->";

// gpt-image と書かれているのに正しい書式にならなかった行を検出する
// (黙って無視すると「画像が生成されない」原因が分からなくなるため)
export function findMalformedDirectiveLines(markdown) {
  const valid = new Set(parseImageDirectives(markdown).map((d) => d.line));
  const malformed = [];
  markdown.split("\n").forEach((line, index) => {
    if (/<!--\s*gpt-image/.test(line) && !valid.has(index)) {
      malformed.push(index);
    }
  });
  return malformed;
}

export function parseImageDirectives(markdown) {
  const lines = markdown.split("\n");
  const directives = [];
  lines.forEach((line, index) => {
    const m = line.match(DIRECTIVE_RE);
    if (!m) return;
    directives.push({
      id: m[1].trim(),
      size: m[2].trim(),
      alt: m[3].trim(),
      prompt: m[4].trim(),
      line: index,
    });
  });
  return directives;
}

export function validateDirective(d) {
  const errors = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(d.id)) {
    errors.push(`id が不正: "${d.id}"(使えるのは英小文字・数字・ハイフン)`);
  }
  if (!/^(auto|\d{3,4}x\d{3,4})$/.test(d.size)) {
    errors.push(`size が不正: "${d.size}"(例: 1536x1024 / 1024x1024 / auto)`);
  }
  if (!d.prompt) {
    errors.push("画像プロンプトが空");
  }
  return errors;
}

export function promptHash(d) {
  return crypto
    .createHash("sha256")
    .update(`${d.prompt}\n${d.size}`)
    .digest("hex")
    .slice(0, 16);
}

// ディレクティブ行の直後に画像リンクを挿入する(冪等)。
// 直後(空行を挟んでもよい)に同じ画像ファイルへのリンクが既にあれば置換する。
// entries: [{ id, alt, relPath }]
export function injectImageLinks(markdown, entries) {
  const lines = markdown.split("\n");
  const byLine = new Map();
  for (const d of parseImageDirectives(markdown)) byLine.set(d.line, d);

  const out = [];
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    const d = byLine.get(i);
    if (!d) continue;
    const entry = entries.find((e) => e.id === d.id);
    if (!entry) continue;

    // 空行をスキップして既存リンクを探す
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j += 1;
    const candidate = lines[j] ?? "";
    const isExistingLink =
      candidate.trim().startsWith("![") && candidate.includes(`](${entry.relPath})`);

    const link = `![${entry.alt}](${entry.relPath})`;
    if (isExistingLink) {
      for (let k = i + 1; k < j; k++) out.push(lines[k]); // 間の空行は保持
      i = j; // 既存リンク行は置換
    }
    out.push(link);
  }
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// 収益CSV: note/kpi/revenue.csv
//   ヘッダ: date,slug,unit_price_jpy,units,memo
// ---------------------------------------------------------------------------

export const REVENUE_CSV_HEADER = "date,slug,unit_price_jpy,units,memo";

export function parseRevenueCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line, index) => {
    const cols = line.split(",");
    const row = { _line: index + 2 };
    header.forEach((h, i) => {
      row[h] = (cols[i] ?? "").trim();
    });
    return row;
  });
}

// 月別集計。戻り値: Map<"YYYY-MM", { revenue, units }>
export function aggregateRevenue(rows) {
  const monthly = new Map();
  for (const row of rows) {
    const month = String(row.date ?? "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const units = Number(row.units);
    const amount = Number(row.unit_price_jpy) * units;
    if (!Number.isFinite(amount)) continue; // units か単価が不正な行はまとめて除外
    const cur = monthly.get(month) ?? { revenue: 0, units: 0 };
    cur.revenue += amount;
    cur.units += units;
    monthly.set(month, cur);
  }
  return monthly;
}

// ---------------------------------------------------------------------------
// 差分・日付ユーティリティ
// ---------------------------------------------------------------------------

export function summarizeDiff(diffText) {
  let added = 0;
  let removed = 0;
  for (const line of diffText.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) added += 1;
    else if (line.startsWith("-") && !line.startsWith("---")) removed += 1;
  }
  return { added, removed };
}

// JST基準の YYYY-MM-DD
export function todayStamp(d = new Date()) {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

// JST基準の YYYY-MM
export function currentMonth(d = new Date()) {
  return todayStamp(d).slice(0, 7);
}

// Markdownファイルの末尾が改行1つで終わるよう正規化して追記する
export function appendMarkdown(file, chunk) {
  let base = readFileIfExists(file) ?? "";
  if (base !== "" && !base.endsWith("\n")) base += "\n";
  fs.writeFileSync(file, base + chunk);
}

// 指定した「## 見出し」セクションの末尾(次の ## の直前、無ければファイル末尾)に追記する。
// 見出しが見つからなければ false を返す(呼び出し側でフォールバックする)。
export function appendToSection(file, sectionHeading, chunk) {
  const content = readFileIfExists(file);
  if (content === null) return false;
  const lines = content.split("\n");
  const start = lines.findIndex((l) => l.trim() === sectionHeading);
  if (start === -1) return false;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  // セクション末尾の余分な空行を取り除いてから追記する
  let insertAt = end;
  while (insertAt > start + 1 && lines[insertAt - 1].trim() === "") insertAt -= 1;
  const before = lines.slice(0, insertAt).join("\n");
  const after = lines.slice(end).join("\n");
  const tail = after === "" ? "\n" : `\n\n${after}`;
  fs.writeFileSync(file, `${before}\n${chunk.replace(/\n+$/, "")}${tail}`);
  return true;
}
