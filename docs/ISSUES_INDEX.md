# 📋 Issues & Feature Requests Index

**最終更新**: 2025年6月29日  
**管理者**: Development Team  
**目的**: プロジェクトの課題・要望の一元管理

---

## 📊 概要

このドキュメントは、FIND to DO Management Appプロジェクトの全ての技術課題、機能要望、改善提案を一元管理するインデックスです。各イシューの詳細は個別ドキュメントに記載されています。

---

## 🚨 技術課題 (Technical Issues)

### **Issue #001: リアルタイム監視機能の実装ギャップ**
- **ファイル**: [`TECHNICAL_ISSUES_REALTIME_MONITORING.md`](./issues/TECHNICAL_ISSUES_REALTIME_MONITORING.md)
- **発見日**: 2025年6月29日
- **影響度**: Medium
- **緊急度**: Low
- **ステータス**: 🔍 調査完了・対応待ち

**概要**: マニュアル記載の「リアルタイム監視システム」と実装に乖離。Vercelサーバーレス環境制約により一部機能が動作せず。

**影響範囲**:
- ❌ WebSocketサーバー（クライアントコードのみ、サーバー未実装）
- ❌ バックグラウンドジョブ（開発環境のみ、本番無効）
- ✅ HTTPポーリング（30秒間隔で動作中）
- ✅ LINE Bot連携（完全動作）

**解決策オプション**:
1. Vercel Cron Jobs設定
2. GitHub Actions Workflow活用
3. Google Apps Script + 時間トリガー
4. Database Triggers実装

**優先度**: 代替手段で機能提供中のため低優先度

---

## 🚀 機能要望 (Feature Requests)

### **Feature Request #001: ユーザー登録システム拡張**
- **ファイル**: [`FEATURE_REQUEST_USER_REGISTRATION_ENHANCEMENT.md`](./issues/FEATURE_REQUEST_USER_REGISTRATION_ENHANCEMENT.md)
- **作成日**: 2025年6月29日
- **種別**: Optional Enhancement
- **承認者**: プロジェクトオーナー
- **ステータス**: 📋 承認待ち

**概要**: 現在のGoogle OAuth専用登録システムを拡張し、多様な認証方法と管理機能を追加。

**現状制限**:
- Google OAuth のみ（メール・パスワード認証なし）
- 管理者招待機能なし
- オンボーディングフローなし
- 二要素認証なし

**提案機能**:
1. **Priority 1**: メール・パスワード認証、追加OAuth プロバイダー
2. **Priority 2**: 管理者招待システム、メール認証
3. **Priority 3**: オンボーディングフロー、利用規約同意
4. **Priority 4**: 二要素認証、セッション管理強化

**実装工数**: 10-15日（段階的実装可能）

**承認要件**: 実装可否・優先度・スケジュール決定

---

## 📈 ステータス別分類

