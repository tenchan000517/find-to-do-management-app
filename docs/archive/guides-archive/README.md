# 📚 Core Documentation - 中核ドキュメント管理

**作成日**: 2025-06-16  
**目的**: 開発時に必ず参照すべきコアドキュメントの整理・管理

---

## 🎯 **このディレクトリについて**

このディレクトリは **開発時に必ず参照すべき中核ドキュメント** を整理・管理しています。  
**どのエンジニアも、どのセッションでも、一貫した品質で開発を進める** ための基盤です。

### **ディレクトリ構造**
```
docs/core/
├── essential/     # 必須参照ドキュメント（毎回確認）
├── reference/     # 技術リファレンス（頻繁に参照）
└── archive/       # 完了済み・履歴ドキュメント
```

---

## ⚡ **essential/ - 必須参照ドキュメント**

### **開発開始時に必ず読むべきドキュメント**

| ドキュメント | 目的 | 参照頻度 | 重要度 |
|-------------|------|----------|--------|
| [`MASTER_DEVELOPMENT_PROMPT.md`](./essential/MASTER_DEVELOPMENT_PROMPT.md) | 開発ルール・仕様・要件の統合指針 | 毎回 | ★★★ |
| [`UNIVERSAL_DEVELOPMENT_GUIDE.md`](./essential/UNIVERSAL_DEVELOPMENT_GUIDE.md) | 開発ワークフロー・ベストプラクティス | 毎回 | ★★★ |
| [`CLAUDE.md`](./essential/CLAUDE.md) | AI開発ナレッジベース・環境設定 | 毎回 | ★★★ |

### **開発中に参照すべきドキュメント**

| ドキュメント | 目的 | 参照頻度 | 重要度 |
|-------------|------|----------|--------|
| [`DEVELOPER_REFERENCE_INDEX.md`](./reference/DEVELOPER_REFERENCE_INDEX.md) | ファイル・API・コマンド一覧 | 頻繁 | ★★★ |
| [`INTEGRATED_PROJECT_STATUS_REPORT.md`](./reference/INTEGRATED_PROJECT_STATUS_REPORT.md) | 現在の実装状況・進捗 | 日次 | ★★☆ |

---

## 🔧 **reference/ - 技術リファレンス**

### **実装時に参照する技術情報**

| ドキュメント | 目的 | 使用場面 |
|-------------|------|----------|
| [`DEVELOPER_REFERENCE_INDEX.md`](./reference/DEVELOPER_REFERENCE_INDEX.md) | 技術ファイル・API・コマンド集 | 実装時 |
| [`UNIVERSAL_DEVELOPMENT_KNOWLEDGE_BASE.md`](./reference/UNIVERSAL_DEVELOPMENT_KNOWLEDGE_BASE.md) | 汎用的ナレッジ・問題解決パターン | 問題発生時 |
| [`COMPREHENSIVE_UNIMPLEMENTED_REQUIREMENTS_ROADMAP.md`](./reference/COMPREHENSIVE_UNIMPLEMENTED_REQUIREMENTS_ROADMAP.md) | 未実装要件・ロードマップ | 新機能計画時 |

---

## 📂 **archive/ - 完了済み・履歴ドキュメント**

### **履歴・参考資料として保持**

| ドキュメント | 目的 | 参照目的 |
|-------------|------|----------|
| 進捗報告書群 | Phase別進捗履歴 | 履歴確認・学習 |
| 引き継ぎ書群 | セッション間引き継ぎ | 過去経緯確認 |
| 旧プロンプト集 | 開発プロセス進化履歴 | プロセス改善参考 |

---

## 🚀 **効率的な使用方法**

### **開発セッション開始時のルーチン**
```
1. essential/MASTER_DEVELOPMENT_PROMPT.md       # 開発方針確認（3分）
2. essential/UNIVERSAL_DEVELOPMENT_GUIDE.md     # ワークフロー確認（2分）
3. essential/CLAUDE.md                          # 環境・コマンド確認（2分）
4. reference/DEVELOPER_REFERENCE_INDEX.md      # 必要ファイル特定（5分）
```

### **開発中の問題解決時**
```
1. reference/UNIVERSAL_DEVELOPMENT_KNOWLEDGE_BASE.md  # 問題パターン検索
2. essential/UNIVERSAL_DEVELOPMENT_GUIDE.md           # トラブルシューティング
3. reference/DEVELOPER_REFERENCE_INDEX.md            # 関連ファイル・コマンド確認
```

### **新機能開発計画時**
```
1. reference/COMPREHENSIVE_UNIMPLEMENTED_REQUIREMENTS_ROADMAP.md  # 要件確認
2. reference/INTEGRATED_PROJECT_STATUS_REPORT.md                 # 現状把握
3. essential/MASTER_DEVELOPMENT_PROMPT.md                        # 制約・ルール確認
```

---

## 📊 **ドキュメント品質管理**

### **更新ルール**
| ドキュメント | 更新タイミング | 更新者 |
|-------------|----------------|--------|
| **essential/** | 開発プロセス変更時 | シニア開発者 |
| **reference/** | 新機能実装時・問題解決時 | 実装担当者 |
| **archive/** | セッション完了時 | 各セッション担当者 |

### **品質基準**
- **一貫性**: 他ドキュメントとの矛盾なし
- **完全性**: 必要情報の網羅
- **最新性**: 最新の実装状況反映
- **実用性**: 実際の開発で使用可能

### **レビュープロセス**
1. **自己チェック**: 更新者による内容確認
2. **相互参照**: 関連ドキュメントとの整合性確認
3. **実用テスト**: 新規参加者による使用テスト

---

## 🔄 **継続的改善**

### **フィードバック収集**
- **開発効率**: ドキュメント使用による時間短縮効果
- **問題解決**: ドキュメントによる問題解決成功率
- **新規参加者**: 学習・理解速度の向上

### **改善サイクル**
1. **月次レビュー**: 使用頻度・効果の評価
2. **四半期更新**: 構造・内容の大幅見直し
3. **年次再編**: 全体アーキテクチャの最適化

---

**この中核ドキュメント管理により、一貫した高品質な開発プロセスを実現します。**

*最終更新: 2025-06-16*  
*管理者: 開発チーム*