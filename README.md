# ゲーミフィケーションTODOアプリ 🎮✨

タスク管理をゲーム感覚で楽しく！AIキャラクターと一緒に成長するTODOアプリです。

## 💻 推奨環境
- PCでの利用を推奨しています（スマートフォンでも利用可能ですが、一部機能が制限される場合があります）
- Google Gemini APIキーを設定することで、AIキャラクターの性格を反映した応答や、自由な会話が楽しめます

## 🌟 主な特徴

### 1. AIキャラクターとの対話機能
- タスク管理をサポートする個性豊かなAIキャラクター
- キャラクターごとに異なる性格と応援メッセージ
- 自然な会話でモチベーション維持をサポート

### 2. ゲーミフィケーション要素
- タスク完了で経験値とガチャ石を獲得
- レベルアップシステム
- ガチャによる新キャラクター解放
- 実績システムで目標達成を可視化

### 3. モチベーション管理
- 視覚的な進捗表示
- 連続達成日数のトラッキング
- 実績解除による報酬システム
- タスク完了時の演出効果

## 💻 技術スタック

- **フロントエンド**: Next.js, TypeScript, TailwindCSS
- **状態管理**: React Hooks
- **アニメーション**: Framer Motion
- **AI対話**: Google Gemini API
- **UI/UXライブラリ**: Lucide Icons, React Circular Progressbar

## 🚀 セットアップ方法

1. リポジトリのクローン:
```bash
git clone https://github.com/moz-ai/gamification-todo-app.git
```

2. 依存関係のインストール:
```bash
npm install
```

3. 環境変数の設定:
`.env.local`ファイルを作成し、必要な環境変数を設定:
```
GOOGLE_API_KEY=your_gemini_api_key
```

4. 開発サーバーの起動:
```bash
npm run dev
```

## 🎯 開発のポイント

1. **ユーザーエンゲージメント**
   - ゲーミフィケーションによるタスク管理の習慣化
   - 視覚的フィードバックによるモチベーション維持

2. **AI活用**
   - キャラクターの個性を活かした自然な対話
   - ユーザーの状況に応じた適切な応援メッセージ

3. **UX/UI設計**
   - 直感的な操作性
   - スムーズなアニメーション
   - レスポンシブデザイン

4. **拡張性**
   - 新キャラクターの追加が容易
   - 実績システムの拡張が可能
   - カスタマイズ可能なUI

---
Developed for CursorSunHackathon vol.1 2024 🏆
