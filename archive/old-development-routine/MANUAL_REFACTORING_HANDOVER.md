# 📋 マニュアル修正作業 引き継ぎ書

**作成日**: 2025年6月29日  
**作成者**: Claude Code Assistant  
**対象**: 次のClaude Codeセッション  
**作業**: 仕様書化したマニュアルの使用マニュアルへの修正

---

## 🎯 作業概要

現在、14カテゴリのシステム機能マニュアルが完成していますが、一部のマニュアルがコード例を多数含む **仕様書** になってしまっています。これらを **使用マニュアル** として再構成する必要があります。

---

## 🚨 修正が必要なマニュアル

### **最優先修正（完全に仕様書化）:**
1. **`09-social-external-integration.md`** - 54個のコードブロック
2. **`02-task-management-system.md`** - 52個のコードブロック

### **コード例大幅削減が必要:**
3. **`08-6-social-analytics.md`** - 40個のコードブロック
4. **`08-1-smart-dashboard.md`** - 38個のコードブロック  
5. **`08-2-traditional-dashboard.md`** - 38個のコードブロック

### **正しい使用マニュアル（参考にすべき）:**
- ✅ **`10-financial-ltv-management.md`** - コードブロック0個
- ✅ **`11-hr-resource-management.md`** - コードブロック0個
- ✅ **`12-realtime-notification.md`** - コードブロック0個
- ✅ **`13-mobile-support.md`** - コードブロック0個
- ✅ **`14-system-management.md`** - コードブロック0個

---

## 🗂️ 作業手順

### **Step 1: アーカイブディレクトリの作成**
```bash
mkdir -p /mnt/c/find-to-do-management-app/manuals/archive/technical-specs
```

### **Step 2: 問題のあるマニュアルをアーカイブに移動**
```bash
# 最優先修正対象
mv /mnt/c/find-to-do-management-app/manuals/09-social-external-integration.md /mnt/c/find-to-do-management-app/manuals/archive/technical-specs/
mv /mnt/c/find-to-do-management-app/manuals/02-task-management-system.md /mnt/c/find-to-do-management-app/manuals/archive/technical-specs/

# コード削減対象
mv /mnt/c/find-to-do-management-app/manuals/08-6-social-analytics.md /mnt/c/find-to-do-management-app/manuals/archive/technical-specs/
mv /mnt/c/find-to-do-management-app/manuals/08-1-smart-dashboard.md /mnt/c/find-to-do-management-app/manuals/archive/technical-specs/
mv /mnt/c/find-to-do-management-app/manuals/08-2-traditional-dashboard.md /mnt/c/find-to-do-management-app/manuals/archive/technical-specs/
```

### **Step 3: 正しい使用マニュアルとして再作成**
以下の順序で再作成してください：

1. **`02-task-management-system.md`** ← 最重要（基本機能）
2. **`09-social-external-integration.md`** ← 高優先度
3. **`08-1-smart-dashboard.md`** ← ダッシュボード基本
4. **`08-2-traditional-dashboard.md`** ← ダッシュボード応用
5. **`08-6-social-analytics.md`** ← 分析機能

---

## ✅ 正しい使用マニュアルの要件

### **含むべき内容:**
- ✅ **機能の概要・説明**
- ✅ **UI上での操作手順**（クリック、入力、選択）
- ✅ **設定方法**
- ✅ **トラブルシューティング**
- ✅ **よくある質問と回答**

### **含めてはいけない内容:**
- ❌ **TypeScript/JavaScriptコード例**
- ❌ **API実装詳細**
- ❌ **データベース構造**
- ❌ **技術的実装方法**
- ❌ **開発者向け情報**

### **参考にすべきマニュアル:**
- `10-financial-ltv-management.md`
- `11-hr-resource-management.md`
- `12-realtime-notification.md`
- `13-mobile-support.md`
- `14-system-management.md`

これらは **完璧な使用マニュアル** の例です。

---

## 📝 マニュアル構成テンプレート

