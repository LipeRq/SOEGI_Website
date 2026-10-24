# ソエギ（SOEGI）事業紹介サイト

https://withsoegi.jp/ で公開している静的サイトです（複数ページ）。

| ファイル | 内容 |
|---|---|
| `index.html` | トップ |
| `graduate/` `monthly/` `one-off/` | 頼み方の3ページ（仕組みをつくって卒業する／使い続けて育てる／必要なものだけ頼む） |
| `price/` | 料金 |
| `demo/` | デモの案内 |
| `css/site.css` `js/site.js` | 共通のスタイル・動き |
| `ogp.png` `favicon.svg` `apple-touch-icon.png` | 共有画像・アイコン |

右下のチャットボットは `https://demo.withsoegi.jp/widget/chat.js`（デモ側のリポジトリ `LipeRq/Soegi`）。料金・文言の元は、デモ側の `public/js/pricing.js` と `docs/` に揃えます。

## 公開のしかた
Cloudflare の Worker「soegi」（静的アセットのみ。ドメイン withsoegi.jp・www は設定済み）に出します。**サイトのファイルだけを入れたフォルダ**（`README.md` などは入れない）を用意して、公開します。

```
index.html  css/  js/  demo/  graduate/  monthly/  one-off/  price/  sites/
favicon.svg  ogp.png  apple-touch-icon.png
```

2026-10-24 の公開では、次の設定ファイル（`wrangler.toml`）を、そのフォルダの親に置き、`public/` にサイトのファイルを入れて実行しました。

```toml
name = "soegi"
compatibility_date = "2026-09-25"

[assets]
directory = "./public"
```

```
npx wrangler versions upload   # 確認用の版（本番は変わらない）
npx wrangler versions deploy   # 本番に出す
npx wrangler rollback          # 戻す
```

## 経緯
- 2026-10-24：`main` を本番の複数ページ版に更新（旧版は 1 ファイルの 2026-10-11 版）。ホームページ制作（3万円〜）を追加し、実績に関する文言を削除、`/sites/`（ホームページの見本）を追加
- 右下のチャットボットは `https://demo.withsoegi.jp/widget/chat.js`（デモ側のリポジトリ `LipeRq/Soegi`）。料金・文言の元は、デモ側の `public/js/pricing.js` と `docs/`
