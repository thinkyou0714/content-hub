# prompts/ — 文章生成プロンプト集

各チャネル向けの生成プロンプト。Claude Code(または任意のLLM)にこのファイル群を読ませて文章を生成する。
Grokに投げるトレンド調査プロンプトは [../research/trend-research.md](../research/trend-research.md) にある(調査系はresearch、生成系はここ、と役割分担)。

## 共通の使い方

1. 生成したいチャネルのプロンプトファイルを開く
2. 「入力変数」をネタ帳([../research/idea-backlog.md](../research/idea-backlog.md))の該当行から埋める
3. プロンプト冒頭の「必読コンテキスト」に書かれたファイルと一緒にAIへ渡す
4. 生成後、AIが各プロンプト末尾のセルフチェックを終えてから人間レビューへ

## 共通ルール(全プロンプト適用)

- 文体は必ず [../voice/style-guide.md](../voice/style-guide.md) に従う
- 体験談・実績数字は入力変数で渡されたものだけを使う。**不足していたら `【人間: ○○を記入】` のプレースホルダーを残し、AIが創作して埋めない**
- 生成物には煽り・断定・誇大表現を入れない([../strategy/mission.md](../strategy/mission.md) の禁止事項)
- 具体的な仕様・価格・数値を書く場合は出典を残すか「要確認」を付ける

## ファイル一覧

| ファイル | 用途 |
|---|---|
| [zenn-article.md](zenn-article.md) | Zenn記事の初稿生成 |
| [x-single-post.md](x-single-post.md) | X単発投稿の生成(複数案) |
| [x-thread.md](x-thread.md) | Xスレッド(ツリー投稿)の生成 |
| [note-paid-article.md](note-paid-article.md) | 有料note原稿の生成 |
| [repurpose.md](repurpose.md) | 既存コンテンツの他チャネル展開 |

## プロンプト改善の運用

- 生成結果が悪かったら、その場で直すのではなくプロンプトファイル自体を修正してコミットする
- コミットメッセージに「なぜ変えたか(どんな失敗が起きたか)」を書く(プロンプトのバージョン管理)
- 月次レビュー([../checklists/monthly-review.md](../checklists/monthly-review.md))で改善履歴を振り返る
