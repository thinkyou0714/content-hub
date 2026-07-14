# 収益化(BP-071〜BP-080)

無料の発信で価値を実証してから有料化するまでの順序、経路ごとの相場観、誇大表示を避ける公開作法を定める。「稼げる」を売るのではなく、再現手順と時短の対価として収益化するのが本ハブの一貫した立場である。カテゴリ全体の一覧は [README(索引)](README.md) に戻って参照すること。

## BP-071: 無料で価値を実証してから有料化する

- **要点**: Zenn/Xで無料公開して反応が実証されたテーマだけを有料化する。この順序を逆にしない
- **根拠**: 読者は再現性のあるノウハウを好み、無料での実証が信頼と購入率の担保になる (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。KPIでも有料初出しは「反応の良い型が3つ以上」のPhase 2以降と定義済み
- **実装**: [content-pipeline.md](../workflows/content-pipeline.md) の工程8-9(需要実証→note検討)に従う。noteの有料化条件は [channels.md](../strategy/channels.md) の運用ルール準拠
- **関連**: BP-073、BP-080、[kpi.md](../strategy/kpi.md)

## BP-072: Zenn本は実践チュートリアル型・種まき先行で出す

- **要点**: 売れ筋の実践チュートリアル型で構成し、リリース前からXで各章のテーマを種まきしてから発売する
- **根拠**: Zenn本は実践チュートリアル系が売れ筋で1,000〜2,000円帯が多い(実質手数料13.6%)。1,200円の本を発売前にXで種まきしてトレンド2位、1週間で5万円に達した好例がある (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))
- **実装**: シリーズ戦略([content-pillars.md](../strategy/content-pillars.md))の「先にXで小出し」手順を流用する。無料連載の末尾に本へのリンクを置き、連載と被らない章を本に収録する
- **関連**: BP-071、BP-080、[zenn-article-template.md](../templates/zenn-article-template.md)

## BP-073: 有料noteは乱発せず「再現性」を売る

- **要点**: 月0〜1本に抑え、「稼げる情報」ではなく再現手順・テンプレ・時短の対価として販売する
- **根拠**: noteの売れ筋は100〜5,000円で、読者は再現性のあるノウハウを好む。売れる構成の型は問題提起→共感→結論→実行ステップ→テンプレ→実例・数字→CTA(販売者発信・確度低) (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))
- **実装**: [note-paid-article.md](../prompts/note-paid-article.md) と [note-article-template.md](../templates/note-article-template.md) で生成し、頻度・条件は [channels.md](../strategy/channels.md) に従う
- **関連**: BP-071、BP-078、[persona.md](../strategy/persona.md)

## BP-074: Kindle並行出版で同一資産を三次利用する

- **要点**: Zenn本・note化が済んだテーマを再構成してKDPでも出版し、書き下ろしを増やさずに販売チャネルを増やす
- **根拠**: KDPは印税70%+KU報酬の設計で、月5〜7万円の実践者例がある(確度低) (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。同一ソースの多面展開はハブの設計思想そのものである
- **実装**: [repurpose.md](../prompts/repurpose.md) の展開の考え方を長編に適用し、原稿はcontent-hub起点で章構成だけ変えて生成する。出版アカウント・税務はHT-5として人間が管理([human-tasks.md](../workflows/human-tasks.md))
- **関連**: BP-072、BP-077

## BP-075: 記事を営業資産にして構築代行案件を獲る

- **要点**: n8n構築・自動化の実録記事を提案書代わりに使い、単価最大の収益経路である案件獲得につなげる
- **根拠**: n8n構築代行の相場は基本設定5万円〜、システム連携15万円〜、AIフル自動化30万円〜、企業PoCは50〜200万円。技術記事10本で書類通過率が約2倍になった事例もある (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))
- **実装**: PILLAR-1記事([n8n-claudecode-automation-overview.md](../../articles/n8n-claudecode-automation-overview.md) 等)に検証環境・構成図を必ず含め、Xプロフィールと固定ポストから導線を張る([channels.md](../strategy/channels.md))
- **関連**: BP-077、BP-079、BP-090

