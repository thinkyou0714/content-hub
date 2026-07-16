#!/usr/bin/env node
// note/kpi/revenue.csv を集計し、月10万円目標に対する進捗を表示する。
// 使い方: npm run note:kpi [-- --month 2026-07] [--target 100000]
// 環境変数: NOTE_MONTHLY_TARGET_JPY(省略時 100000)
import path from "node:path";
import {
  REPO_ROOT,
  REVENUE_CSV,
  aggregateRevenue,
  currentMonth,
  parseRevenueCsv,
  readFileIfExists,
} from "./lib/pipeline-lib.mjs";

const args = process.argv.slice(2);
const monthIndex = args.indexOf("--month");
const targetIndex = args.indexOf("--target");
const focusMonth = monthIndex >= 0 ? args[monthIndex + 1] : currentMonth();
const target = Number(
  targetIndex >= 0 ? args[targetIndex + 1] : process.env.NOTE_MONTHLY_TARGET_JPY || 100000,
);

const yen = (n) => `${Math.round(n).toLocaleString("ja-JP")}円`;

const csv = readFileIfExists(REVENUE_CSV);
if (csv === null) {
  console.error(`売上CSVが見つかりません: ${path.relative(REPO_ROOT, REVENUE_CSV)}`);
  console.error("ヘッダ行: date,slug,unit_price_jpy,units,memo");
  process.exit(1);
}

const rows = parseRevenueCsv(csv);
const monthly = aggregateRevenue(rows);
const months = [...monthly.keys()].sort();

if (months.length === 0) {
  console.log("売上記録がまだありません。売れたら revenue.csv に1行追加してください。");
  console.log("例: 2026-07-16,n8n-approval-flow,1000,2,X告知経由");
  process.exit(0);
}

console.log(`月次売上(目標: ${yen(target)}/月)`);
console.log("");
console.log("  年月     | 売上        | 販売数 | 目標達成率");
console.log("  ---------|-------------|--------|-----------");
for (const m of months) {
  const { revenue, units } = monthly.get(m);
  const rate = ((revenue / target) * 100).toFixed(1);
  const mark = m === focusMonth ? " ←今月" : "";
  console.log(
    `  ${m}  | ${yen(revenue).padStart(11)} | ${String(units).padStart(4)}部 | ${rate.padStart(6)}%${mark}`,
  );
}

console.log("");
const focus = monthly.get(focusMonth) ?? { revenue: 0, units: 0 };
const remaining = Math.max(0, target - focus.revenue);
console.log(`${focusMonth} の売上: ${yen(focus.revenue)}(残り ${yen(remaining)})`);

if (remaining > 0) {
  const avgPrice = focus.units > 0 ? focus.revenue / focus.units : null;
  if (avgPrice) {
    console.log(
      `  今月の平均単価 ${yen(avgPrice)} なら、あと ${Math.ceil(remaining / avgPrice)}部で目標到達`,
    );
  }
  for (const price of [1000, 2980, 4980]) {
    console.log(`  単価 ${yen(price)} なら、あと ${Math.ceil(remaining / price)}部`);
  }
} else {
  console.log("  今月の目標を達成しています。");
}

const last3 = months.slice(-3);
if (last3.length >= 2) {
  const avg = last3.reduce((sum, m) => sum + monthly.get(m).revenue, 0) / last3.length;
  console.log(`直近${last3.length}ヶ月の平均: ${yen(avg)}/月`);
}
