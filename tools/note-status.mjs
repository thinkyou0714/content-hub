#!/usr/bin/env node
// note記事のパイプライン状況を一覧表示する。
// 各記事が draft → images → final → published のどこにいるかと、今月の売上スナップショットを出す。
// 使い方: npm run note:status
import fs from "node:fs";
import path from "node:path";
import {
  REVENUE_CSV,
  WORKS_DIR,
  aggregateRevenue,
  currentMonth,
  parseRevenueCsv,
  pipelineStage,
  readFileIfExists,
  readMeta,
} from "./lib/pipeline-lib.mjs";

const STAGE_LABEL = {
  draft: "① 下書き",
  images: "② 画像済",
  final: "③ 修正済",
  published: "④ 公開済",
};

function listWorks() {
  if (!fs.existsSync(WORKS_DIR)) return [];
  return fs
    .readdirSync(WORKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

const slugs = listWorks();
console.log("note記事のパイプライン状況");
console.log("");

if (slugs.length === 0) {
  console.log("  記事がありません。npm run note:new -- <slug> で作成してください。");
} else {
  console.log("  段階     | slug                     | タイトル");
  console.log("  ---------|--------------------------|--------------------");
  for (const slug of slugs) {
    const workDir = path.join(WORKS_DIR, slug);
    const stage = pipelineStage(workDir);
    const meta = readMeta(workDir);
    const title = meta?.title ?? "(未設定)";
    console.log(`  ${STAGE_LABEL[stage].padEnd(8)} | ${slug.padEnd(24).slice(0, 24)} | ${title}`);
  }

  const counts = { draft: 0, images: 0, final: 0, published: 0 };
  for (const slug of slugs) counts[pipelineStage(path.join(WORKS_DIR, slug))] += 1;
  console.log("");
  console.log(
    `  内訳: 下書き ${counts.draft} / 画像済 ${counts.images} / 修正済 ${counts.final} / 公開済 ${counts.published}`,
  );
}

console.log("");
const csv = readFileIfExists(REVENUE_CSV);
if (csv !== null) {
  const monthly = aggregateRevenue(parseRevenueCsv(csv));
  const month = currentMonth();
  const cur = monthly.get(month);
  if (cur) {
    const yen = `${Math.round(cur.revenue).toLocaleString("ja-JP")}円`;
    console.log(`今月(${month})の売上: ${yen}(${cur.units}部) — 詳細は npm run note:kpi`);
  } else {
    console.log(`今月(${month})の売上記録はまだありません。`);
  }
}
