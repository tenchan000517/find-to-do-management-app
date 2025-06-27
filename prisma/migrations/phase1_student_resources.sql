-- Phase 1: Database Extension for Student Resources and MBTI Integration
-- Migration Date: 2025-06-27
-- Description: Add student resource management and MBTI fields to support Phase 1 implementation

-- 1. Extend users table with Phase 1 fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_commit_hours INTEGER DEFAULT 20;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_load_percentage FLOAT DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mbti_type VARCHAR(4) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_resource_data JSONB DEFAULT '{}';

-- 2. Create student_resources table
CREATE TABLE IF NOT EXISTS student_resources (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  
  -- Time Management
  weekly_commit_hours INTEGER DEFAULT 20,
  current_load_percentage FLOAT DEFAULT 0.0,
  semester_availability JSONB DEFAULT '{}',
  emergency_available_hours JSONB DEFAULT '{}',
  
  -- Skills and Aptitude
  technical_skills JSONB DEFAULT '[]',
  soft_skills JSONB DEFAULT '[]',
  learning_preferences JSONB DEFAULT '{}',
  project_experience JSONB DEFAULT '[]',
  
  -- Performance Metrics
  task_completion_rate FLOAT DEFAULT 1.0,
  quality_score FLOAT DEFAULT 1.0,
  collaboration_score FLOAT DEFAULT 1.0,
  
  -- MBTI Integration
  mbti_analysis JSONB DEFAULT '{}',
  personality_strengths JSONB DEFAULT '[]',
  optimal_roles JSONB DEFAULT '[]',
  stress_factors JSONB DEFAULT '[]',
  motivation_factors JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create project_resource_allocation table
CREATE TABLE IF NOT EXISTS project_resource_allocation (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  student_resource_id VARCHAR(255) NOT NULL,
  
  -- Allocation Information
  allocated_hours INTEGER NOT NULL,
  role_in_project VARCHAR(100) NOT NULL,
  responsibility_level VARCHAR(50) DEFAULT 'MEMBER',
  
  -- Performance Tracking
  effectiveness_score FLOAT DEFAULT 1.0,
  contribution_score FLOAT DEFAULT 1.0,
  satisfaction_score FLOAT DEFAULT 1.0,
  
  -- MBTI Team Dynamics
  team_compatibility_score FLOAT DEFAULT 0.0,
  role_aptitude_score FLOAT DEFAULT 0.0,
  predicted_performance FLOAT DEFAULT 0.0,
  
  -- Timeline
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_resource_id) REFERENCES student_resources(id) ON DELETE CASCADE
);

