-- Phase 4: Sales Automation Database Schema Extension
-- 営業案件・ステージ・契約テーブル追加

-- Phase 4 Sales Opportunities (営業案件)
CREATE TABLE IF NOT EXISTS "sales_opportunities" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "company_name" TEXT NOT NULL,
  "contact_name" TEXT NOT NULL,
  "contact_position" TEXT,
  "deal_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "priority" TEXT NOT NULL DEFAULT 'C' CHECK ("priority" IN ('A', 'B', 'C', 'D')),
  "stage" TEXT NOT NULL DEFAULT 'prospect' CHECK ("stage" IN ('prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  "expected_close_date" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "notes" TEXT DEFAULT '',
  "risk_score" DECIMAL(3,2) DEFAULT 0.0,
  "probability_score" DECIMAL(3,2) DEFAULT 0.0,
  "last_activity_date" TIMESTAMP,
  "source_type" TEXT DEFAULT 'referral' CHECK ("source_type" IN ('referral', 'cold_outreach', 'networking_event', 'inbound_inquiry', 'social_media', 'existing_client', 'partner_referral')),
  "assigned_to" TEXT,
  "created_by" TEXT,
  "connection_id" TEXT, -- Link to existing connections table
  "appointment_id" TEXT, -- Link to existing appointments table
  
  -- Foreign key constraints
  CONSTRAINT "fk_sales_opportunities_assigned_to" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_sales_opportunities_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_sales_opportunities_connection" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_sales_opportunities_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL
);

-- Indexes for sales_opportunities
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_stage" ON "sales_opportunities"("stage");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_assigned" ON "sales_opportunities"("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_created_by" ON "sales_opportunities"("created_by");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_updated" ON "sales_opportunities"("updated_at");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_close_date" ON "sales_opportunities"("expected_close_date");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_value" ON "sales_opportunities"("deal_value");

-- Phase 4 Sales Activities (営業活動)
CREATE TABLE IF NOT EXISTS "sales_activities" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "opportunity_id" TEXT NOT NULL,
  "type" TEXT NOT NULL CHECK ("type" IN ('initial_contact', 'meeting', 'proposal_sent', 'follow_up', 'negotiation', 'contract_review', 'contract_signed', 'lost_opportunity')),
  "title" TEXT NOT NULL,
  "description" TEXT DEFAULT '',
  "outcome" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "scheduled_date" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "user_id" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  
  -- Foreign key constraints
  CONSTRAINT "fk_sales_activities_opportunity" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_sales_activities_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes for sales_activities
CREATE INDEX IF NOT EXISTS "idx_sales_activities_opportunity" ON "sales_activities"("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_sales_activities_type" ON "sales_activities"("type");
CREATE INDEX IF NOT EXISTS "idx_sales_activities_user" ON "sales_activities"("user_id");
CREATE INDEX IF NOT EXISTS "idx_sales_activities_created" ON "sales_activities"("created_at");

-- Phase 4 Contracts (契約)
CREATE TABLE IF NOT EXISTS "contracts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "opportunity_id" TEXT NOT NULL,
  "contract_number" TEXT NOT NULL UNIQUE,
  "contract_type" TEXT NOT NULL DEFAULT 'new' CHECK ("contract_type" IN ('new', 'renewal', 'expansion', 'modification')),
  "company_name" TEXT NOT NULL,
  "contact_name" TEXT NOT NULL,
  "contract_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "contract_period" INTEGER NOT NULL DEFAULT 12, -- 月数
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'review', 'approval', 'signed', 'active', 'expired', 'terminated')),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "assigned_team" JSONB DEFAULT '[]',
  "back_office_tasks_generated" BOOLEAN DEFAULT FALSE,
  "knowledge_items_created" BOOLEAN DEFAULT FALSE,
  "metadata" JSONB DEFAULT '{}',
  "terms" JSONB DEFAULT '[]',
  "attachments" JSONB DEFAULT '[]',
  
  -- Foreign key constraints
  CONSTRAINT "fk_contracts_opportunity" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE RESTRICT
);

