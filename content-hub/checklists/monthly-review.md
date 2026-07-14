# チェックリスト: 月次レビュー

月1回(月初推奨・60分)。数字の確認だけでなく、**このハブ自体を更新する**のが目的。
分析・集計・改善案の草案はAIに任せ、人間は判断だけを行う。

## 1. 数字の確認(15分)

- [ ] [../strategy/kpi.md](../strategy/kpi.md) の月次記録テーブルに今月の数字を追記
- [ ] 週次記録([../workflows/weekly-routine.md](../workflows/weekly-routine.md))から「伸びた型/滑った型」をAIに集計させる
- [ ] 北極星指標(読者の行動: 試した報告・質問・購入)の発生を数える

## 2. 資産の更新(20分)

- [ ] 伸びた型を [../templates/x-post-patterns.md](../templates/x-post-patterns.md) に反映(滑り続ける型は注記 or 削除)
- [ ] 差し戻しが多かったプロンプト([../prompts/](../prompts/))を修正してコミット
- [ ] ベストプラクティス([../best-practices/](../best-practices/))で「現実と合わなくなった項目」を更新
- [ ] ネタ帳([../research/idea-backlog.md](../research/idea-backlog.md))の棚卸し(鮮度30日超のトレンドネタを見送りへ)

## 3. 外部環境の確認(15分)

- [ ] Grokで月次トレンドスキャン([../research/trend-research.md](../research/trend-research.md) プロンプト1)
- [ ] プラットフォーム規約・ガイドラインの変更確認(Zenn公式(info.zenn.dev) / noteヘルプ / Xポリシー)
- [ ] 調査ノート([../research/notes/](../research/notes/))の鮮度確認。古くなったら再調査をAIに依頼

## 4. 戦略判断(10分・人間のみ)

- [ ] フェーズ([../strategy/kpi.md](../strategy/kpi.md))の移行判断
- [ ] 柱([../strategy/content-pillars.md](../strategy/content-pillars.md))の比率調整・入れ替え
- [ ] 有料化・新チャネルなど不可逆寄りの判断(迷ったら翌月に持ち越してよい)
- [ ] 人間タスクの負荷確認: 週5時間を超えていたら、削るのは発信量であって品質ゲートではない

## 完了条件

このチェックリストを終えた状態 = 「ハブが今月の学びで1段賢くなっている」こと。
数字を見ただけで資産(型・プロンプト・BP)が何も更新されていない月次レビューは失敗とみなす。