### **🔍 調査・分析段階**
- [Technical Issue #001] リアルタイム監視機能ギャップ ← 解決策選択待ち

### **📋 承認待ち**
- [Feature Request #001] ユーザー登録システム拡張 ← オーナー承認待ち

### **🚧 実装中**
- 現在該当なし

### **✅ 完了済み**
- 現在該当なし

### **❌ 却下・保留**
- 現在該当なし

---

## 🎯 優先度マトリックス

### **High Priority (緊急対応)**
- 現在該当なし

### **Medium Priority (計画的対応)**
- [Technical Issue #001] リアルタイム監視機能ギャップ

### **Low Priority (オプショナル)**
- [Feature Request #001] ユーザー登録システム拡張

### **Nice to Have (将来検討)**
- 現在該当なし

---

## 📊 影響度分析

### **System Critical (システム全体影響)**
- 現在該当なし

### **Feature Impact (機能レベル影響)**
- [Technical Issue #001] リアルタイム監視 - 代替手段で回避中
- [Feature Request #001] ユーザー登録 - 現行システムで十分動作

### **UX Impact (ユーザー体験影響)**
- [Feature Request #001] 登録方法の選択肢拡大

### **Documentation Only (ドキュメントのみ)**
- [Technical Issue #001] マニュアル記載の修正必要

---

## 🔧 技術分野別分類

### **Authentication & Security**
- [Feature Request #001] ユーザー登録システム拡張

### **Real-time & Monitoring**
- [Technical Issue #001] リアルタイム監視機能ギャップ

### **Infrastructure & DevOps**
- [Technical Issue #001] Vercel環境制約対応

### **Frontend & UX**
- [Feature Request #001] オンボーディングフロー

### **Backend & API**
- [Feature Request #001] 認証API拡張
- [Technical Issue #001] バックグラウンドジョブ

---

## 📅 実装スケジュール（想定）

### **Q3 2025 (July - September)**
**対応検討中:**
- [Technical Issue #001] 解決策選択・実装
- [Feature Request #001] 承認後の段階的実装

### **Q4 2025 (October - December)**
**将来検討:**
- 新規機能要望の評価
- システム最適化・リファクタリング

---

## 📞 Issue管理プロセス

### **新規Issue作成手順**
1. **課題・要望の分析**
2. **詳細ドキュメント作成** (`TECHNICAL_ISSUES_[TITLE].md` または `FEATURE_REQUEST_[TITLE].md`)
3. **このIndexへの追加**
4. **関係者への通知**

### **Issue更新プロセス**
1. **個別ドキュメントの更新**
2. **Index情報の同期更新**
3. **ステータス変更の記録**
4. **完了時のアーカイブ**

### **承認プロセス**
- **Technical Issues**: 技術リーダーまたはCTO承認
- **Feature Requests**: プロダクトオーナーまたはPM承認
- **Critical Issues**: 即座対応（事後承認）

---

## 📚 関連ドキュメント

### **プロジェクト管理**
- [`PHASE4_REVERSE_ENGINEERING_MASTER_PLAN.md`](../PHASE4_REVERSE_ENGINEERING_MASTER_PLAN.md) - 全体実行計画
- [`DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md) - システム文書索引

### **技術仕様**
- [`SYSTEM_FUNCTION_CATEGORIES.md`](../SYSTEM_FUNCTION_CATEGORIES.md) - 機能カテゴリ
- [`USER_OPERATIONS_COMPLETE_LIST.md`](../USER_OPERATIONS_COMPLETE_LIST.md) - Web操作リスト
- [`LINE_USER_OPERATIONS_COMPLETE_LIST.md`](../LINE_USER_OPERATIONS_COMPLETE_LIST.md) - LINE操作リスト

### **マニュアル**
- [`manuals/`](../manuals/) - ユーザーマニュアル群（20+ファイル）

---

## 🎯 Next Actions

### **即座実行**
1. [Technical Issue #001] 解決策の選択・実装計画策定
2. [Feature Request #001] プロダクトオーナーとの承認会議

### **継続監視**
1. 新規課題の早期発見・記録
2. 既存Issueのステータス更新
3. 定期的な優先度見直し

### **改善提案**
1. Issue管理プロセスの最適化
2. 自動化可能な部分の特定
3. GitHub Issues連携の検討

---

**管理責任者**: Development Team  
**レビュー頻度**: 週次  
**次回レビュー**: 2025年7月6日

---

## 📄 Template

新規Issue作成時は以下のテンプレートを使用:

### **Technical Issue Template**
```markdown
# 🚨 技術課題: [課題名]

**発見日**: YYYY-MM-DD
**課題種別**: [機能実装不備/バグ/パフォーマンス/セキュリティ]
**影響度**: [Critical/High/Medium/Low]
**緊急度**: [Critical/High/Medium/Low]

## 📋 課題概要
[課題の簡潔な説明]

## 🔍 詳細分析結果
[技術的な分析内容]

## 🛠️ 実装可能な解決策
[解決策オプション]

## 📁 関連ファイル一覧
[影響するファイル・コンポーネント]

## 🎯 推奨実装順序
[優先度付きの実装手順]
```

### **Feature Request Template**
```markdown
# 🚀 機能要望: [機能名]

**作成日**: YYYY-MM-DD
**種別**: [必須/推奨/オプショナル]
**承認者**: [承認権限者]
**ステータス**: 承認待ち

## 📋 現状分析
[現在の状況・制限事項]

## 🚀 提案機能
[提案する機能の詳細]

## 📊 実装工数見積もり
[工数・スケジュール見積もり]

## 🎯 実装優先度
[優先度付きの機能リスト]

## 📞 承認・実行プロセス
[承認要件・実行判断基準]
```