# REBORN — AI Image Upscaler

古い写真をAIで高解像度に復元するWebツール。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/image-upscaler)

## デモ

[vercel-url]

## 機能

- 🌐 **ブラウザAIモード** — UpscalerJS + ESRGANをブラウザ内実行。無料・APIキー不要・プライバシー完全保護
- ⚡ **Replicate APIモード** — Real-ESRGANを使用した高品質超解像。自分のAPIキーを使用
- 🖼 2× / 4× スケールアップ
- 👤 顔補正オプション（Replicateモード）
- ↔ ビフォー/アフタースライダー比較
- ↓ 結果のダウンロード

## セットアップ

```bash
git clone https://github.com/YOUR_USERNAME/image-upscaler
cd image-upscaler
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

## Vercelデプロイ

1. GitHubにプッシュ
2. [Vercel](https://vercel.com)でリポジトリをインポート
3. デプロイ（環境変数は不要 — ユーザーがUIからAPIキーを設定）

オプション：サーバー側にReplicate APIキーを設定したい場合：
```
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxx
```

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| スタイリング | Tailwind CSS v4 + CSS変数 |
| ブラウザ超解像 | UpscalerJS + @upscalerjs/esrgan-medium |
| クラウド超解像 | Replicate API (nightmareai/real-esrgan) |
| デプロイ | Vercel |

## 対応フォーマット

JPEG, PNG, WebP, BMP

## ライセンス

MIT