-- Indexes for contracts
CREATE INDEX IF NOT EXISTS "idx_contracts_opportunity" ON "contracts"("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_contracts_status" ON "contracts"("status");
CREATE INDEX IF NOT EXISTS "idx_contracts_start_date" ON "contracts"("start_date");
CREATE INDEX IF NOT EXISTS "idx_contracts_value" ON "contracts"("contract_value");
CREATE INDEX IF NOT EXISTS "idx_contracts_number" ON "contracts"("contract_number");

-- Phase 4 Back Office Tasks (バックオフィスタスク)
CREATE TABLE IF NOT EXISTS "back_office_tasks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contract_id" TEXT NOT NULL,
  "category" TEXT NOT NULL CHECK ("category" IN ('legal', 'finance', 'hr', 'procurement', 'project_setup', 'infrastructure', 'compliance', 'documentation')),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "assignee_id" TEXT,
  "assignee_department" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'C' CHECK ("priority" IN ('A', 'B', 'C', 'D')),
  "due_date" TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'in_progress', 'completed', 'blocked')),
  "dependencies" JSONB DEFAULT '[]',
  "estimated_hours" DECIMAL(5,2) DEFAULT 0,
  "template" TEXT,
  "automation_rules" JSONB DEFAULT '[]',
  "checklist" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT "fk_back_office_tasks_contract" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_back_office_tasks_assignee" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Indexes for back_office_tasks
CREATE INDEX IF NOT EXISTS "idx_back_office_tasks_contract" ON "back_office_tasks"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_back_office_tasks_category" ON "back_office_tasks"("category");
CREATE INDEX IF NOT EXISTS "idx_back_office_tasks_assignee" ON "back_office_tasks"("assignee_id");
CREATE INDEX IF NOT EXISTS "idx_back_office_tasks_status" ON "back_office_tasks"("status");
CREATE INDEX IF NOT EXISTS "idx_back_office_tasks_due_date" ON "back_office_tasks"("due_date");

-- Phase 4 Customer Profiles (顧客プロファイル)
CREATE TABLE IF NOT EXISTS "customer_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "company_name" TEXT NOT NULL,
  "industry" TEXT NOT NULL,
  "company_size" TEXT NOT NULL CHECK ("company_size" IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  "revenue" BIGINT DEFAULT 0,
  "employees" INTEGER DEFAULT 0,
  "business_model" TEXT NOT NULL CHECK ("business_model" IN ('b2b', 'b2c', 'b2b2c', 'marketplace', 'saas', 'traditional')),
  "tech_maturity" TEXT NOT NULL DEFAULT 'intermediate' CHECK ("tech_maturity" IN ('beginner', 'intermediate', 'advanced', 'cutting_edge')),
  "decision_makers" JSONB DEFAULT '[]',
  "pain_points" JSONB DEFAULT '[]',
  "current_solutions" JSONB DEFAULT '[]',
  "budget_info" JSONB DEFAULT '{}',
  "timeframe" TEXT DEFAULT '',
  "competitive_position" JSONB DEFAULT '{}',
  "risk_factors" JSONB DEFAULT '[]',
  "opportunities" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "connection_id" TEXT,
  
  -- Foreign key constraints
  CONSTRAINT "fk_customer_profiles_connection" FOREIGN KEY ("connection_id") REFERENCES "connections"("id") ON DELETE SET NULL
);

-- Indexes for customer_profiles
CREATE INDEX IF NOT EXISTS "idx_customer_profiles_company" ON "customer_profiles"("company_name");
CREATE INDEX IF NOT EXISTS "idx_customer_profiles_industry" ON "customer_profiles"("industry");
CREATE INDEX IF NOT EXISTS "idx_customer_profiles_size" ON "customer_profiles"("company_size");
CREATE INDEX IF NOT EXISTS "idx_customer_profiles_connection" ON "customer_profiles"("connection_id");

-- Phase 4 AI Proposals (AI提案書)
CREATE TABLE IF NOT EXISTS "ai_proposals" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customer_id" TEXT NOT NULL,
  "opportunity_id" TEXT,
  "title" TEXT NOT NULL,
  "executive_summary" TEXT NOT NULL,
  "problem_statement" TEXT NOT NULL,
  "proposed_solution" JSONB NOT NULL,
  "business_case" JSONB NOT NULL,
  "technical_approach" JSONB NOT NULL,
  "timeline" JSONB NOT NULL,
  "pricing" JSONB NOT NULL,
  "risk_mitigation" JSONB DEFAULT '[]',
  "next_steps" JSONB DEFAULT '[]',
  "appendices" JSONB DEFAULT '[]',
  "confidence" DECIMAL(3,2) DEFAULT 0.5,
  "generated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "customizations" JSONB DEFAULT '[]',
  "status" TEXT DEFAULT 'draft' CHECK ("status" IN ('draft', 'review', 'sent', 'accepted', 'rejected')),
  "created_by" TEXT,
  
  -- Foreign key constraints
  CONSTRAINT "fk_ai_proposals_customer" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_ai_proposals_opportunity" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_ai_proposals_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Indexes for ai_proposals
