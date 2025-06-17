-- 担当者システム移行用SQLスクリプト
-- Legacy "作成者"から"担当者中心"設計への移行

-- ============================================
-- Phase 1: 既存データの担当者フィールド移行
-- ============================================

-- 1. Tasks: userId → createdBy & assignedTo
UPDATE tasks 
SET 
  createdBy = userId,
  assignedTo = userId  -- デフォルト：作成者が担当者
WHERE createdBy IS NULL;

-- 2. Calendar Events: userId → createdBy & assignedTo  
UPDATE calendar_events 
SET 
  createdBy = userId,
  assignedTo = userId  -- デフォルト：作成者が担当者
WHERE createdBy IS NULL AND userId IS NOT NULL;

-- 3. Knowledge Items: author → createdBy & assignedTo
UPDATE knowledge_items 
SET 
  createdBy = author,
  assignedTo = author  -- デフォルト：作成者が担当者
WHERE createdBy IS NULL;

-- 4. Appointments: 既にassignedToIdフィールドがある場合の移行
UPDATE appointments 
SET 
  createdBy = assignedToId,  -- 初期作成者は担当者と同じと仮定
  assignedTo = assignedToId
WHERE createdBy IS NULL AND assignedToId IS NOT NULL;

-- 5. Projects: 作成者情報がない場合の対処
-- プロジェクトは作成者不明のため、最初のチームメンバーを仮の作成者/担当者とする
UPDATE projects 
SET 
  createdBy = (
    CASE 
      WHEN teamMembers IS NOT NULL AND json_array_length(teamMembers) > 0 
      THEN teamMembers->0 
      ELSE 'user_system'  -- システムユーザーをフォールバック
    END
  ),
  assignedTo = (
    CASE 
      WHEN teamMembers IS NOT NULL AND json_array_length(teamMembers) > 0 
      THEN teamMembers->0 
      ELSE 'user_system'  -- システムユーザーをフォールバック
    END
  )
WHERE createdBy IS NULL;

-- 6. Connections: 作成者情報がない場合の対処
-- 人脈データは作成者不明のため、システムユーザーを設定
UPDATE connections 
SET 
  createdBy = 'user_system',
  assignedTo = 'user_system'
WHERE createdBy IS NULL;

-- ============================================
-- Phase 2: データ整合性チェック
-- ============================================

-- 担当者が存在するユーザーかチェック
SELECT 'tasks' as table_name, COUNT(*) as invalid_assignees
FROM tasks t 
LEFT JOIN users u ON t.assignedTo = u.id 
WHERE t.assignedTo IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 'calendar_events', COUNT(*)
FROM calendar_events ce 
LEFT JOIN users u ON ce.assignedTo = u.id 
WHERE ce.assignedTo IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 'projects', COUNT(*)
FROM projects p 
LEFT JOIN users u ON p.assignedTo = u.id 
WHERE p.assignedTo IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 'knowledge_items', COUNT(*)
FROM knowledge_items ki 
LEFT JOIN users u ON ki.assignedTo = u.id 
WHERE ki.assignedTo IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 'appointments', COUNT(*)
FROM appointments a 
LEFT JOIN users u ON a.assignedTo = u.id 
WHERE a.assignedTo IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 'connections', COUNT(*)
FROM connections c 
LEFT JOIN users u ON c.assignedTo = u.id 
WHERE c.assignedTo IS NOT NULL AND u.id IS NULL;

-- ============================================
-- Phase 3: 統計レポート
-- ============================================

-- 移行後の担当者分布
SELECT 
  'tasks' as entity_type,
  u.name as assignee_name,
  COUNT(*) as assigned_count
FROM tasks t
JOIN users u ON t.assignedTo = u.id
WHERE t.assignedTo IS NOT NULL
GROUP BY u.id, u.name

UNION ALL

SELECT 
  'projects',
  u.name,
  COUNT(*)
FROM projects p
JOIN users u ON p.assignedTo = u.id
WHERE p.assignedTo IS NOT NULL
GROUP BY u.id, u.name

UNION ALL

SELECT 
  'calendar_events',
  u.name,
  COUNT(*)
FROM calendar_events ce
JOIN users u ON ce.assignedTo = u.id
WHERE ce.assignedTo IS NOT NULL
GROUP BY u.id, u.name

ORDER BY entity_type, assigned_count DESC;

-- ============================================
-- Phase 4: システムユーザー作成（必要に応じて）
-- ============================================

-- システムユーザーが存在しない場合は作成
INSERT INTO users (id, name, email, color, isActive, createdAt, updatedAt)
SELECT 'user_system', 'システム', 'system@company.com', '#808080', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'user_system');

-- ============================================
-- 注意事項
-- ============================================
-- 1. 本番環境で実行前に必ずバックアップを取得
-- 2. Phase 1を段階的に実行してデータを確認
-- 3. Phase 2でデータ整合性を確認
-- 4. 無効な参照がある場合はuser_systemに修正
-- 5. アプリケーションの新機能が動作することを確認