# FIND to DO システム完成形 開発ワークフロー

**対象期間**: 6週間  
**開発方針**: 既存システム活用・段階的実装

---

## 📋 **開発フロー概要**

### **Week 1-2: Phase 17-18 (コア機能)**
1. **学生リソース管理** (1.5日)
2. **MBTI統合チーム編成** (1日)

### **Week 3-4: Phase 19-20 (自動化機能)**
3. **等身大アナリティクス** (1.5日)
4. **タスク完了時ナレッジ自動化** (1日)

### **Week 5-6: 統合・テスト・本番移行**

---

## 🚀 **各Phase開発手順**

### **Phase開始前 (必須)**
```bash
# 1. ブランチ作成
git checkout -b feature/phase-17-student-resource

# 2. 既存システム確認
npm run dev
# → localhost:3000 で動作確認

# 3. データベース状態確認
npx prisma studio
```

### **Phase実装中**
```bash
# 1. データベース変更
npx prisma db push

# 2. リアルタイム確認
npm run dev

# 3. 型生成更新
npx prisma generate
```

### **Phase完了時 (必須)**
```bash
# 1. テスト実行
npm run build
npm run lint

# 2. 動作確認
# → 既存機能が壊れていないことを確認

# 3. コミット・マージ
git add .
git commit -m "feat: Phase 17 学生リソース管理機能実装"
git checkout main
git merge feature/phase-17-student-resource
```

---

## 📁 **実装時のファイル編集箇所**

### **Phase 17: 学生リソース管理**
```
編集ファイル:
├── prisma/schema.prisma (users テーブル拡張)
├── src/lib/services/ (新規: resource-calculator.ts)
├── src/app/api/users/[id]/resource/ (新規API)
└── src/components/tasks/ (既存TaskModal拡張)

既存システム活用:
├── tasks.estimatedHours ✓
├── tasks.difficultyScore ✓
└── users.skills ✓
```

### **Phase 18: MBTI統合**
```
編集ファイル:
├── src/lib/services/ (新規: mbti-optimizer.ts)
├── src/app/api/projects/[id]/team-optimize/ (新規API)
└── src/components/projects/ (既存ProjectModal拡張)

既存データ活用:
├── public/data/mbti.json ✓
├── users.workStyle ✓
└── projects.teamMembers ✓
```

### **Phase 19: アナリティクス**
```
編集ファイル:
├── src/lib/services/ (新規: reach-calculator.ts)
├── src/app/api/analytics/reach/ (新規API)
└── src/components/analytics/ (既存Dashboard拡張)

既存データ活用:
├── discord_metrics ✓
├── social-analytics API ✓
└── Google Analytics統合 ✓
```

### **Phase 20: ナレッジ自動化**
```
編集ファイル:
├── src/lib/services/ (新規: knowledge-generator.ts)
├── src/app/api/tasks/[id]/complete/ (既存API拡張)
└── src/components/tasks/ (既存CompletionModal拡張)

既存システム活用:
├── knowledge_items テーブル ✓
├── AI評価エンジン ✓
└── タスク完了フロー ✓
```

---

## ⚠️ **重要な注意点**

### **必ず守ること**
1. **既存機能テスト**: 新機能追加後、必ず既存機能が動作することを確認
2. **段階的デプロイ**: 1つのPhaseずつ確実に完成させる
3. **データバックアップ**: schema変更前は必ずDBバックアップ

### **避けること**
- 複数Phaseの同時実装
- 既存テーブルの破壊的変更
- 既存APIの仕様変更

---

## 🎯 **完了判定基準**

| Phase | 完了条件 |
|-------|----------|
| **Phase 17** | ユーザー負荷率計算・最適担当者提案が動作 |
| **Phase 18** | MBTIに基づくチーム編成提案が動作 |
| **Phase 19** | イベント現実的参加者数予測が動作 |
| **Phase 20** | タスク完了時ナレッジ自動生成が動作 |

---

## 📞 **困った時の対応**

### **エラーが発生したら**
1. `npm run build` でビルドエラーチェック
2. `npx prisma studio` でDB状態確認
3. 前回動作していたコミットに戻る

### **既存機能が壊れたら**
1. 即座に作業を停止
2. `git checkout main` で安全な状態に戻る
3. 問題を特定してから再実装

---

**開発成功の鍵**: 既存の優秀なシステムを尊重し、小さく確実に機能を追加すること