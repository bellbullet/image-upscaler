# REBORN — AI Image Upscaler

古い写真をAIで高解像度に復元するWebツール。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bellbullet/image-upscaler)

## デモ

🔗 **<https://image-upscaler-kappa-amber.vercel.app>**

## 機能

- 📱 **軽量モード** — Lanczos3補間・サーバー処理・無料・高速（スマホ自動選択）
- 🧠 **ブラウザAI** — ESRGAN・ブラウザ内処理・無料・高品質（PC推奨）
- ⚡ **Replicate AI** — Real-ESRGAN・最高品質・自分のAPIキーを使用
- 🖼 2× / 4× スケールアップ
- 👤 顔補正オプション（Replicateモード）
- ↔ ビフォー/アフタースライダー比較
- ↓ 結果のダウンロード

## セットアップ

```bash
git clone https://github.com/bellbullet/image-upscaler
cd image-upscaler
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

## Vercelデプロイ

1. GitHubにプッシュ
1. [Vercel](https://vercel.com) でリポジトリをインポート
1. デプロイ（環境変数は不要 — ユーザーがUIからAPIキーを設定）

オプション：サーバー側にReplicate APIキーを設定したい場合：

```
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxx
```

## 技術スタック

|項目       |技術                                     |
|---------|---------------------------------------|
|フレームワーク  |Next.js (App Router)                   |
|スタイリング   |Tailwind CSS v4 + CSS変数                |
|軽量超解像    |sharp (Lanczos3)                       |
|ブラウザAI超解像|UpscalerJS + @upscalerjs/esrgan-medium |
|クラウド超解像  |Replicate API (nightmareai/real-esrgan)|
|デプロイ     |Vercel                                 |

## 対応フォーマット

JPEG · PNG · WebP · BMP

## ライセンス

MIT
