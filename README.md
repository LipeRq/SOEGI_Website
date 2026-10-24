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
Cloudflare の Worker「soegi」（静的アセット）に、このフォルダの中身を丸ごと（フォルダごと）アップロードして Deploy します。

## ブランチ
`main` は 2026-10-11 の旧版（1ファイル）のままです。`sync/live-2026-10-24` は、本番の 2026-10-24 時点の内容をそのまま入れ直したものです（最初のコミット）。
