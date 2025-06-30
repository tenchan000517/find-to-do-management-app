-- Phase 2: 財務管理・LTV分析システム データベース拡張
-- 作成日: 2025年6月27日
-- 目的: 高度財務管理・顧客LTV分析・プロジェクト収益予測機能の実装

-- 1. プロジェクト財務詳細テーブル
CREATE TABLE IF NOT EXISTS project_financial_details (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  
  -- 基本契約情報
  base_contract_value DECIMAL(12,2) DEFAULT 0,
  contract_type VARCHAR(50) DEFAULT 'FIXED',
  payment_schedule JSONB DEFAULT '{}',
  
  -- 売上予測
  additional_work_probability FLOAT DEFAULT 0.3,
  additional_work_expected_value DECIMAL(12,2) DEFAULT 0,
  maintenance_contract_probability FLOAT DEFAULT 0.5,
  maintenance_annual_value DECIMAL(12,2) DEFAULT 0,
  referral_probability FLOAT DEFAULT 0.2,
  referral_expected_value DECIMAL(12,2) DEFAULT 0,
  
  -- コスト詳細
  direct_labor_cost DECIMAL(12,2) DEFAULT 0,
  indirect_labor_cost DECIMAL(12,2) DEFAULT 0,
  external_contractor_cost DECIMAL(12,2) DEFAULT 0,
  tool_license_cost DECIMAL(12,2) DEFAULT 0,
  infrastructure_cost DECIMAL(12,2) DEFAULT 0,
  
  -- リスク・品質管理
  risk_buffer_percentage FLOAT DEFAULT 0.15,
  quality_assurance_cost DECIMAL(12,2) DEFAULT 0,
  contingency_reserve DECIMAL(12,2) DEFAULT 0,
  
  -- 予測精度・メタデータ
  confidence_level FLOAT DEFAULT 0.8,
  prediction_model_version VARCHAR(20) DEFAULT 'v1.0',
  last_updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 2. 顧客LTV分析テーブル
CREATE TABLE IF NOT EXISTS customer_ltv_analysis (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id VARCHAR(255) NOT NULL,
  
  -- LTV構成要素
  initial_project_value DECIMAL(12,2) DEFAULT 0,
  continuation_probability FLOAT DEFAULT 0.7,
  average_projects_per_year FLOAT DEFAULT 1.5,
  price_growth_rate FLOAT DEFAULT 0.1,
  relationship_duration_years INTEGER DEFAULT 5,
  
  -- 紹介価値
  referral_probability FLOAT DEFAULT 0.3,
  referral_average_value DECIMAL(12,2) DEFAULT 0,
  referral_multiplier FLOAT DEFAULT 1.0,
  
  -- 計算結果
  total_ltv DECIMAL(12,2) DEFAULT 0,
  discounted_ltv DECIMAL(12,2) DEFAULT 0,
  discount_rate FLOAT DEFAULT 0.1,
  
  -- 分析結果
  risk_factors JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  recommended_actions JSONB DEFAULT '[]',
  confidence_score FLOAT DEFAULT 0.8,
  
  -- メタデータ
  analysis_date TIMESTAMP DEFAULT NOW(),
  prediction_model_version VARCHAR(20) DEFAULT 'v1.0',
  created_by VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

-- 3. プロジェクトテンプレートテーブル
CREATE TABLE IF NOT EXISTS project_templates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- テンプレート基本情報
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL, -- 'EVENT', 'DEVELOPMENT', 'CUSTOM'
  complexity_level INTEGER DEFAULT 1, -- 1-10
  
  -- テンプレート構造
  phases JSONB DEFAULT '[]', -- フェーズ詳細
  budget_breakdown JSONB DEFAULT '{}',
  risk_factors JSONB DEFAULT '[]',
  success_metrics JSONB DEFAULT '[]',
  resources JSONB DEFAULT '{}',
  
  -- 適用条件
  target_scale_min INTEGER DEFAULT 0,
  target_scale_max INTEGER DEFAULT 999999,
  duration_weeks_min INTEGER DEFAULT 1,
  duration_weeks_max INTEGER DEFAULT 52,
  required_technologies JSONB DEFAULT '[]',
  
  -- 使用実績・評価
  usage_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0.8,
  average_satisfaction FLOAT DEFAULT 4.0,
  last_used_at TIMESTAMP,
  
  -- 自動生成情報
  auto_generated BOOLEAN DEFAULT FALSE,
  source_project_id VARCHAR(255),
  ai_confidence FLOAT DEFAULT 0.8,
  generation_prompt TEXT,
  
  -- メタデータ
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (source_project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 4. ナレッジ自動化履歴テーブル
CREATE TABLE IF NOT EXISTS knowledge_automation_history (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 元タスク情報
  task_id VARCHAR(255) NOT NULL,
  task_title VARCHAR(255),
  completion_data JSONB DEFAULT '{}',
  
  -- 自動化判定結果
  should_generate_knowledge BOOLEAN DEFAULT FALSE,
  knowledge_types JSONB DEFAULT '[]',
  priority_level VARCHAR(20) DEFAULT 'LOW',
  estimated_value INTEGER DEFAULT 1, -- 1-10
  
  -- 生成されたナレッジ
  generated_knowledge_id VARCHAR(255),
  knowledge_title VARCHAR(255),
  knowledge_category VARCHAR(50),
  knowledge_content TEXT,
  knowledge_tags JSONB DEFAULT '[]',
  
  -- 品質評価
  initial_quality_score FLOAT DEFAULT 5.0,
  ai_confidence FLOAT DEFAULT 0.8,
  processing_time_ms INTEGER DEFAULT 0,
  
  -- 使用・改善履歴
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  feedback_count INTEGER DEFAULT 0,
  improvement_suggestions JSONB DEFAULT '[]',
  
  -- メタデータ
  automation_date TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_knowledge_id) REFERENCES knowledge_items(id) ON DELETE CASCADE
);

-- 5. プロジェクト収益実績テーブル
CREATE TABLE IF NOT EXISTS project_revenue_tracking (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  
  -- 予測値 vs 実績値
  predicted_revenue DECIMAL(12,2) DEFAULT 0,
  actual_revenue DECIMAL(12,2) DEFAULT 0,
  revenue_variance DECIMAL(12,2) DEFAULT 0,
  variance_percentage FLOAT DEFAULT 0,
  
  -- 詳細収益分解
  base_contract_actual DECIMAL(12,2) DEFAULT 0,
  additional_work_actual DECIMAL(12,2) DEFAULT 0,
  maintenance_revenue_actual DECIMAL(12,2) DEFAULT 0,
  referral_revenue_actual DECIMAL(12,2) DEFAULT 0,
  
  -- 予測精度評価
  prediction_accuracy FLOAT DEFAULT 0,
  prediction_date TIMESTAMP,
  actual_completion_date TIMESTAMP,
  
  -- 学習データ
  key_success_factors JSONB DEFAULT '[]',
  unexpected_events JSONB DEFAULT '[]',
  lessons_learned TEXT,
  
  -- メタデータ
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_project_financial_project_id ON project_financial_details(project_id);
CREATE INDEX IF NOT EXISTS idx_project_financial_contract_value ON project_financial_details(base_contract_value);
CREATE INDEX IF NOT EXISTS idx_customer_ltv_connection_id ON customer_ltv_analysis(connection_id);
CREATE INDEX IF NOT EXISTS idx_customer_ltv_total ON customer_ltv_analysis(total_ltv);
CREATE INDEX IF NOT EXISTS idx_project_templates_type ON project_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_project_templates_complexity ON project_templates(complexity_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_automation_task_id ON knowledge_automation_history(task_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_automation_generated_id ON knowledge_automation_history(generated_knowledge_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_project_id ON project_revenue_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_accuracy ON project_revenue_tracking(prediction_accuracy);

-- 既存テーブルへの拡張カラム追加（必要に応じて）
-- connections テーブルに業界・企業情報カラム追加
ALTER TABLE connections ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE connections ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE connections ADD COLUMN IF NOT EXISTS annual_revenue DECIMAL(12,2);
ALTER TABLE connections ADD COLUMN IF NOT EXISTS employee_count INTEGER;

-- projects テーブルに財務関連カラム追加
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_value DECIMAL(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS profit_margin FLOAT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS satisfaction_score FLOAT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS success_score FLOAT;

-- tasks テーブルに工数・難易度実績カラム追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours FLOAT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_difficulty FLOAT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_quality FLOAT;

-- Phase 2実装完了の確認用コメント
-- このマイグレーションによりPhase 2の以下機能が利用可能になります：
-- 1. 高度財務管理・LTV分析システム
-- 2. プロジェクトテンプレート自動生成
-- 3. タスク完了時ナレッジ自動化
-- 4. AI支援プロジェクト分析・収益予測