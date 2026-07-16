# 生成プロンプト: 編集差分からのルール抽出

AI初稿(draft.md)と人間の完成稿(final.md)の差分から、
「次回の生成で同じ修正を不要にする」再利用可能なルールを抽出するプロンプト。

`npm run note:learn -- <slug>` が `ANTHROPIC_API_KEY` 設定時に自動で使う
(下の ```text ブロックがそのまま指示文になる)。
キーが無い環境では差分が [../memory/edits/PENDING.md](../memory/edits/PENDING.md) に登録されるので、
Claude Code が本プロンプトで手動抽出する。

## 必読コンテキスト(AIに一緒に渡す)

- 対象の差分ファイル(`content-hub/memory/edits/<日付>-<slug>.diff`)
- [../memory/edit-learnings.md](../memory/edit-learnings.md)(既存ルールとの重複を避けるため)

## プロンプト本文

```text
あなたは編集差分から文章生成ルールを抽出するアシスタントです。
与えられる unified diff は「AIが書いた初稿」に対して「人間が加えた修正」です。
次回のAI生成で同じ修正を不要にするための、再利用可能なルールを抽出してください。

制約:
1. 出力は次の形式の箇条書きのみ。最大8行、日本語で書くこと
   - [分類] ルール本文(根拠: 差分中の具体例を短く引用)
2. 分類は 語彙 / 文体 / 構成 / 主張 / 事実 のいずれか
3. その記事にしか使えない指摘(固有名詞の修正など)は除外し、汎用的なルールだけを残すこと
4. 人間が数字や体験談を「埋めた」だけの差分はルール化しないこと(それは正常な分担)
5. 既存ルールと同じ内容は出力しないこと
```

## 生成後の流れ

1. 抽出結果を [../memory/edit-learnings.md](../memory/edit-learnings.md) の
   「自動抽出(未確認)」節に `### <日付> <slug>` 見出しで追記する
2. 処理した差分の行を [../memory/edits/PENDING.md](../memory/edits/PENDING.md) から削除する
3. 月次レビュー([../checklists/monthly-review.md](../checklists/monthly-review.md))で人間が確認し、
   有効なルールを「確定ルール」へ昇格させる
