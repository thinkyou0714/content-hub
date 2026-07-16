// note収益化パイプラインのテスト。実行: npm run test:pipeline
// 純粋関数のユニットテストと、CONTENT_HUB_ROOT を一時ディレクトリに向けた
// スクリプト実行の統合テスト(外部APIは呼ばない)。
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  aggregateRevenue,
  appendToSection,
  findMalformedDirectiveLines,
  injectImageLinks,
  parseImageDirectives,
  parseRevenueCsv,
  placeholderPng,
  promptHash,
  summarizeDiff,
  todayStamp,
  updateMeta,
  validateDirective,
} from "../lib/pipeline-lib.mjs";

const TOOLS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SAMPLE_MD = [
  "# タイトル",
  "",
  "<!-- gpt-image: 001-hero | 1536x1024 | ヘッダー画像 | 夜のデスクでPCに向かう人物 -->",
  "",
  "本文の段落。",
  "",
  "<!-- gpt-image: 002-diagram | 1024x1024 |  | フローの図解 -->",
  "",
  "<!-- ただのコメントは無視される -->",
].join("\n");

test("parseImageDirectives: ディレクティブを抽出しコメントは無視する", () => {
  const ds = parseImageDirectives(SAMPLE_MD);
  assert.equal(ds.length, 2);
  assert.deepEqual(
    { id: ds[0].id, size: ds[0].size, alt: ds[0].alt, prompt: ds[0].prompt },
    {
      id: "001-hero",
      size: "1536x1024",
      alt: "ヘッダー画像",
      prompt: "夜のデスクでPCに向かう人物",
    },
  );
  assert.equal(ds[1].alt, "");
});

test("parseImageDirectives: インデントされたディレクティブも拾う", () => {
  const md = "1. リスト\n   <!-- gpt-image: in-list | 1024x1024 | 図 | リスト内の図解 -->";
  const ds = parseImageDirectives(md);
  assert.equal(ds.length, 1);
  assert.equal(ds[0].id, "in-list");
});

test("findMalformedDirectiveLines: 書式不備(フィールド不足)を検出する", () => {
  const md = [
    "<!-- gpt-image: ok | 1024x1024 | 図 | 正しい行 -->",
    "<!-- gpt-image: broken | 1024x1024 | フィールドが足りない -->",
    "<!-- 普通のコメント -->",
  ].join("\n");
  assert.deepEqual(findMalformedDirectiveLines(md), [1]);
});

test("appendToSection: 指定セクションの末尾(次の##の前)に挿入する", () => {
  const root = makeTmpRoot();
  const file = path.join(root, "learnings.md");
  fs.writeFileSync(
    file,
    ["# メモリ", "", "## 自動抽出(未確認)", "", "## 後続セクション", "", "本文", ""].join("\n"),
  );
  assert.equal(appendToSection(file, "## 自動抽出(未確認)", "### 2026-07-16 slug\n\n- ルール\n"), true);
  const out = fs.readFileSync(file, "utf8");
  const autoIdx = out.indexOf("### 2026-07-16 slug");
  const nextIdx = out.indexOf("## 後続セクション");
  assert.ok(autoIdx !== -1 && autoIdx < nextIdx, out);
  assert.equal(appendToSection(file, "## 存在しない節", "- x\n"), false);
});

test("validateDirective: 不正なid・sizeを検出する", () => {
  assert.equal(validateDirective({ id: "001-hero", size: "1536x1024", prompt: "x" }).length, 0);
  assert.equal(validateDirective({ id: "001-hero", size: "auto", prompt: "x" }).length, 0);
  assert.ok(validateDirective({ id: "Bad_ID", size: "1024x1024", prompt: "x" }).length > 0);
  assert.ok(validateDirective({ id: "ok", size: "big", prompt: "x" }).length > 0);
  assert.ok(validateDirective({ id: "ok", size: "1024x1024", prompt: "" }).length > 0);
});

test("promptHash: プロンプトかサイズが変わればハッシュも変わる", () => {
  const a = promptHash({ prompt: "p", size: "1024x1024" });
  assert.equal(a, promptHash({ prompt: "p", size: "1024x1024" }));
  assert.notEqual(a, promptHash({ prompt: "q", size: "1024x1024" }));
  assert.notEqual(a, promptHash({ prompt: "p", size: "auto" }));
});

