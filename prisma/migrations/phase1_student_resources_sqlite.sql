-- Phase 1: Database Extension for Student Resources and MBTI Integration (SQLite)
-- Migration Date: 2025-06-27
-- Description: Add student resource management and MBTI fields to support Phase 1 implementation

-- 1. Extend users table with Phase 1 fields
ALTER TABLE users ADD COLUMN weekly_commit_hours INTEGER DEFAULT 20;
ALTER TABLE users ADD COLUMN current_load_percentage REAL DEFAULT 0.0;
ALTER TABLE users ADD COLUMN mbti_type TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN student_resource_data TEXT DEFAULT '{}';

-- 2. Create student_resources table
CREATE TABLE student_resources (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  
  -- Time Management
  weekly_commit_hours INTEGER DEFAULT 20,
  current_load_percentage REAL DEFAULT 0.0,
  semester_availability TEXT DEFAULT '{}',
  emergency_available_hours TEXT DEFAULT '{}',
  
  -- Skills and Aptitude
  technical_skills TEXT DEFAULT '[]',
  soft_skills TEXT DEFAULT '[]',
  learning_preferences TEXT DEFAULT '{}',
  project_experience TEXT DEFAULT '[]',
  
  -- Performance Metrics
  task_completion_rate REAL DEFAULT 1.0,
  quality_score REAL DEFAULT 1.0,
  collaboration_score REAL DEFAULT 1.0,
  
  -- MBTI Integration
  mbti_analysis TEXT DEFAULT '{}',
  personality_strengths TEXT DEFAULT '[]',
  optimal_roles TEXT DEFAULT '[]',
  stress_factors TEXT DEFAULT '[]',
  motivation_factors TEXT DEFAULT '[]',
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create project_resource_allocation table
CREATE TABLE project_resource_allocation (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL,
  student_resource_id TEXT NOT NULL,
  
  -- Allocation Information
  allocated_hours INTEGER NOT NULL,
  role_in_project TEXT NOT NULL,
  responsibility_level TEXT DEFAULT 'MEMBER',
  
  -- Performance Tracking
  effectiveness_score REAL DEFAULT 1.0,
  contribution_score REAL DEFAULT 1.0,
  satisfaction_score REAL DEFAULT 1.0,
  
  -- MBTI Team Dynamics
  team_compatibility_score REAL DEFAULT 0.0,
  role_aptitude_score REAL DEFAULT 0.0,
  predicted_performance REAL DEFAULT 0.0,
  
  -- Timeline
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME DEFAULT NULL,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_resource_id) REFERENCES student_resources(id) ON DELETE CASCADE
);

-- 4. Create mbti_team_analysis table for storing team optimization results
CREATE TABLE mbti_team_analysis (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL,
  
  -- Team Composition
  team_members TEXT DEFAULT '[]',
  team_compatibility_score REAL DEFAULT 0.0,
  
  -- Analysis Results
  predicted_dynamics TEXT DEFAULT '',
  potential_challenges TEXT DEFAULT '[]',
  management_tips TEXT DEFAULT '[]',
  
  -- Success Predictions
  success_probability REAL DEFAULT 0.0,
  risk_factors TEXT DEFAULT '[]',
  optimization_recommendations TEXT DEFAULT '[]',
  
  -- Metadata
  analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. Create resource_optimization_history table for tracking optimization decisions
CREATE TABLE resource_optimization_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL,
  
  -- Optimization Request
  optimization_request TEXT DEFAULT '{}',
  
  -- AI Recommendations
  ai_recommendations TEXT DEFAULT '{}',
  recommended_allocations TEXT DEFAULT '[]',
  
  -- Decision Tracking
  selected_allocation TEXT DEFAULT '{}',
  decision_rationale TEXT DEFAULT '',
  
  -- Outcome Tracking
  actual_performance TEXT DEFAULT '{}',
  lessons_learned TEXT DEFAULT '[]',
  
  -- Metadata
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Create indexes for performance optimization
CREATE INDEX idx_users_weekly_commit_hours ON users(weekly_commit_hours);
CREATE INDEX idx_users_mbti_type ON users(mbti_type);
CREATE INDEX idx_users_current_load ON users(current_load_percentage);

CREATE INDEX idx_student_resources_user_id ON student_resources(user_id);
CREATE INDEX idx_student_resources_load ON student_resources(current_load_percentage);

CREATE INDEX idx_project_allocation_project ON project_resource_allocation(project_id);
CREATE INDEX idx_project_allocation_student ON project_resource_allocation(student_resource_id);
CREATE INDEX idx_project_allocation_compatibility ON project_resource_allocation(team_compatibility_score);

CREATE INDEX idx_mbti_team_analysis_project ON mbti_team_analysis(project_id);
CREATE INDEX idx_mbti_team_analysis_score ON mbti_team_analysis(team_compatibility_score);
CREATE INDEX idx_mbti_team_analysis_date ON mbti_team_analysis(analysis_date);

CREATE INDEX idx_optimization_history_project ON resource_optimization_history(project_id);
CREATE INDEX idx_optimization_history_created_by ON resource_optimization_history(created_by);
CREATE INDEX idx_optimization_history_date ON resource_optimization_history(created_at);

-- 7. Create triggers for automatic timestamp updates
CREATE TRIGGER update_student_resources_updated_at 
    AFTER UPDATE ON student_resources
    FOR EACH ROW
    BEGIN
        UPDATE student_resources 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
    END;

CREATE TRIGGER update_project_resource_allocation_updated_at 
    AFTER UPDATE ON project_resource_allocation
    FOR EACH ROW
    BEGIN
        UPDATE project_resource_allocation 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
    END;

CREATE TRIGGER update_mbti_team_analysis_updated_at 
    AFTER UPDATE ON mbti_team_analysis
    FOR EACH ROW
    BEGIN
        UPDATE mbti_team_analysis 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
    END;

CREATE TRIGGER update_optimization_history_updated_at 
    AFTER UPDATE ON resource_optimization_history
    FOR EACH ROW
    BEGIN
        UPDATE resource_optimization_history 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
    END;