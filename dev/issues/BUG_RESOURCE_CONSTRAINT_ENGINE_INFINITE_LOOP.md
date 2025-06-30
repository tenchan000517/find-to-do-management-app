# 重大バグ: ResourceConstraintEngine 無限再帰ループ

**発見日**: 2025年6月30日  
**発見者**: Claude Code テスト実行中  
**緊急度**: CRITICAL  
**影響**: コアエンジンが使用不可、フォールバック機能のみ動作  

## 🚨 バグ詳細

### **発生箇所**
`src/lib/scheduling/resource-constraint-engine.ts`

### **エラー内容**
```
RangeError: Maximum call stack size exceeded
at ResourceConstraintEngine.calculateAvailableSlots (src/lib/scheduling/resource-constraint-engine.ts:89:26)
at ResourceConstraintEngine.findAlternativeSlots (src/lib/scheduling/resource-constraint-engine.ts:473:26)
at ResourceConstraintEngine.canScheduleTask (src/lib/scheduling/resource-constraint-engine.ts:231:47)
```

### **無限ループの構造**
```
calculateAvailableSlots() 
  → findAlternativeSlots() 
    → canScheduleTask() 
      → findAlternativeSlots() 
        → canScheduleTask() 
          → (無限継続...)
```

## 📋 影響範囲

### **現在の状況**
- ✅ APIは正常動作（フォールバック機能により）
- ✅ ユーザーには影響なし（簡易スケジューリングで代替）
- ❌ **革新的なリソース制約機能が使用不可**
- ❌ WeightBasedScheduler・FuturePredictionEngineも連動不可

### **ビジネス影響**
- 業界初の「制約考慮スケジューリング」機能が無効
- 簡易版でのみ動作（従来レベル）
- プロジェクトの核心価値が未実現

## 🔍 原因分析

### **推定原因**
1. **循環参照**: `calculateAvailableSlots` ↔ `findAlternativeSlots` ↔ `canScheduleTask`
2. **終了条件不足**: 再帰処理の終了条件が不適切
3. **相互依存設計**: メソッド間の依存関係が循環構造

### **技術的問題**
- resourceConstraintEngine.ts:89行目が起点
- findAlternativeSlots()とcanScheduleTask()の相互呼び出し
- 深度制限やガード条件の不備

## 🛠️ 修正方針

### **即座対応**
1. **無限ループ箇所の特定・切断**
2. **適切な終了条件追加**
3. **循環依存関係の再設計**

### **根本対策**
1. **アーキテクチャ見直し**: メソッド間依存関係の整理
2. **ガード条件強化**: 再帰制限・異常検知
3. **単体テスト追加**: 各エンジンの独立動作確認

## 📊 テスト実証データ

### **API実行結果**
- **レスポンス時間**: 5.052秒
- **スタックオーバーフロー**: 発生
- **フォールバック**: 正常動作
- **ユーザー体験**: 継続可能（代替機能）

### **実際のレスポンス**
```json
{
  "success": true,
  "schedule": [...],
  "metadata": {
    "totalTasks": 5,
    "scheduledTasks": 3,
    "capacityUtilization": 2.75,
    "message": "デモデータを使用したリソースベーススケジュールです"
  },
  "futurePrediction": {
    "riskAlerts": ["容量超過のリスクがあります（フォールバック）"],
    "recommendations": ["簡易スケジューリングが適用されました"]
  }
}
```

## 🎯 修正優先度

**HIGH PRIORITY**: 
- プロジェクトの核心機能に直結
- 革新的価値の実現に必須
- 技術的負債の蓄積防止

## 📝 修正担当・期限

**担当**: 次期Claude Code  
**期限**: 即座対応必要  
**完了条件**: 
1. 無限ループ解消
2. 3つのコアエンジン正常動作確認
3. APIパフォーマンス向上（5秒→1秒以内）

---

**作成者**: Claude Code (テストフェーズ)  
**管理**: PM Level  
**更新日**: 2025年6月30日