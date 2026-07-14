# 個人開発の発信(BP-081〜BP-090)

個人開発(PILLAR-3)を発信の資産に変えるための実践集。完成物の宣伝ではなくプロセスの公開を軸に、#個人開発 文化での振る舞いと数字公開の作法、開発とコンテンツを往復させる運転法を定める。カテゴリ全体の一覧は [README(索引)](README.md) に戻って参照すること。

## BP-081: 開発ログでプロセスを公開する

- **要点**: 完成物の宣伝ではなく、途中経過・失敗・設計の迷いを開発ログとして継続的に公開する
- **根拠**: 個人開発の発信文化では完成物より「途中経過・失敗・どう考えたか」が刺さる (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。Zennのユーザーヒアリングでも「その人の経験や試行錯誤・考えを読みたい」が支配的 (出典: [調査ノート](../research/notes/2026-07-ai-ops-legal.md))
- **実装**: PILLAR-3([content-pillars.md](../strategy/content-pillars.md))としてX→Zennの順で展開する。日々の断片は [x-single-post.md](../prompts/x-single-post.md)、まとまったら [zenn-article.md](../prompts/zenn-article.md) で記事化
- **関連**: BP-086、BP-088、BP-089

## BP-082: 収益・数字の公開は「全部公開」型で前提を添える

- **要点**: 数字を出すなら「収益◯円でやったこと全部公開」のように施策・時間・コストまで含めて開示する。小さい数字も隠さない
- **根拠**: 「収益10万円でやったこと全部公開」型が定番でバズる文化がある (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。ただし数字単体の提示は誇大表示・信用リスクに接近する(BP-078)
- **実装**: PILLAR-4として [kpi.md](../strategy/kpi.md) の月次記録から実数を拾って発信し、公開前に [x-pre-post.md](../checklists/x-pre-post.md) で表現を確認する
- **関連**: BP-078、BP-083、[mission.md](../strategy/mission.md)

## BP-083: 「1円の壁」を前提に期待値を設計する

- **要点**: 個人開発の収益化成功は例外側であることを明示し、読者にも自分にも「まず1円」を目標に置いた期待値で発信する
- **根拠**: 収益化に成功するのは1%未満とされ「1円の壁」が語られる。約70%が年収益10万円未満(確度低) (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。この現実を伏せた発信は煽り表現の禁止事項に接近する
- **実装**: [mission.md](../strategy/mission.md) のリスク明示主義に従い、収益系記事ではTL;DRで前提を先に書く([zenn-article-template.md](../templates/zenn-article-template.md))
- **関連**: BP-078、BP-082

## BP-084: 作ったものは最低5コンテンツに資産化する

- **要点**: 1つのプロダクト・機能から告知・図解・スレッド・失敗談・深掘りの最低5コンテンツを取り出す
- **根拠**: 「1記事から最低5コンテンツ」の展開セットがパイプラインに定義済みであり、開発物はスクショ・実数・構成図が揃うため素材効率が最も高い([content-pipeline.md](../workflows/content-pipeline.md))
- **実装**: [repurpose.md](../prompts/repurpose.md) で展開を生成し、素材(スクショ・実数)の提供はHT-1として人間が行う([human-tasks.md](../workflows/human-tasks.md))
- **関連**: BP-089、BP-090

## BP-085: #個人開発 文化ではまず与える側に回る

- **要点**: 自作物の宣伝より先に、同ジャンルの開発者への濃いリプライとノウハウの即公開で貢献し、界隈の互酬性に乗る
- **根拠**: 個人開発界隈は収益公開・ノウハウ即公開の「アウトプット至上主義」文化 (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。初期の露出源は同ジャンル中堅アカウントへの質の高いリプライとされる (出典: [調査ノート](../research/notes/2026-07-x-algorithm-psychology.md))
- **実装**: 毎日のX巡回・リプライ枠([weekly-routine.md](../workflows/weekly-routine.md))で実施する。対人交流はHT-3として人間が担う([human-tasks.md](../workflows/human-tasks.md))
- **関連**: BP-081、[channels.md](../strategy/channels.md)

## BP-086: 失敗談を一級のコンテンツとして扱う

- **要点**: 動かなかった・使われなかった・捨てた機能の話を、成功談と同じ工数をかけて記事化・投稿化する
- **根拠**: 「どん底→試行錯誤→成功」のV字アークが最も共感を生み、失敗談の自己開示はファン化に直結する (出典: [調査ノート](../research/notes/2026-07-x-algorithm-psychology.md))。文体ガイドの「自己開示から入る」パターンとも一致する
- **実装**: [style-guide.md](../voice/style-guide.md) の頻出パターンに沿って生成し、公開2週間後の「失敗談・裏話ポスト」枠([content-pipeline.md](../workflows/content-pipeline.md))に載せる
- **関連**: BP-081、BP-083

## BP-087: 技術選定記事は「判断の理由」を型にする

- **要点**: 採用技術の紹介ではなく、比較→判断基準→自分の環境での結論→捨てた選択肢の順で「なぜそう決めたか」を書く
- **根拠**: P2ペルソナには設計判断の理由・落とし穴・コスト内訳が刺さる([persona.md](../strategy/persona.md))。両論併記で終わる結論はAIっぽさの典型であり、自分の環境での言い切りが必要([style-guide.md](../voice/style-guide.md))
- **実装**: [zenn-article-template.md](../templates/zenn-article-template.md) に沿って検証環境を明記する。比較は手法・ツールに限定し人格に向けない([mission.md](../strategy/mission.md))
- **関連**: BP-086、BP-088

## BP-088: スクラップとWIP公開で「作りながら発信」する

- **要点**: 完成前の試行錯誤やAIとの対話メモはZennのスクラップでWIP公開し、完成記事の下書き兼ネタ帳として使う
- **根拠**: Zennの2026年3月方針では「AIとの対話メモはスクラップへ」が公式の置き場所とされる (出典: [調査ノート](../research/notes/2026-07-ai-ops-legal.md))。スクラップ継続で月5件のDM獲得報告もある(確度低) (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))
- **実装**: 開発中のメモをスクラップ化し、反応があった断片を [idea-backlog.md](../research/idea-backlog.md) に登録して記事化ルートに乗せる
- **関連**: BP-081、BP-089

## BP-089: 開発とコンテンツを往復させる(PILLAR-3の運転法)

- **要点**: 「作る→書く→反応を見る→次を作る」を1つのループとして回し、開発の優先順位の判断にも読者の反応を使う
- **根拠**: 体験づくり(HT-1)がコンテンツの独自性の源泉であり、実体験というE-E-A-Tの「Experience」はAIで代替できない (出典: [調査ノート](../research/notes/2026-07-ai-ops-legal.md))。X先出しの反応は需要検証としてパイプラインに組み込み済み
- **実装**: [content-pipeline.md](../workflows/content-pipeline.md) の工程3(X先出し)を機能・テーマ単位で使い、週次の枠は [weekly-routine.md](../workflows/weekly-routine.md) に従う
- **関連**: BP-084、BP-088、[content-pillars.md](../strategy/content-pillars.md)

## BP-090: 発信の蓄積をポートフォリオとして設計する

- **要点**: 記事・スクラップ・公開物を「案件・転職・出版につながる証拠の束」とみなし、ハブ記事とプロフィール導線で一覧化する
- **根拠**: 技術記事10本で書類通過率が約2倍になった事例があり、記事の蓄積は営業資産になる (出典: [調査ノート](../research/notes/2026-07-zenn-note-monetization.md))。シリーズ完結後のハブ記事+固定ポスト導線は戦略に定義済み
- **実装**: シリーズ戦略([content-pillars.md](../strategy/content-pillars.md))に従いハブ記事を作り、[channels.md](../strategy/channels.md) の導線設計でXプロフィール・固定ポストから張る。既存記事([claude-code-hooks-47.md](../../articles/claude-code-hooks-47.md) 等)を起点に整理する
- **関連**: BP-075、BP-084
