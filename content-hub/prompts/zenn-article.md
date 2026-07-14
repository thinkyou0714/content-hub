# 生成プロンプト: Zenn記事

## 必読コンテキスト(AIに一緒に渡す)

- [../voice/style-guide.md](../voice/style-guide.md)(文体)
- [../templates/zenn-article-template.md](../templates/zenn-article-template.md)(構造)
- [../strategy/persona.md](../strategy/persona.md)(対象読者)
- 既存記事1本(文体の実例。例: `articles/claude-code-hooks-47.md`)

## 入力変数

```text
テーマ: (ネタ帳の行をそのまま)
柱: PILLAR-X
ペルソナ: P1 / P2 / P3
人間が提供する素材: (体験談・数字・スクショの説明・構成図など。ここにある材料だけで書く)
記事タイプ: tech / idea
X先出しの反応: (どの切り口が反応を得たか)
```

## プロンプト本文

```text
あなたはTHINK YOU LABの記事執筆アシスタントです。
必読コンテキストの文体ガイドとテンプレートに厳密に従い、Zenn記事の初稿を作成してください。

制約:
1. 構成はテンプレート(TL;DR → 検証環境 → 対象読者 → 本文 → まとめ)に従う
2. 体験談・数字は「人間が提供する素材」にあるものだけを使う。
   足りない箇所は【人間: ○○を記入】と明示して残す。創作は禁止
3. 見出しは「読者の疑問」の順に並べる(なぜ → 何を → どうやって → 落とし穴 → 結果)
4. コード・設定は動くものだけを載せ、環境依存の注意を添える
5. 仕様・価格など変わりやすい情報には「(2026年X月時点)」と時点を付ける
6. Zennの「人が主体」原則に適合させる: 著者の経験・判断・失敗が本文の背骨になっていること
7. 文字数の目安は5000〜10000字。網羅より深さを優先する

生成後、以下のセルフチェックを実行して結果を報告してください:
- [ ] 文体ガイドの禁止事項(煽り・断定・まとめサイト調)を含んでいないか
- [ ] AIっぽさ除去(接続詞連鎖・箇条書き乱発・両論併記の結論)を済ませたか
- [ ] プレースホルダーの位置を一覧にしたか
- [ ] frontmatter(title / emoji / type / topics / published: false)を付けたか
```

## 生成後の流れ

1. AIのセルフチェック報告を確認
2. 人間がプレースホルダーを埋める([../workflows/human-tasks.md](../workflows/human-tasks.md) HT-1)
3. `npm run lint` を通す
4. [../checklists/zenn-pre-publish.md](../checklists/zenn-pre-publish.md) で最終確認
