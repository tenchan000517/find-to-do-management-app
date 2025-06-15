-- カレンダー機能拡張マイグレーション
-- 注意: このSQLは参考用です。実際の適用はPrismaマイグレーションを使用してください

-- 1. Enumの追加
CREATE TYPE event_category AS ENUM (
  'GENERAL',
  'MEETING',
  'APPOINTMENT',
  'TASK_DUE',
  'PROJECT',
  'PERSONAL',
  'TEAM'
);

CREATE TYPE recurrence_type AS ENUM (
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'CUSTOM'
);

-- 2. recurring_rulesテーブル作成
CREATE TABLE recurring_rules (
  id VARCHAR(25) PRIMARY KEY DEFAULT concat('rrule_', substr(md5(random()::text), 1, 20)),
  rule_name VARCHAR(255) NOT NULL,
  recurrence_type recurrence_type NOT NULL,
  weekdays INTEGER[] DEFAULT '{}',
  month_day INTEGER,
  month_week INTEGER,
  month_weekday INTEGER,
  interval INTEGER DEFAULT 1,
  start_date VARCHAR(10) NOT NULL,
  end_date VARCHAR(10),
  max_occurrences INTEGER,
  exclude_dates TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. calendar_eventsテーブル拡張
ALTER TABLE calendar_events
  ADD COLUMN end_time VARCHAR(5),
  ADD COLUMN user_id VARCHAR(25) NOT NULL DEFAULT 'user_kawashima',
  ADD COLUMN project_id VARCHAR(25),
  ADD COLUMN task_id VARCHAR(25),
  ADD COLUMN appointment_id VARCHAR(25),
  ADD COLUMN category event_category DEFAULT 'GENERAL',
  ADD COLUMN importance DECIMAL(3,2) DEFAULT 0.5,
  ADD COLUMN is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN recurring_pattern VARCHAR(25),
  ADD COLUMN recurring_end VARCHAR(10),
  ADD COLUMN color_code VARCHAR(7),
  ADD COLUMN is_all_day BOOLEAN DEFAULT false;

-- 4. 外部キー制約追加
ALTER TABLE calendar_events
  ADD CONSTRAINT fk_calendar_user FOREIGN KEY (user_id) REFERENCES users(id),
  ADD CONSTRAINT fk_calendar_project FOREIGN KEY (project_id) REFERENCES projects(id),
  ADD CONSTRAINT fk_calendar_task FOREIGN KEY (task_id) REFERENCES tasks(id),
  ADD CONSTRAINT fk_calendar_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  ADD CONSTRAINT fk_calendar_recurring FOREIGN KEY (recurring_pattern) REFERENCES recurring_rules(id);

-- 5. インデックス追加（パフォーマンス向上）
CREATE INDEX idx_calendar_date ON calendar_events(date);
CREATE INDEX idx_calendar_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_project ON calendar_events(project_id);
CREATE INDEX idx_calendar_recurring ON calendar_events(recurring_pattern);

-- 6. 既存データのマイグレーション
-- 既存のcalendar_eventsにuser_idを設定（川島さんをデフォルトに）
UPDATE calendar_events 
SET user_id = 'user_kawashima' 
WHERE user_id IS NULL;

-- 7. トリガー関数作成（updated_at自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recurring_rules_updated_at 
BEFORE UPDATE ON recurring_rules 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();