CREATE INDEX IF NOT EXISTS "idx_ai_proposals_customer" ON "ai_proposals"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_ai_proposals_opportunity" ON "ai_proposals"("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_ai_proposals_status" ON "ai_proposals"("status");
CREATE INDEX IF NOT EXISTS "idx_ai_proposals_generated" ON "ai_proposals"("generated_at");

-- Phase 4 Conversion Predictions (成約確率予測)
CREATE TABLE IF NOT EXISTS "conversion_predictions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "opportunity_id" TEXT NOT NULL,
  "current_probability" DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  "probability_trend" TEXT NOT NULL DEFAULT 'stable' CHECK ("probability_trend" IN ('increasing', 'decreasing', 'stable')),
  "confidence_level" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  "expected_close_date" TIMESTAMP,
  "probability_by_stage" JSONB DEFAULT '{}',
  "risk_factors" JSONB DEFAULT '[]',
  "success_factors" JSONB DEFAULT '[]',
  "recommended_actions" JSONB DEFAULT '[]',
  "historical_comparison" JSONB DEFAULT '{}',
  "next_milestones" JSONB DEFAULT '[]',
  "last_updated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "model_version" TEXT DEFAULT 'v1.0',
  "created_by" TEXT,
  
  -- Foreign key constraints
  CONSTRAINT "fk_conversion_predictions_opportunity" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_conversion_predictions_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Indexes for conversion_predictions
CREATE INDEX IF NOT EXISTS "idx_conversion_predictions_opportunity" ON "conversion_predictions"("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_conversion_predictions_probability" ON "conversion_predictions"("current_probability");
CREATE INDEX IF NOT EXISTS "idx_conversion_predictions_updated" ON "conversion_predictions"("last_updated");

-- Phase 4 Menu Sessions (メニューセッション)
CREATE TABLE IF NOT EXISTS "menu_sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "group_id" TEXT,
  "action_id" TEXT NOT NULL,
  "current_step" INTEGER DEFAULT 0,
  "parameters" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'completed', 'cancelled', 'expired')),
  
  -- Foreign key constraints
  CONSTRAINT "fk_menu_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes for menu_sessions
CREATE INDEX IF NOT EXISTS "idx_menu_sessions_user" ON "menu_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_menu_sessions_status" ON "menu_sessions"("status");
CREATE INDEX IF NOT EXISTS "idx_menu_sessions_expires" ON "menu_sessions"("expires_at");

-- Phase 4 Automation Results (自動化結果)
CREATE TABLE IF NOT EXISTS "automation_results" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "opportunity_id" TEXT,
  "contract_id" TEXT,
  "action" TEXT NOT NULL CHECK ("action" IN ('stage_progression', 'risk_alert', 'follow_up_reminder', 'escalation', 'contract_processing')),
  "previous_stage" TEXT,
  "new_stage" TEXT,
  "reason" TEXT NOT NULL,
  "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  "recommended_actions" JSONB DEFAULT '[]',
  "created_tasks" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "executed_by" TEXT DEFAULT 'system',
  
  -- Foreign key constraints
  CONSTRAINT "fk_automation_results_opportunity" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_automation_results_contract" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL
);