```markdown
# [機能名] マニュアル

## 概要
[機能の概要説明]

### 主要特徴
- [特徴1]
- [特徴2]
- [特徴3]

---

## 目次
1. [基本操作](#基本操作)
2. [詳細機能](#詳細機能)
3. [設定・カスタマイズ](#設定カスタマイズ)
4. [トラブルシューティング](#トラブルシューティング)

---

## 基本操作

### 1. [機能名]の使用方法
1. メニューから「[機能名]」を選択
2. [具体的な操作手順]
3. [結果の確認方法]

**表示される情報：**
- [項目1]: [説明]
- [項目2]: [説明]

---

## トラブルシューティング

### よくある問題と解決方法

#### Q1: [問題]
**原因と対処法：**
- [原因1]
  → [対処法1]
- [原因2]
  → [対処法2]

---

## まとめ
[機能の活用効果と利用のコツ]
```

---

## 🎯 作業の進め方

### **即座に開始すべき手順:**

1. **現状確認**
   ```bash
   ls -la /mnt/c/find-to-do-management-app/manuals/
   ```

2. **アーカイブ作成**
   ```bash
   mkdir -p /mnt/c/find-to-do-management-app/manuals/archive/technical-specs
   ```

3. **問題マニュアルの移動**
   最優先の2つから開始：
   - `02-task-management-system.md`
   - `09-social-external-integration.md`

4. **正しい使用マニュアルの作成**
   - アーカイブした内容は参考程度に
   - 主に`10-14`の正しいマニュアルを参考に
   - **UI操作手順**に重点を置く

---

## ⚠️ 重要な注意点

### **やってはいけないこと:**
- アーカイブしたマニュアルをそのまま修正して使う
- コード例を一部削除するだけの修正
- 技術的詳細の説明を含める

### **やるべきこと:**
- 一から使用マニュアルとして書き直す
- **実際のユーザーの操作**に焦点を当てる
- **画面上のボタン・メニュー**の具体的な操作手順を記載
- 正しいマニュアル（10-14）の構成を踏襲

---

## 📊 成功基準

### **完了時の状態:**
- ✅ 問題のあるマニュアル5つがアーカイブに移動済み
- ✅ 新しい使用マニュアル5つが作成済み
- ✅ 全マニュアルでコードブロック数が0個
- ✅ 実際の操作手順が明確に記載

### **品質確認方法:**
```bash
# コードブロックが0個であることを確認
grep -c "\`\`\`" /mnt/c/find-to-do-management-app/manuals/*.md
```
すべて「0」が表示されるべきです。

---

## 🔄 優先順序

1. **最優先**: `02-task-management-system.md` ← 基本機能で最重要
2. **高優先**: `09-social-external-integration.md` ← 複雑で修正困難
3. **中優先**: `08-1-smart-dashboard.md` ← よく使われる機能
4. **中優先**: `08-2-traditional-dashboard.md` ← ダッシュボード完成
5. **低優先**: `08-6-social-analytics.md` ← 専門的機能

---

## 📞 次のClaude Codeへのメッセージ

あなたが担当するのは **仕様書化したマニュアルの使用マニュアルへの修正作業** です。

**今すぐやること:**
1. アーカイブディレクトリの作成
2. 問題マニュアルの移動
3. `02-task-management-system.md` の使用マニュアルとしての再作成

**参考にすべきマニュアル:**
- `10-financial-ltv-management.md`
- `11-hr-resource-management.md`
- `12-realtime-notification.md`
- `13-mobile-support.md`
- `14-system-management.md`

これらは **完璧な使用マニュアル** です。同じ構成・レベルで作成してください。

**絶対に避けること:**
- コード例の記載
- 技術的実装詳細
- 開発者向け情報

**重点を置くこと:**
- UI上での具体的操作手順
- ユーザーが実際に行うクリック・入力
- 画面に表示される情報の説明

**頑張って！** 🚀

---

**最終更新**: 2025年6月29日  
**作成者**: Claude Code Assistant  
**次の担当者**: リフレッシュ後のClaude Code