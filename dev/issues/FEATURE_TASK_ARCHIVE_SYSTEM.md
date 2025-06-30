# FEATURE: タスクアーカイブシステム

**作成日**: 2025年6月30日  
**分類**: Feature Request - Essential  
**影響範囲**: タスク管理機能  
**優先度**: High  

---

## 🎯 機能要件

リスケジュールされたタスクが永続的に残り続ける問題を解決するため、アーカイブシステムの実装が必要。

### **現在の問題**
- リスケジュールされたタスクが蓄積される
- 古いタスクが現在のリストに混在
- タスクの履歴管理ができない
- パフォーマンスの劣化が懸念

### **要求される機能**
1. **自動アーカイブ**
   - 一定期間後の自動アーカイブ
   - 完了タスクの自動アーカイブ

2. **手動アーカイブ**
   - 個別タスクのアーカイブ
   - 一括アーカイブ機能

3. **アーカイブ管理**
   - アーカイブ済みタスクの閲覧
   - アーカイブからの復元
   - アーカイブタスクの検索

---

## 🔍 技術要件

### **データベース設計**
1. **アーカイブフラグ**
   ```sql
   ALTER TABLE Task ADD COLUMN archived BOOLEAN DEFAULT FALSE;
   ALTER TABLE Task ADD COLUMN archivedAt TIMESTAMP NULL;
   ALTER TABLE Task ADD COLUMN archivedBy VARCHAR(255) NULL;
   ```

2. **アーカイブ履歴テーブル**
   ```sql
   CREATE TABLE TaskArchiveHistory (
     id SERIAL PRIMARY KEY,
     taskId INTEGER REFERENCES Task(id),
     archivedAt TIMESTAMP DEFAULT NOW(),
     archivedBy VARCHAR(255),
     reason VARCHAR(255)
   );
   ```

### **API実装**
1. **アーカイブAPI**
   ```typescript
   POST /api/tasks/{taskId}/archive
   POST /api/tasks/bulk-archive
   GET /api/tasks/archived
   POST /api/tasks/{taskId}/unarchive
   ```

2. **フィルター機能**
   - アクティブタスクのみ表示（デフォルト）
   - アーカイブ済みタスクの表示
   - 全タスクの表示

---

## 🎯 実装計画

### **Phase 1: データベース設計**
- [ ] アーカイブカラムの追加
- [ ] アーカイブ履歴テーブルの作成
- [ ] マイグレーションスクリプトの作成

### **Phase 2: API実装**
- [ ] アーカイブAPI endpointの作成
- [ ] フィルター機能の実装
- [ ] 自動アーカイブのバッチ処理

### **Phase 3: UI実装**
- [ ] アーカイブボタンの追加
- [ ] アーカイブ済みタスクの表示画面
- [ ] フィルター切り替えUI

### **Phase 4: 自動化**
- [ ] 自動アーカイブのスケジューラー
- [ ] アーカイブ条件の設定機能
- [ ] 通知機能の実装

### **Phase 5: テスト・検証**
- [ ] アーカイブ機能の動作確認
- [ ] パフォーマンステスト
- [ ] データ整合性の確認

---

**アーカイブ条件案**
- 完了から30日経過したタスク
- 最終更新から90日経過したタスク
- 手動でアーカイブ指定されたタスク

**関連ファイル**: 
- `prisma/migrations/` (新規作成)
- `src/app/api/tasks/archived/route.ts` (新規作成)
- `src/components/TaskList/ArchiveControls.tsx` (新規作成)
- `src/hooks/useTaskArchive.ts` (新規作成)

**ステータス**: 計画中  
**担当**: 未定  
**期限**: 未定