-- Indexes for automation_results
CREATE INDEX IF NOT EXISTS "idx_automation_results_opportunity" ON "automation_results"("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_automation_results_contract" ON "automation_results"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_automation_results_action" ON "automation_results"("action");
CREATE INDEX IF NOT EXISTS "idx_automation_results_created" ON "automation_results"("created_at");

-- Phase 4 Sales Metrics (営業メトリクス)
CREATE TABLE IF NOT EXISTS "sales_metrics" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "metric_date" DATE NOT NULL UNIQUE,
  "total_opportunities" INTEGER DEFAULT 0,
  "active_opportunities" INTEGER DEFAULT 0,
  "conversion_rate" DECIMAL(5,4) DEFAULT 0.0000,
  "average_deal_size" DECIMAL(12,2) DEFAULT 0,
  "average_sales_cycle" DECIMAL(5,1) DEFAULT 0.0,
  "stage_distribution" JSONB DEFAULT '{}',
  "risk_distribution" JSONB DEFAULT '{}',
  "pipeline_value" DECIMAL(15,2) DEFAULT 0,
  "forecasted_revenue" DECIMAL(15,2) DEFAULT 0,
  "monthly_trends" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for sales_metrics
CREATE INDEX IF NOT EXISTS "idx_sales_metrics_date" ON "sales_metrics"("metric_date");
CREATE INDEX IF NOT EXISTS "idx_sales_metrics_pipeline" ON "sales_metrics"("pipeline_value");

-- Phase 4 Knowledge Items Extension (既存テーブルに Phase 4 関連カラム追加)
-- Add contract_id column to knowledge_items for Phase 4 automation
ALTER TABLE "knowledge_items" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;
ALTER TABLE "knowledge_items" ADD COLUMN IF NOT EXISTS "opportunity_id" TEXT;
ALTER TABLE "knowledge_items" ADD COLUMN IF NOT EXISTS "automation_source" TEXT DEFAULT 'manual';

-- Foreign key constraints for knowledge_items extensions
ALTER TABLE "knowledge_items" ADD CONSTRAINT IF NOT EXISTS "fk_knowledge_items_contract" 
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL;
ALTER TABLE "knowledge_items" ADD CONSTRAINT IF NOT EXISTS "fk_knowledge_items_opportunity" 
  FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL;

-- Additional indexes for knowledge_items
CREATE INDEX IF NOT EXISTS "idx_knowledge_items_contract" ON "knowledge_items"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_knowledge_items_opportunity" ON "knowledge_items"("opportunity_id");
CREATE INDEX IF NOT EXISTS "idx_knowledge_items_automation_source" ON "knowledge_items"("automation_source");

-- Update existing appointments table to link with sales_opportunities
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "opportunity_id" TEXT;
ALTER TABLE "appointments" ADD CONSTRAINT IF NOT EXISTS "fk_appointments_opportunity" 
  FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_appointments_opportunity" ON "appointments"("opportunity_id");

-- Phase 4 Performance Views for Analytics

-- Sales Pipeline Overview
CREATE OR REPLACE VIEW "sales_pipeline_overview" AS
SELECT 
  stage,
  COUNT(*) as opportunity_count,
  SUM(deal_value) as total_value,
  AVG(deal_value) as average_value,
  AVG(probability_score) as average_probability,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) as average_days_in_stage
FROM sales_opportunities 
WHERE stage NOT IN ('closed_won', 'closed_lost')
GROUP BY stage;

-- Sales Performance Summary
CREATE OR REPLACE VIEW "sales_performance_summary" AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_opportunities,
  SUM(CASE WHEN stage = 'closed_won' THEN 1 ELSE 0 END) as won_opportunities,
  SUM(CASE WHEN stage = 'closed_lost' THEN 1 ELSE 0 END) as lost_opportunities,
  SUM(CASE WHEN stage = 'closed_won' THEN deal_value ELSE 0 END) as won_revenue,
  ROUND(
    CASE 
      WHEN SUM(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 ELSE 0 END) > 0 
      THEN SUM(CASE WHEN stage = 'closed_won' THEN 1 ELSE 0 END)::DECIMAL / 
           SUM(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 ELSE 0 END) * 100
      ELSE 0 
    END, 2
  ) as conversion_rate_percent
FROM sales_opportunities 
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Active Contracts Summary
CREATE OR REPLACE VIEW "active_contracts_summary" AS
SELECT 
  status,
  COUNT(*) as contract_count,
  SUM(contract_value) as total_value,
  AVG(contract_value) as average_value,
  AVG(contract_period) as average_period_months
FROM contracts 
GROUP BY status;

-- Comments
COMMENT ON TABLE "sales_opportunities" IS 'Phase 4: 営業案件管理テーブル';
COMMENT ON TABLE "sales_activities" IS 'Phase 4: 営業活動履歴テーブル';
COMMENT ON TABLE "contracts" IS 'Phase 4: 契約管理テーブル';
COMMENT ON TABLE "back_office_tasks" IS 'Phase 4: バックオフィスタスク管理テーブル';
COMMENT ON TABLE "customer_profiles" IS 'Phase 4: 顧客プロファイル管理テーブル';
COMMENT ON TABLE "ai_proposals" IS 'Phase 4: AI提案書管理テーブル';
COMMENT ON TABLE "conversion_predictions" IS 'Phase 4: 成約確率予測テーブル';
COMMENT ON TABLE "menu_sessions" IS 'Phase 4: セーフメニューセッション管理テーブル';
COMMENT ON TABLE "automation_results" IS 'Phase 4: 自動化実行結果テーブル';
COMMENT ON TABLE "sales_metrics" IS 'Phase 4: 営業メトリクス集計テーブル';

-- Phase 4 完了
-- このマイグレーションにより、Phase 4の営業プロセス完全自動化に必要な
-- 全てのデータベーススキーマが追加されました