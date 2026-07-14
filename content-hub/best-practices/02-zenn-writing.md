# Zenn記事執筆(BP-011〜BP-020)

Zennは「この人は本当に動かしている」ことを証明する信頼担保のチャネルであり、月2〜4本、数より1本あたりの証拠の濃さを優先する([channels.md](../strategy/channels.md))。このカテゴリでは、タイトル設計から公開直後の初動までのZenn固有の執筆・公開プラクティスを定める。全カテゴリの一覧は [README(索引)](README.md) に戻って参照する。

## BP-011: タイトルは実数・固有名詞・動詞で設計する

- **要点**: タイトルには実数(「47本」「55本」)・固有名詞(ツール名)・動詞を入れ、想定ペルソナの感情が動くところまで少し尖らせる。
- **根拠**: Zennで読まれる記事のタイトルは「数字で具体性」「特定ターゲットの感情を揺さぶる」「固有名詞・動詞入り」「少し尖らせる」が共通項(出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。
- **実装**: [zenn-article-template.md](../templates/zenn-article-template.md) でタイトルを複数案出し、[persona.md](../strategy/persona.md) のP2に刺さる案を選ぶ。実例は [claude-code-hooks-47.md](../../articles/claude-code-hooks-47.md) の「hooksを47本実装した話」。
- **関連**: BP-020(トピック選定)、[style-guide.md](../voice/style-guide.md)

## BP-012: 冒頭のTL;DRで結論と実数を先出しする

- **要点**: 記事冒頭に箇条書き3〜5点のTL;DRを置き、結論・最大の落とし穴・Before/Afterの実数を本文より先に見せる。
- **根拠**: 読者は冒頭数行で読む価値を判断する。文体ガイドの「曖昧な形容の代わりに実数」の原則をTL;DRに凝縮すると、技術読者(P2)の離脱を防げる([style-guide.md](../voice/style-guide.md))。
- **実装**: [zenn-article-template.md](../templates/zenn-article-template.md) の冒頭ブロックに従って生成する。実例は [claude-code-hooks-47.md](../../articles/claude-code-hooks-47.md) のTL;DR(4点、Before/After入り)。
- **関連**: BP-013(検証環境・対象読者)、[zenn-article.md](../prompts/zenn-article.md)

## BP-013: 検証環境と対象読者ブロックをTL;DR直後に置く

- **要点**: `:::message` で検証環境(OS・ツール・検証時点)を、`:::details` で対象読者・前提・得られることを、本文より前に明示する。
- **根拠**: 技術情報は環境とバージョンで挙動が変わるため、検証環境の明示が誤情報指摘と信頼低下を防ぐ。Zennの2026年3月方針も公開前の正確性検証を著者に求めている(出典: [調査ノート](../research/notes/2026-07-ai-ops-legal.md))。
- **実装**: 実例は [claude-code-hooks-47.md](../../articles/claude-code-hooks-47.md) の「検証環境」「対象読者・前提・得られること」ブロック。[zenn-article-template.md](../templates/zenn-article-template.md) の固定部品として運用する。
- **関連**: BP-018(「人が主体」原則)、[zenn-pre-publish.md](../checklists/zenn-pre-publish.md)

## BP-014: 図解を1記事に最低1点入れる

- **要点**: 全体像・アーキテクチャ・Before/Afterのいずれかを図解し、1記事に最低1点入れる。差分管理できるMermaidを第一候補にする。
- **根拠**: Zennでは図解は必須級で、「わかりやすい」と評価される記事にはほぼ必ず図がある(出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。
- **実装**: [claude-code-hooks-47.md](../../articles/claude-code-hooks-47.md) のLayer構成図のようにMermaidで書く。画像として作る場合は [ai-image-pipeline.md](../../articles/ai-image-pipeline.md) の画像生成パイプラインを使う。
- **関連**: BP-053(図解ポストへの再展開)、[zenn-article-template.md](../templates/zenn-article-template.md)

## BP-015: コードは動かした実物だけを貼り再現手順まで書く

- **要点**: コードは実際に動かしたものだけを、ファイル名付きコードフェンス(`python:ファイル名.py` 形式)で貼り、読者が同じ結果に到達できる粒度で手順と落とし穴を書く。数字には出どころの注記を付ける。
- **根拠**: ミッションの再現性主義(「すごい」で終わらせず、読者が同じことをできる粒度まで書く)がこの発信の差別化の核である([mission.md](../strategy/mission.md))。
- **実装**: 初稿は [zenn-article.md](../prompts/zenn-article.md) で生成し、実物の数字・スクショは人間が差し込む([human-tasks.md](../workflows/human-tasks.md) HT-1)。公開前に [zenn-pre-publish.md](../checklists/zenn-pre-publish.md) で検査する。
- **関連**: BP-018、[claude-code-hooks-47.md](../../articles/claude-code-hooks-47.md) の「数字の出どころ」注記

## BP-016: シリーズ記事は全回に相互リンクのナビを置く

- **要点**: シリーズ記事は冒頭に全回リンクのナビブロックを置き、完結後はハブ記事とX固定ポストから導線を張る。記事間リンクはフルURLで書く。
- **根拠**: シリーズは相互リンクで回遊を生み、読者の信頼を累積させる([content-pillars.md](../strategy/content-pillars.md))。ルート相対パスのリンクは404の恐れがあり、既存記事でもフルURLへ修正した経緯がある。
- **実装**: 実例は [claude-code-hooks-47.md](../../articles/claude-code-hooks-47.md) 冒頭の「シリーズ全4回」ブロックと更新履歴。新シリーズは [content-pillars.md](../strategy/content-pillars.md) のシリーズ戦略(X先出し検証)に従って起こす。
- **関連**: BP-055(X先出し検証)、BP-059(過去記事の再活用)

## BP-017: frontmatterで公開状態を管理し09:00 JSTに予約公開する

- **要点**: `published` と `publish_scheduled`(09:00 JST)で公開を既存の自動化に乗せ、ドラフトには `hold_reason`・`next_action`・`stage` を付けて「何待ちか」を明示する。
- **根拠**: 公開作業を人間の気分と手作業から切り離すとリードタイムが安定する。ドラフトの停滞は待ち理由の不明化が原因であり、frontmatterへの明記が再開コストを下げる([content-pipeline.md](../workflows/content-pipeline.md))。
- **実装**: 予約公開は [channels.md](../strategy/channels.md) のZennルールに従う。ドラフト管理の実例は [ai-image-pipeline.md](../../articles/ai-image-pipeline.md) のfrontmatter(hold_reason / next_action / stage)。
- **関連**: BP-019(公開直後の初動)、[zenn-pre-publish.md](../checklists/zenn-pre-publish.md)

## BP-018: Zennの「人が主体」原則を公開フローで担保する

- **要点**: AI初稿は使ってよいが、公開前の正確性検証と著者自身の経験・洞察の差し込みを必須工程にし、機械的な自動公開・乱造をしない。
- **根拠**: Zennは2025年6月改定で「AI執筆は禁止しないが乱造は禁止」とし、2026年3月10日の追加方針で「人が主体」(公開前の正確性検証+著者自身の経験・洞察)と期間あたり投稿上限を明示。機械的自動生成のみの投稿はスパムとしてアカウント凍結対象(出典: [調査ノート](../research/notes/2026-07-ai-ops-legal.md))。
- **実装**: 人間レビューなしの公開を禁止する([human-tasks.md](../workflows/human-tasks.md) HT-2)。体験・数字のプレースホルダーをAIが埋めない鉄則は [content-pipeline.md](../workflows/content-pipeline.md) 工程4-5。AIとの対話メモは記事でなくスクラップに出す。
- **関連**: BP-057(機械的コピペ禁止)、[zenn-pre-publish.md](../checklists/zenn-pre-publish.md)

## BP-019: 公開当日にX告知を出し0〜3日の初動に集中する

- **要点**: 公開当日中に記事の一番おいしい一文でX告知し、リンクはリプ欄に置く。公開直後の質問・指摘への返信を優先する。
- **根拠**: Zenn記事の閲覧は公開0〜3日に集中する実測がある。トレンドの検討要素にも「鮮度加算」「流入元」が挙がっており、初動を逃すと取り返しにくい(出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。
- **実装**: 告知文は公開前に [repurpose.md](../prompts/repurpose.md) で生成しておき、[content-pipeline.md](../workflows/content-pipeline.md) 工程6-7の展開セットに乗せる。リプライ対応は人間が行う([human-tasks.md](../workflows/human-tasks.md) HT-3)。
- **関連**: BP-052(X告知ポスト)、BP-058(展開スケジュール)

## BP-020: トピック(タグ)は実内容と一致する人気タグで統一する

- **要点**: topicsは記事の実内容と一致するものだけを選び、検索・トレンド流入が見込める人気タグを軸に、シリーズ内で揃えて運用する。
- **根拠**: 2025年の人気タグはMCP・Next.js・React・Go・Rust・TypeScript・生成AI。Claude Codeはトピック記事数が1年で数百→4,700件超に伸び、入門は飽和して深い実践系に需要がシフトしている(出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。
- **実装**: 既存記事のtopics(claudecode / n8n / automation 等)を基準に統一する。実例は [claude-code-hooks-47.md](../../articles/claude-code-hooks-47.md) と [n8n-claudecode-automation-overview.md](../../articles/n8n-claudecode-automation-overview.md) のfrontmatter。飽和度は [trend-research.md](../research/trend-research.md) のプロンプト4で事前確認する。
- **関連**: BP-011(タイトル設計)、[idea-backlog.md](../research/idea-backlog.md)