test("injectImageLinks: 挿入は冪等で、2回目は置換になる", () => {
  const entries = [
    { id: "001-hero", alt: "ヘッダー画像", relPath: "images/001-hero.png" },
    { id: "002-diagram", alt: "002-diagram", relPath: "images/002-diagram.png" },
  ];
  const once = injectImageLinks(SAMPLE_MD, entries);
  assert.ok(once.includes("![ヘッダー画像](images/001-hero.png)"));
  assert.ok(once.includes("![002-diagram](images/002-diagram.png)"));
  const twice = injectImageLinks(once, entries);
  assert.equal(twice, once);
  const count = twice.split("images/001-hero.png").length - 1;
  assert.equal(count, 1);
});

test("injectImageLinks: ディレクティブとリンクの間に空行があっても重複しない", () => {
  const entries = [{ id: "001-hero", alt: "図", relPath: "images/001-hero.png" }];
  const md = [
    "<!-- gpt-image: 001-hero | 1536x1024 | 図 | プロンプト -->",
    "",
    "![古いalt](images/001-hero.png)",
    "",
    "本文",
  ].join("\n");
  const out = injectImageLinks(md, entries);
  assert.equal(out.split("images/001-hero.png").length - 1, 1);
  assert.ok(out.includes("![図](images/001-hero.png)"));
  assert.ok(out.includes("本文"));
});

test("parseRevenueCsv + aggregateRevenue: 月別に売上を集計する", () => {
  const csv = [
    "date,slug,unit_price_jpy,units,memo",
    "2026-07-01,article-a,1000,3,X告知経由",
    "2026-07-15,article-b,2980,1,",
    "2026-08-02,article-a,1000,2,",
    "invalid-line-without-date,,,,",
  ].join("\n");
  const monthly = aggregateRevenue(parseRevenueCsv(csv));
  assert.deepEqual(monthly.get("2026-07"), { revenue: 5980, units: 4 });
  assert.deepEqual(monthly.get("2026-08"), { revenue: 2000, units: 2 });
  assert.equal(monthly.size, 2);
});

test("placeholderPng: 有効なPNG署名を持つバッファを返す", () => {
  const png = placeholderPng(32, 16);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.length > 50);
  assert.ok(png.subarray(-8).toString("latin1").includes("IEND"));
});

test("updateMeta: meta.json があれば patch をマージし、無ければ何もしない", () => {
  const root = makeTmpRoot();
  const workDir = path.join(root, "w");
  fs.mkdirSync(workDir, { recursive: true });
  assert.equal(updateMeta(workDir, { status: "x" }), null); // meta.json なし
  fs.writeFileSync(path.join(workDir, "meta.json"), JSON.stringify({ slug: "w", status: "draft" }));
  const next = updateMeta(workDir, { status: "images" });
  assert.equal(next.status, "images");
  assert.equal(next.slug, "w");
  assert.ok(next.updated_at);
});

test("summarizeDiff: 追加・削除行を数える(ヘッダは除外)", () => {
  const diff = ["--- a/draft.md", "+++ b/final.md", "@@ -1,2 +1,2 @@", "-古い行", "+新しい行", "+追加行"].join("\n");
  assert.deepEqual(summarizeDiff(diff), { added: 2, removed: 1 });
});

test("todayStamp: YYYY-MM-DD 形式(JST)を返す", () => {
  assert.match(todayStamp(), /^\d{4}-\d{2}-\d{2}$/);
  // UTC 2026-01-01 20:00 は JST では翌日
  assert.equal(todayStamp(new Date("2026-01-01T20:00:00Z")), "2026-01-02");
});

// ---------------------------------------------------------------------------
// 統合テスト: 一時ディレクトリをリポジトリルートに見立ててスクリプトを実行する
// ---------------------------------------------------------------------------

function runScript(script, scriptArgs, root, extraEnv = {}) {
  const env = { ...process.env, CONTENT_HUB_ROOT: root, ...extraEnv };
  // 自動抽出(API呼び出し)が誤って走らないようにキーを外す
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  delete env.OPENAI_API_KEY;
  return spawnSync("node", [path.join(TOOLS_DIR, script), ...scriptArgs], {
    encoding: "utf8",
    env,
  });
}

function makeTmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "content-hub-test-"));
}

test("note-new: ワークスペースを作成する", () => {
  const root = makeTmpRoot();
  const res = runScript("note-new.mjs", ["test-article", "--title", "テスト記事"], root);
  assert.equal(res.status, 0, res.stderr);
  const draft = fs.readFileSync(path.join(root, "note", "works", "test-article", "draft.md"), "utf8");
  assert.ok(draft.startsWith("# テスト記事"));
  assert.ok(draft.includes("gpt-image:"));
  const meta = JSON.parse(
    fs.readFileSync(path.join(root, "note", "works", "test-article", "meta.json"), "utf8"),
  );
  assert.equal(meta.slug, "test-article");

  // 同じslugでの再実行はエラー
  const again = runScript("note-new.mjs", ["test-article"], root);
  assert.equal(again.status, 1);
});

test("note-new: --title がslugより前でも正しく解釈される", () => {
  const root = makeTmpRoot();
  const res = runScript("note-new.mjs", ["--title", "daily-notes", "my-article"], root);
  assert.equal(res.status, 0, res.stderr);
  const draft = fs.readFileSync(path.join(root, "note", "works", "my-article", "draft.md"), "utf8");
  assert.ok(draft.startsWith("# daily-notes"));
});

test("note-images --dry-run: APIを呼ばず、プレースホルダーは保留になる", () => {
  const root = makeTmpRoot();
  runScript("note-new.mjs", ["img-test"], root);
  const res = runScript("note-images.mjs", ["img-test", "--dry-run"], root);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes("001-hero"));
  // scaffoldのプロンプトは【…】プレースホルダーのため課金APIに送らない
  assert.ok(res.stdout.includes("保留"), res.stdout);
  assert.ok(res.stdout.includes("--dry-run"));
});

test("note-images: 書式不備のディレクティブはエラーで止まる", () => {
  const root = makeTmpRoot();
  runScript("note-new.mjs", ["bad-directive"], root);
  const draftPath = path.join(root, "note", "works", "bad-directive", "draft.md");
  fs.appendFileSync(draftPath, "\n<!-- gpt-image: broken | 1024x1024 | フィールド不足 -->\n");
  const res = runScript("note-images.mjs", ["bad-directive", "--dry-run"], root);
  assert.equal(res.status, 1);
  assert.ok(res.stderr.includes("書式が不正"), res.stderr);
});

test("note-kpi: 不正な --month / --target はエラー終了する", () => {
  const root = makeTmpRoot();
  const kpiDir = path.join(root, "note", "kpi");
  fs.mkdirSync(kpiDir, { recursive: true });
  fs.writeFileSync(path.join(kpiDir, "revenue.csv"), "date,slug,unit_price_jpy,units,memo\n");
  assert.equal(runScript("note-kpi.mjs", ["--month", "2026-7"], root).status, 1);
  assert.equal(runScript("note-kpi.mjs", ["--target", "abc"], root).status, 1);
  assert.equal(runScript("note-kpi.mjs", ["--target"], root).status, 1); // 値の指定漏れ
});

test("note-learn: 差分を保存しPENDINGに登録する(APIキーなし)", () => {
  const root = makeTmpRoot();
  runScript("note-new.mjs", ["learn-test"], root);
  const workDir = path.join(root, "note", "works", "learn-test");
  const draft = fs.readFileSync(path.join(workDir, "draft.md"), "utf8");
  fs.writeFileSync(path.join(workDir, "final.md"), draft.replace("無料部分", "無料パート"));

  const res = runScript("note-learn.mjs", ["learn-test"], root);
  assert.equal(res.status, 0, res.stderr);

  const editsDir = path.join(root, "content-hub", "memory", "edits");
  const files = fs.readdirSync(editsDir);
  assert.ok(files.some((f) => f.endsWith("-learn-test.diff")), files.join(","));
  const pending = fs.readFileSync(path.join(editsDir, "PENDING.md"), "utf8");
  assert.ok(pending.includes("learn-test"));

  // 差分がない場合は何も学習しない
  fs.writeFileSync(path.join(workDir, "final.md"), draft);
  const noDiff = runScript("note-learn.mjs", ["learn-test"], root);
  assert.equal(noDiff.status, 0);
  assert.ok(noDiff.stdout.includes("差分はありません"));
});

