# FEATURE: ファイルアップロード機能の追加

**作成日**: 2025年6月30日  
**分類**: Feature - System Enhancement  
**影響範囲**: ファイル管理機能  
**優先度**: High  

---

## 🎯 機能要件

ユーザーが画像・PDF資料をアップロードして管理できる機能の追加が必要。

### **対象ファイル形式**
1. **画像ファイル**
   - JPEG (.jpg, .jpeg)
   - PNG (.png)
   - WebP (.webp)
   - GIF (.gif)
   - 最大サイズ: 10MB

2. **PDF資料**
   - PDF (.pdf)
   - 最大サイズ: 50MB

### **機能範囲**
- ファイルアップロード機能
- ファイル一覧表示・管理
- ファイルプレビュー機能
- ファイルダウンロード機能
- ファイル削除機能
- ファイル検索・分類機能

---

## 🔍 技術要件

### **アップロード先選択肢**
1. **ローカルストレージ** (開発・小規模運用)
   - `/public/uploads/` ディレクトリ
   - ファイル名の重複防止機能

2. **クラウドストレージ** (本格運用推奨)
   - AWS S3
   - Google Cloud Storage
   - Cloudinary (画像最適化機能付き)

### **データベース設計**
```sql
-- ファイル管理テーブル
CREATE TABLE file_attachments (
  id VARCHAR PRIMARY KEY,
  original_name VARCHAR NOT NULL,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR NOT NULL,
  mime_type VARCHAR NOT NULL,
  
  -- 関連エンティティ
  entity_type VARCHAR, -- 'task', 'appointment', 'project', 'knowledge'
  entity_id VARCHAR,
  
  -- メタデータ
  description TEXT,
  tags VARCHAR[],
  
  -- 担当者システム統合
  uploaded_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ 実装計画

### **Phase 1: 基盤構築**
- [ ] ファイルアップロードAPI作成
- [ ] データベーステーブル設計・作成
- [ ] ファイル管理サービス実装
- [ ] セキュリティ対策実装

### **Phase 2: UI実装**
- [ ] ファイルアップロードコンポーネント
- [ ] ファイル一覧表示コンポーネント
- [ ] ファイルプレビューモーダル
- [ ] ドラッグ&ドロップ対応

### **Phase 3: 統合・応用**
- [ ] タスク・プロジェクトとの連携
- [ ] アポイントメント資料添付
- [ ] ナレッジアイテムへの資料添付
- [ ] 検索・フィルター機能

### **Phase 4: 高度機能**
- [ ] 画像リサイズ・最適化
- [ ] PDFサムネイル生成
- [ ] ファイルバージョン管理
- [ ] 一括ダウンロード機能

---

## 🔒 セキュリティ要件

### **必須セキュリティ対策**
1. **ファイル検証**
   - MIMEタイプ検証
   - ファイル拡張子検証
   - ファイルサイズ制限
   - ウイルススキャン (本格運用時)

2. **アクセス制御**
   - 認証済みユーザーのみアップロード可能
   - ファイル所有者・権限管理
   - 直接URL アクセス制限

3. **ファイル名セキュリティ**
   - ファイル名サニタイズ
   - 実行可能ファイル拡張子の拒否
   - パストラバーサル攻撃対策

---

## 🎯 ユーザーストーリー

### **As a User**
1. **ファイルアップロード**
   - 「ファイルを選択」ボタンまたはドラッグ&ドロップでアップロード
   - アップロード進捗表示
   - アップロード完了通知

2. **ファイル管理**
   - アップロードしたファイルの一覧表示
   - ファイル名・サイズ・アップロード日時の表示
   - ファイルの説明・タグ付け機能

3. **ファイル利用**
   - 画像ファイルのプレビュー表示
   - PDFファイルのブラウザ内表示
   - ファイルダウンロード機能

4. **エンティティ連携**
   - タスクに関連資料を添付
   - プロジェクトに仕様書・画像を添付
   - アポイントメントに提案資料を添付

---

## 🔍 技術検討事項

### **ストレージ方式比較**
| 方式 | メリット | デメリット | 推奨用途 |
|------|----------|------------|----------|
| ローカル | 簡単実装・低コスト | スケーラビリティ制限・バックアップ課題 | 開発・小規模 |
| AWS S3 | 高可用性・スケーラブル・CDN連携 | 設定複雑・コスト | 本格運用 |
| Cloudinary | 画像最適化・変換機能 | 画像特化・コスト | 画像メイン |

### **実装ライブラリ候補**
- **ファイルアップロード**: `multer`, `formidable`
- **画像処理**: `sharp`, `jimp`
- **PDF処理**: `pdf-poppler`, `pdf2pic`
- **ファイル検証**: `file-type`, `mmmagic`

---

## 📋 テスト計画

### **機能テスト**
- [ ] ファイルアップロード正常系テスト
- [ ] ファイル形式・サイズ制限テスト
- [ ] ファイル一覧・プレビューテスト
- [ ] エンティティ連携テスト

### **セキュリティテスト**
- [ ] 不正ファイル形式拒否テスト
- [ ] ファイルサイズ制限テスト
- [ ] 権限チェックテスト
- [ ] パストラバーサル攻撃テスト

### **パフォーマンステスト**
- [ ] 大容量ファイルアップロードテスト
- [ ] 同時アップロードテスト
- [ ] ファイル一覧表示パフォーマンステスト

---

## 📚 関連ドキュメント更新

### **実装完了時の必須更新**
- [ ] `docs/specifications/file-management.md`
- [ ] `docs/user-flows/file-upload-flow.md`
- [ ] `docs/manuals/file-management-guide.md`
- [ ] API仕様書への追加

---

**関連ファイル（実装予定）**: 
- `src/app/api/files/upload/route.ts`
- `src/app/api/files/[id]/route.ts`
- `src/components/FileUpload/`
- `src/components/FileManager/`
- `src/lib/services/file-service.ts`
- `prisma/schema.prisma` (file_attachments table)

**ステータス**: 計画中  
**担当**: 未定  
**期限**: 未定