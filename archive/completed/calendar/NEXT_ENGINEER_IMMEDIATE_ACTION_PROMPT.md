# 【緊急】Google Docs AI分析システム - JSON解析エラー修正プロンプト

**実行日**: 2025-06-16  
**緊急度**: 🔴 **HIGH**  
**想定作業時間**: 2-4時間  
**前エンジニア**: 65タブ同期システム完成・JSON解析エラー残存  

---

## 🚨 **緊急修正が必要な問題**

### **現象**: JSON解析エラーでAI分析が完全に失敗
```
JSON解析失敗: SyntaxError: Expected ',' or ']' after array element in JSON at position 10836
at AdvancedContentAnalyzer.parseJSONResponse (src/lib/ai/advanced-content-analyzer.ts:604:18)
```

### **影響**: 
- ✅ **Google Docs取得**: 65タブ・92,901文字 → 成功
- ❌ **AI分析**: JSON解析エラー → **完全失敗**
- ❌ **タスク抽出**: 0件（期待値: 数十〜数百件）
- ❌ **イベント抽出**: 0件
- ❌ **プロジェクト抽出**: 0件

### **ビジネスインパクト**: 
議事録システムの核心機能が動作不能 → **実用化不可**

---

## 🎯 **最優先タスク**

### **Task 1: エラー箇所の特定と修正**
**ファイル**: `/src/lib/ai/advanced-content-analyzer.ts:604`
**関数**: `parseJSONResponse()`

**現在のコード問題箇所**:
```typescript
// 604行目付近
return JSON.parse(jsonString);  // ← ここでSyntaxError
```

**推定原因**:
1. **大容量データ**: 92,901文字でAI応答が途中で切れている
2. **不正JSON**: AIが無効なJSON形式を生成している  
3. **タイムアウト**: AI処理中にレスポンスが中断

### **Task 2: AI応答ログの調査**
```bash
# サーバーログでAI応答の内容確認
tail -f server.log | grep -A 10 -B 10 "JSON解析"
```

**確認点**:
- AI応答の実際の内容
- JSON形式の具体的な破綻箇所
- position 10836付近の文字列

---

## 🔧 **推奨修正アプローチ**

### **アプローチ1: JSON修復機能（推奨）**
```typescript
// parseJSONResponse()の修正案
parseJSONResponse(responseText: string): any {
  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.warn('JSON解析失敗、修復を試行:', error.message);
    
    // JSON修復試行
    const fixedJson = this.repairJSON(responseText);
    if (fixedJson) {
      return JSON.parse(fixedJson);
    }
    
    // フォールバック: 部分解析
    return this.parsePartialJSON(responseText);
  }
}

// JSON修復関数
private repairJSON(text: string): string | null {
  // 1. 末尾の不完全な要素を削除
  // 2. 未閉じの配列・オブジェクトを閉じる
  // 3. カンマの重複・不足を修正
}
```

### **アプローチ2: データ分割処理**
```typescript
// 大容量データを分割してAI処理
async analyzeContent(content: string): Promise<AnalysisResult> {
  if (content.length > 50000) {
    return this.analyzeInChunks(content);
  }
  return this.analyzeSingle(content);
}

private async analyzeInChunks(content: string): Promise<AnalysisResult> {
  const chunks = this.splitContent(content, 30000); // 30KB単位
  const results = await Promise.all(
    chunks.map(chunk => this.analyzeSingle(chunk))
  );
  return this.mergeResults(results);
}
```

### **アプローチ3: フォールバック機能**
```typescript
// AI処理失敗時のフォールバック
private parsePartialJSON(text: string): AnalysisResult {
  return {
    sections: [],
    clusters: [],
    extractedTasks: this.extractTasksWithRegex(text),
    extractedEvents: this.extractEventsWithRegex(text),
    // 正規表現ベースの基本抽出で最低限の機能確保
  };
}
```

---

## ⚡ **即座に実行すべき手順**

### **Step 1: 現状確認（5分）**
```bash
# 1. サーバーログでエラー詳細確認
cd /mnt/c/find-to-do-management-app
tail -100 server.log | grep -A 5 -B 5 "JSON解析"

# 2. 最新のGoogle Docsレコード確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.google_docs_sources.findFirst({orderBy: {createdAt: 'desc'}}).then(r => console.log('最新:', r.title, r.word_count, '文字')).finally(() => p.\$disconnect());"
```

### **Step 2: 小規模テスト（10分）**
```bash
# 小さなGoogle Docsで正常動作確認
# Google Apps Scriptで3タブ程度の小さなドキュメントをテスト送信
```

### **Step 3: エラー箇所修正（60-120分）**
1. `/src/lib/ai/advanced-content-analyzer.ts`を開く
2. `parseJSONResponse()`関数を上記アプローチで修正
3. エラーハンドリング強化
4. ログ出力追加

### **Step 4: テスト実行（30分）**
```bash
# 修正後のテスト
npm run dev
# Google Apps Scriptで再度全タブ同期実行
```

---

## 🧪 **テスト手順**

### **段階的テスト**
1. **1タブテスト**: 1000文字程度 → JSON解析成功確認
2. **3タブテスト**: 3000文字程度 → 複数タブ処理確認  
3. **10タブテスト**: 10000文字程度 → 中規模データ確認
4. **65タブテスト**: 92901文字 → 本番データ確認

### **成功基準**
- ✅ JSON解析エラーなし
- ✅ タスク抽出: 10件以上
- ✅ イベント抽出: 5件以上
- ✅ プロジェクト抽出: 3件以上

---

## 📋 **利用可能なリソース**

### **完成済みシステム**
- ✅ **Google Apps Script v3.5**: 65タブ取得・統合処理完成
- ✅ **Webhook API**: データ受信・保存機能完成
- ✅ **基盤システム**: Phase 1-12実装完了

### **テスト用ファイル**
```
DocumentSyncScript_v3_NO_UI.gs          # 完成版スクリプト
scripts/delete-knowledge-items.js       # 不要データ削除用
GOOGLE_DOCS_SYSTEM_STATUS_REPORT.md     # 詳細状況報告
```

### **デバッグ用コマンド**
```bash
# ログ監視
tail -f server.log | grep -E "(JSON|AI|分析)"

# データベース状況確認  
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.google_docs_sources.count(), p.ai_content_analysis.count()]).then(r => console.log('Docs:', r[0], 'AI分析:', r[1])).finally(() => p.\$disconnect());"
```

---

## 🎯 **期待される結果**

### **修正成功時**:
```
🎉 65タブ議事録AI分析成功！
📊 結果:
- タスク抽出: 45件
- イベント抽出: 12件  
- プロジェクト抽出: 8件
- レコメンド: 15件
✅ 革新的議事録管理システム完成！
```

### **修正失敗時**:
- 小規模データ（1-3タブ）での部分的成功を目指す
- フォールバック機能で最低限の抽出を実現
- 根本的なアーキテクチャ見直しを検討

---

## 🚨 **注意事項**

### **セーフモード**
- 現在セーフモード有効だが実際に保存されている
- 不要なナレッジ生成を防ぐため設定確認必要

### **データ保護**
- 議事録の機密性に注意
- テスト時は必要最小限のデータ使用

### **パフォーマンス**
- 大容量データ処理による高負荷に注意
- AI API料金の上限設定確認

---

**🔥 このJSON解析エラーを解決すれば、革新的なGoogle Docs議事録自動処理システムが完成します！**

**📞 困った時**: 前回のセッション内容は `GOOGLE_DOCS_SYSTEM_STATUS_REPORT.md` に詳細記載