test("note-kpi: 月別売上と目標進捗を表示する", () => {
  const root = makeTmpRoot();
  const kpiDir = path.join(root, "note", "kpi");
  fs.mkdirSync(kpiDir, { recursive: true });
  fs.writeFileSync(
    path.join(kpiDir, "revenue.csv"),
    ["date,slug,unit_price_jpy,units,memo", "2026-07-01,a,1000,3,", "2026-07-10,b,2980,1,"].join("\n"),
  );
  const res = runScript("note-kpi.mjs", ["--month", "2026-07", "--target", "100000"], root);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes("5,980円"), res.stdout);
  assert.ok(res.stdout.includes("2026-07"));
});

test("note-images --mock: 課金なしで画像生成・リンク挿入し、実生成時は置換対象になる", () => {
  const root = makeTmpRoot();
  runScript("note-new.mjs", ["mock-test"], root);
  const draftPath = path.join(root, "note", "works", "mock-test", "draft.md");
  // scaffoldのプレースホルダー行を実プロンプトに置き換える
  let draft = fs.readFileSync(draftPath, "utf8");
  draft = draft.replace(/<!-- gpt-image:[^>]*-->/, "<!-- gpt-image: hero | 1024x1024 | 図 | 実プロンプト -->");
  fs.writeFileSync(draftPath, draft);

  const res = runScript("note-images.mjs", ["mock-test", "--mock"], root);
  assert.equal(res.status, 0, res.stderr);

  const imagesDir = path.join(root, "note", "works", "mock-test", "images");
  const png = fs.readFileSync(path.join(imagesDir, "hero.png"));
  assert.deepEqual([...png.subarray(0, 4)], [137, 80, 78, 71]); // PNG署名
  const manifest = JSON.parse(fs.readFileSync(path.join(imagesDir, "manifest.json"), "utf8"));
  assert.equal(manifest.hero.mock, true);
  assert.ok(fs.readFileSync(draftPath, "utf8").includes("![図](images/hero.png)"));

  // mock再実行は冪等(スキップ)
  const again = runScript("note-images.mjs", ["mock-test", "--mock"], root);
  assert.ok(again.stdout.includes("スキップ"), again.stdout);

  // 実生成モード(--mockなし)ではmock画像は再生成対象
  const real = runScript("note-images.mjs", ["mock-test", "--dry-run"], root);
  assert.ok(real.stdout.match(/\[生成\].*hero/), real.stdout);
});

test("note-doctor: 環境と原稿を診断し、書式不備は非0で終了する", () => {
  const root = makeTmpRoot();
  runScript("note-new.mjs", ["doc-test"], root);
  // 正常な原稿(プレースホルダー警告は出るがエラーではない)
  const ok = runScript("note-doctor.mjs", ["doc-test"], root);
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(ok.stdout.includes("診断:"));

  // 書式不備を入れるとエラー終了
  const draftPath = path.join(root, "note", "works", "doc-test", "draft.md");
  fs.appendFileSync(draftPath, "\n<!-- gpt-image: broken | 1024x1024 | 不足 -->\n");
  const ng = runScript("note-doctor.mjs", ["doc-test"], root);
  assert.equal(ng.status, 1);

  // 存在しないslugはエラー
  assert.equal(runScript("note-doctor.mjs", ["no-such"], root).status, 1);
});

test("note-status: 記事の段階を一覧表示する", () => {
  const root = makeTmpRoot();
  assert.equal(runScript("note-new.mjs", ["art-one"], root).status, 0);
  assert.equal(runScript("note-new.mjs", ["art-two"], root).status, 0);
  // art-two は final.md を作って「修正済」段階にする
  fs.writeFileSync(path.join(root, "note", "works", "art-two", "final.md"), "完成稿");
  const res = runScript("note-status.mjs", [], root);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes("art-one"));
  assert.ok(res.stdout.includes("art-two"));
  assert.ok(res.stdout.includes("下書き"));
  assert.ok(res.stdout.includes("修正済"));
});