-- 4. Create mbti_team_analysis table for storing team optimization results
CREATE TABLE IF NOT EXISTS mbti_team_analysis (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  
  -- Team Composition
  team_members JSONB DEFAULT '[]',
  team_compatibility_score FLOAT DEFAULT 0.0,
  
  -- Analysis Results
  predicted_dynamics TEXT DEFAULT '',
  potential_challenges JSONB DEFAULT '[]',
  management_tips JSONB DEFAULT '[]',
  
  -- Success Predictions
  success_probability FLOAT DEFAULT 0.0,
  risk_factors JSONB DEFAULT '[]',
  optimization_recommendations JSONB DEFAULT '[]',
  
  -- Metadata
  analysis_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. Create resource_optimization_history table for tracking optimization decisions
CREATE TABLE IF NOT EXISTS resource_optimization_history (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  
  -- Optimization Request
  optimization_request JSONB DEFAULT '{}',
  
  -- AI Recommendations
  ai_recommendations JSONB DEFAULT '{}',
  recommended_allocations JSONB DEFAULT '[]',
  
  -- Decision Tracking
  selected_allocation JSONB DEFAULT '{}',
  decision_rationale TEXT DEFAULT '',
  
  -- Outcome Tracking
  actual_performance JSONB DEFAULT '{}',
  lessons_learned JSONB DEFAULT '[]',
  
  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_weekly_commit_hours ON users(weekly_commit_hours);
CREATE INDEX IF NOT EXISTS idx_users_mbti_type ON users(mbti_type);
CREATE INDEX IF NOT EXISTS idx_users_current_load ON users(current_load_percentage);

CREATE INDEX IF NOT EXISTS idx_student_resources_user_id ON student_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_student_resources_load ON student_resources(current_load_percentage);
CREATE INDEX IF NOT EXISTS idx_student_resources_skills ON student_resources USING GIN (technical_skills);
CREATE INDEX IF NOT EXISTS idx_student_resources_mbti ON student_resources USING GIN (mbti_analysis);

CREATE INDEX IF NOT EXISTS idx_project_allocation_project ON project_resource_allocation(project_id);
CREATE INDEX IF NOT EXISTS idx_project_allocation_student ON project_resource_allocation(student_resource_id);
CREATE INDEX IF NOT EXISTS idx_project_allocation_active ON project_resource_allocation(end_date) WHERE end_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_allocation_compatibility ON project_resource_allocation(team_compatibility_score);

CREATE INDEX IF NOT EXISTS idx_mbti_team_analysis_project ON mbti_team_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_mbti_team_analysis_score ON mbti_team_analysis(team_compatibility_score);
CREATE INDEX IF NOT EXISTS idx_mbti_team_analysis_date ON mbti_team_analysis(analysis_date);

CREATE INDEX IF NOT EXISTS idx_optimization_history_project ON resource_optimization_history(project_id);
CREATE INDEX IF NOT EXISTS idx_optimization_history_created_by ON resource_optimization_history(created_by);
CREATE INDEX IF NOT EXISTS idx_optimization_history_date ON resource_optimization_history(created_at);

-- 7. Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_student_resources_updated_at 
    BEFORE UPDATE ON student_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_project_resource_allocation_updated_at 
    BEFORE UPDATE ON project_resource_allocation 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_mbti_team_analysis_updated_at 
    BEFORE UPDATE ON mbti_team_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_optimization_history_updated_at 
    BEFORE UPDATE ON resource_optimization_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert initial sample data for testing (optional)
-- This will help with immediate testing and development

-- Create sample student resources for existing users
INSERT INTO student_resources (user_id, weekly_commit_hours, current_load_percentage, technical_skills, soft_skills)
SELECT 
    id,
    20,
    0.0,
    '["JavaScript", "TypeScript", "React", "Node.js"]'::jsonb,
    '["Communication", "Problem Solving", "Team Work"]'::jsonb
FROM users 
WHERE id NOT IN (SELECT user_id FROM student_resources)
ON CONFLICT DO NOTHING;

-- Update some users with sample MBTI types for testing
UPDATE users 
SET mbti_type = CASE 
    WHEN RANDOM() < 0.25 THEN 'INTJ'
    WHEN RANDOM() < 0.5 THEN 'ENTJ'
    WHEN RANDOM() < 0.75 THEN 'ENFP'
    ELSE 'ISTJ'
END
WHERE mbti_type IS NULL AND RANDOM() < 0.5;

-- Add sample MBTI analysis data
UPDATE student_resources 
SET mbti_analysis = jsonb_build_object(
    'analyzed_at', NOW(),
    'confidence_score', 0.8,
    'primary_strengths', ARRAY['strategic_thinking', 'independence', 'problem_solving'],
    'growth_areas', ARRAY['communication', 'team_collaboration'],
    'optimal_team_roles', ARRAY['technical_lead', 'architect', 'analyst']
)
WHERE mbti_analysis = '{}';

COMMENT ON TABLE student_resources IS 'Phase 1: Student resource management with MBTI integration for optimal team composition';
COMMENT ON TABLE project_resource_allocation IS 'Phase 1: Track project resource allocations with MBTI-based team dynamics';
COMMENT ON TABLE mbti_team_analysis IS 'Phase 1: Store MBTI team analysis results for projects';
COMMENT ON TABLE resource_optimization_history IS 'Phase 1: Track resource optimization decisions and outcomes';