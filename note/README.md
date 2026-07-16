# note/ — note記事ワークスペース

有料note記事の制作パイプライン(原稿・画像・売上記録)の置き場。
システム全体の設計は [content-hub/workflows/note-monetization.md](../content-hub/workflows/note-monetization.md) を参照。

## ディレクトリ構成

```text
note/
├── works/<slug>/
│   ├── draft.md        # AI初稿(画像ディレクティブ入り)
│   ├── final.md        # 人間修正後の完成稿(noteに貼る版)
│   ├── meta.json       # ステータス・テーマ・価格などの管理情報
│   └── images/         # 生成画像 + manifest.json(生成履歴)
└── kpi/revenue.csv     # 売上記録(date,slug,unit_price_jpy,units,memo)
```

## 制作フロー

```bash
# 1. ワークスペース作成(コンテキストパックが表示される)
npm run note:new -- my-article --title "記事タイトル"

# 2. Claude Code に draft.md の生成を依頼(表示されたコンテキストパックを読ませる)

# 3. 実行前チェック(API鍵・書式・未記入プレースホルダーを洗い出す)
npm run note:doctor -- my-article

# 4. 画像生成(GPT Image 2)。--dry-run で計画確認、--mock で課金なし検証
npm run note:images -- my-article --mock   # まず課金なしで全フロー確認
export OPENAI_API_KEY=sk-...
npm run note:images -- my-article          # 本番生成

# 5. 人間が draft.md を修正し、完成稿を final.md として保存 → note に手動で公開

# 6. 修正内容を学習メモリに蓄積(次回の初稿品質が上がる)
npm run note:learn -- my-article

# 7. 状況確認と売上記録
npm run note:status                        # 全記事の段階を俯瞰
npm run note:kpi                           # 売れたら revenue.csv 追記後に進捗確認
```

## 画像ディレクティブの書き方

draft.md 内の画像を入れたい場所に、次の形式のコメントを置く。

```markdown
<!-- gpt-image: 001-hero | 1536x1024 | 代替テキスト | 画像の内容を表す日本語プロンプト -->
```

- 形式: `id | サイズ | 代替テキスト | プロンプト`(パイプ区切り)
- id: 英小文字・数字・ハイフン。記事内で一意にする
- サイズ: `1024x1024` / `1536x1024` / `1024x1536` / `auto` など
- `note:images` がコメント直後に `![代替テキスト](images/<id>.png)` を挿入する
- プロンプトを書き換えて再実行すると、その画像だけ再生成される(それ以外はスキップ)
- モデルは環境変数 `OPENAI_IMAGE_MODEL` で変更可能(既定: `gpt-image-2`)

## 編集学習(note:learn)の動作

- `draft.md` と `final.md` の差分を `content-hub/memory/edits/` に保存する
- `ANTHROPIC_API_KEY` があれば Claude API がルールを自動抽出し
  `content-hub/memory/edit-learnings.md` に追記する(モデルは `NOTE_LEARN_MODEL` で変更可能)
- キーが無い場合は `PENDING.md` に登録されるので、Claude Code で
  `content-hub/prompts/edit-learning.md` を使って抽出する

## 注意

- **noteには公開APIが無いため、公開(本文貼り付け・画像アップロード・価格設定)は人間の手作業**
- 価格の最終決定は人間が行う(`content-hub/workflows/human-tasks.md` HT-6)
- lintの扱い: この README は lint 対象。`works/` 以下(AI初稿の下書き)と
  `content-hub/memory/` の機械が書き込むファイルは対象外(公開前チェックは
  `content-hub/templates/note-article-template.md` のチェックリストで行う)