## BP-076: AI学習対価還元などの新収益は「置くだけ」で拾う

- **要点**: noteのAI学習対価還元のような新制度は、追加執筆ゼロで載る収益として設定を確認して早めに拾う。ただし主柱にはしない
- **根拠**: 2025年8月開始のnote「AI学習対価還元プログラム」は全テキストが対価還元対象で、有料販売+AI還元の二重収益が2026年の狙い目との解説がある (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。新制度は改定リスクが高い
- **実装**: 月次レビュー([monthly-review.md](../checklists/monthly-review.md))でプラットフォームの新制度を確認し、設定変更・受取口座はHT-5として人間が扱う([human-tasks.md](../workflows/human-tasks.md))
- **関連**: BP-077、[2026-07-ai-ops-legal.md](../research/notes/2026-07-ai-ops-legal.md)

## BP-077: 収益源を分散し単一経路に依存しない

- **要点**: Zenn本・有料note・Kindle・案件獲得の複数経路を段階的に持ち、1経路の不調や規約変更が収益全体を止めない構造にする
- **根拠**: 経路ごとに難易度と単価が大きく異なり(Zenn本=中、案件=高難度だが単価最大)、Zennは広告・アフィリエイト不可で技術ジャンルのアフィは低リターン (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。KPIのPhase 3も収益源の分散を掲げる
- **実装**: [kpi.md](../strategy/kpi.md) のフェーズ定義に沿って経路を順に追加し、月次レビューで経路別の数字を記録する
- **関連**: BP-071〜BP-075、[monthly-review.md](../checklists/monthly-review.md)

## BP-078: 収益公開は期間・コスト・前提を併記する

- **要点**: 収益を公開するときは必ず期間・かかったコスト・作業時間・前提条件をセットで書く。収益スクショ単体の提示はしない
- **根拠**: 「月収100万」「誰でも稼げる」型は消費者庁が繰り返し注意喚起する優良誤認の典型で、課徴金は対象売上の3%。収益スクショ提示からLINE誘導・高額コンサルに至る構図には逮捕事例もある (出典: [調査ノート](../research/notes/2026-07-ai-ops-legal.md))
- **実装**: [mission.md](../strategy/mission.md) のリスク明示主義に従い、公開前に [x-pre-post.md](../checklists/x-pre-post.md) と [zenn-pre-publish.md](../checklists/zenn-pre-publish.md) の表現チェックを通す
- **関連**: BP-080、BP-082、BP-083

## BP-079: 飽和ジャンル(単純AI作業系)に参入しない

- **要点**: AIライティング・文字起こし等の単純作業系や、プロンプト販売・汎用AI活用noteの類には参入せず、「自動化の仕組み化」側で発信・収益化する
- **根拠**: 単純作業系は単価急落・1案件数十人応募の飽和状態にある。伸びているのは仕組み化そのもので、2026年最大トレンドは「AIエージェントの設定・管理請負」とされ先行者優位がある (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))
- **実装**: 収益ネタは記事化前に [trend-research.md](../research/trend-research.md) の飽和チェックプロンプトを必ず通し、柱([content-pillars.md](../strategy/content-pillars.md))から外れるものは採用しない
- **関連**: BP-075、[idea-backlog.md](../research/idea-backlog.md)

## BP-080: 値付けは「時短と再現性の対価」で決める

- **要点**: 価格は情報の希少性や煽りではなく、読者が節約できる時間と再現できる手順の対価として設定する
- **根拠**: 実売レンジはnote 100〜5,000円、Zenn本1,000〜2,000円帯で、500〜800円×100部=4〜6万円が現実帯とされる (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。「稼げる情報」としての高額設定は誇大表示リスクと読者の不信を招く
- **実装**: [channels.md](../strategy/channels.md) のnote価格ルールに準拠し、価格の最終決定はHT-6として人間が行う([human-tasks.md](../workflows/human-tasks.md))
- **関連**: BP-072、BP-073、BP-078
