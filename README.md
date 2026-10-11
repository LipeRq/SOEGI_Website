# ソエギ（SOEGI）事業紹介サイト

https://withsoegi.jp/ で公開している静的サイトです。

- `index.html` … サイト本体（HTML・CSS・JavaScriptを1ファイルにまとめています）
- `ogp.png` … SNSで共有したときの画像（1200×630）
- `favicon.svg` / `apple-touch-icon.png` … アイコン

## 公開のしかた
Cloudflare の Worker「soegi」（静的アセット）に、上の4ファイルをアップロードして Deploy します。
