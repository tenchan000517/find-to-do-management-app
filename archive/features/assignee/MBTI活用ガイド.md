# MBTI性格タイプ活用タスク管理システム 技術仕様書

## 1. 概要

### 1.1 目的
MBTI（Myers-Briggs Type Indicator）の16性格タイプを活用し、プロジェクトの成功確率予測、リソース見積もり、チーム編成最適化を行うタスク管理システムのデータ構造とアルゴリズム仕様書。

### 1.2 主要機能
- **リソース見積もり**: メンバーの性格特性に基づくタスク工数の自動調整
- **プロジェクト成功確率予測**: チーム構成とスキルバランスの分析
- **不足スキル検出**: プロジェクトに必要な能力・役割の不足を自動検出
- **チーム編成最適化**: 相性とスキル補完性を考慮した最適なメンバー配置

## 2. データ構造概要

### 2.1 最上位構造
```json
{
  "mbti_types": {},           // 16性格タイプの詳細データ
  "compatibility_matrix": {}, // 性格タイプ間の相性マトリックス
  "task_weight_factors": {},  // タスク重み計算用係数
  "project_success_factors": {} // プロジェクト成功要因
}
```

### 2.2 性格タイプ分類
| カテゴリ | タイプ | 特徴 |
|---------|-------|------|
| 分析家 | INTJ, INTP, ENTJ, ENTP | 戦略的思考、革新性重視 |
| 外交官 | INFJ, INFP, ENFJ, ENFP | 人間関係、価値観重視 |
| 番人 | ISTJ, ISFJ, ESTJ, ESFJ | 安定性、責任感重視 |
| 探検家 | ISTP, ISFP, ESTP, ESFP | 柔軟性、実用性重視 |

## 3. フィールド詳細リファレンス

### 3.1 `mbti_types[TYPE_CODE]`

#### 基本情報
```json
{
  "name": "性格タイプ名（日本語）",
  "category": "分析家 | 外交官 | 番人 | 探検家",
  "population_percentage": "人口に占める割合（%）"
}
```

#### 次元分析 `dimensions`
```json
{
  "extraversion": 0,  // 0=内向(I), 1=外向(E)
  "sensing": 0,       // 0=直感(N), 1=感覚(S)  
  "thinking": 1,      // 0=感情(F), 1=思考(T)
  "judging": 1        // 0=知覚(P), 1=判断(J)
}
```

#### 核心特性 `core_traits` (0-10スケール)
| フィールド | 説明 | 活用場面 |
|-----------|------|----------|
| `independence` | 独立性 | 個人作業の適性判定 |
| `strategic_thinking` | 戦略的思考力 | 企画・計画フェーズの配置 |
| `perfectionism` | 完璧主義度 | 品質管理タスクの適性 |
| `innovation` | 革新性 | 創造的タスクの適性 |
| `focus` | 集中力 | 長期タスクの工数見積もり |
| `leadership` | リーダーシップ | チームリーダー選出 |
| `social_skills` | 社交性 | 対外折衝・調整業務の適性 |
| `adaptability` | 適応性 | 変更・緊急対応タスクの適性 |
| `detail_orientation` | 詳細重視度 | 細かい作業の工数調整 |
| `team_collaboration` | チーム協働性 | チーム編成時の相性判定 |

#### タスク適性 `task_preferences` (0-10スケール)
```json
{
  "complex_problem_solving": 8,    // 複雑な問題解決
  "strategic_planning": 9,         // 戦略企画
  "independent_work": 8,           // 個人作業
  "creative_tasks": 7,             // 創造的タスク
  "leadership_tasks": 6,           // リーダーシップタスク
  "routine_tasks": 3,              // ルーティンワーク
  "social_interaction_tasks": 4,   // 対人業務
  "detail_oriented_tasks": 7       // 詳細作業
}
```

#### ストレス要因 `stress_factors`
```json
[
  "micromanagement",      // マイクロマネジメント
  "過度な社交的要求",        // 性格に合わない要求
  "不明確な指示",          // 曖昧な指示
  "非効率なプロセス",       // 効率性の問題
  "感情的な対立"           // 人間関係の問題
]
```

#### プロジェクトフェーズ適性 `project_phase_suitability` (0-10スケール)
```json
{
  "planning": 10,        // 企画・計画
  "analysis": 9,         // 分析
  "design": 9,           // 設計
  "implementation": 7,   // 実装
  "testing": 8,          // テスト
  "maintenance": 6       // 保守
}
```

### 3.2 `compatibility_matrix`
性格タイプ間の協働相性を0-10で評価
```json
{
  "INTJ": {
    "ENTJ": 8,  // INTJとENTJの相性は8/10
    "ENTP": 7,
    // ...
  }
}
```

### 3.3 `task_weight_factors`
タスク工数の調整係数
```json
{
  "high_stress_multiplier": 1.5,        // ストレス要因のタスクは1.5倍重い
  "optimal_task_multiplier": 0.8,       // 適性の高いタスクは0.8倍
  "social_interaction_bonus": {
    "high_social_skills": 0.9,          // 社交性が高い場合0.9倍
    "low_social_skills": 1.2             // 社交性が低い場合1.2倍
  },
  "leadership_bonus": {
    "high_leadership": 0.8,
    "low_leadership": 1.3
  },
  "detail_work_penalty": {
    "low_detail_orientation": 1.4,
    "high_detail_orientation": 0.9
  }
}
```

### 3.4 `project_success_factors`
プロジェクト成功確率の計算要素
```json
{
  "team_diversity_bonus": 0.1,           // チーム多様性ボーナス
  "complementary_skills_bonus": 0.15,    // スキル補完ボーナス  
  "leadership_presence_bonus": 0.2,      // リーダーシップ存在ボーナス
  "detail_orientation_minimum": 6,        // 必要最小詳細重視度
  "innovation_minimum": 5,               // 必要最小革新性
  "team_collaboration_minimum": 6        // 必要最小協働性
}
```

## 4. 主要計算ロジック

### 4.1 タスク工数調整計算
```javascript
function calculateTaskWeight(memberType, taskType, baseHours) {
  const member = mbti_types[memberType];
  const taskPreference = member.task_preferences[taskType];
  
  let multiplier = 1.0;
  
  // 適性による調整
  if (taskPreference >= 8) {
    multiplier *= task_weight_factors.optimal_task_multiplier; // 0.8
  } else if (taskPreference <= 3) {
    multiplier *= task_weight_factors.high_stress_multiplier; // 1.5
  }
  
  // 社交性による調整（social_interaction_tasksの場合）
  if (taskType === 'social_interaction_tasks') {
    if (member.core_traits.social_skills >= 8) {
      multiplier *= task_weight_factors.social_interaction_bonus.high_social_skills;
    } else if (member.core_traits.social_skills <= 4) {
      multiplier *= task_weight_factors.social_interaction_bonus.low_social_skills;
    }
  }
  
  return baseHours * multiplier;
}
```

### 4.2 プロジェクト成功確率計算
```javascript
function calculateProjectSuccessRate(teamMembers) {
  let baseRate = 0.5; // ベース成功率50%
  
  // チーム多様性ボーナス
  const uniqueCategories = new Set(teamMembers.map(m => m.category)).size;
  if (uniqueCategories >= 3) {
    baseRate += project_success_factors.team_diversity_bonus;
  }
  
  // 必要最小値チェック
  const avgDetailOrientation = teamMembers.reduce((sum, m) => 
    sum + m.core_traits.detail_orientation, 0) / teamMembers.length;
  
  if (avgDetailOrientation < project_success_factors.detail_orientation_minimum) {
    baseRate -= 0.1; // 10%減点
  }
  
  // リーダーシップ存在チェック
  const hasLeader = teamMembers.some(m => m.core_traits.leadership >= 8);
  if (hasLeader) {
    baseRate += project_success_factors.leadership_presence_bonus;
  }
  
  return Math.min(baseRate, 1.0); // 最大100%
}
```

### 4.3 不足スキル検出
```javascript
function detectMissingSkills(teamMembers, projectPhases) {
  const missingSkills = [];
  
  projectPhases.forEach(phase => {
    const phaseAverageSkill = teamMembers.reduce((sum, member) => 
      sum + member.project_phase_suitability[phase], 0) / teamMembers.length;
    
    if (phaseAverageSkill < 6) { // 閾値6未満
      missingSkills.push({
        phase: phase,
        currentLevel: phaseAverageSkill,
        requiredLevel: 6,
        deficit: 6 - phaseAverageSkill
      });
    }
  });
  
  return missingSkills;
}
```

### 4.4 チーム相性スコア計算
```javascript
function calculateTeamCompatibility(teamMembers) {
  let totalCompatibility = 0;
  let pairCount = 0;
  
  for (let i = 0; i < teamMembers.length; i++) {
    for (let j = i + 1; j < teamMembers.length; j++) {
      const type1 = teamMembers[i].type;
      const type2 = teamMembers[j].type;
      totalCompatibility += compatibility_matrix[type1][type2];
      pairCount++;
    }
  }
  
  return pairCount > 0 ? totalCompatibility / pairCount : 0;
}
```

## 5. 実装例

### 5.1 メンバー適性分析API
```javascript
class MBTITaskManager {
  constructor(mbtiData) {
    this.data = mbtiData;
  }
  
  analyzeMemberFitness(memberType, taskRequirements) {
    const member = this.data.mbti_types[memberType];
    const fitness = {};
    
    Object.keys(taskRequirements).forEach(requirement => {
      const memberSkill = member.core_traits[requirement] || 0;
      const requiredLevel = taskRequirements[requirement];
      fitness[requirement] = {
        current: memberSkill,
        required: requiredLevel,
        gap: requiredLevel - memberSkill,
        suitable: memberSkill >= requiredLevel
      };
    });
    
    return fitness;
  }
  
  recommendOptimalRoles(memberType) {
    const member = this.data.mbti_types[memberType];
    return member.optimal_roles;
  }
  
  getStressFactors(memberType) {
    return this.data.mbti_types[memberType].stress_factors;
  }
}
```

### 5.2 使用例
```javascript
const taskManager = new MBTITaskManager(mbtiData);

// INTJ（建築家）の戦略企画タスクへの適性分析
const fitness = taskManager.analyzeMemberFitness('INTJ', {
  strategic_thinking: 8,
  leadership: 6,
  innovation: 7
});

// 結果: 
// {
//   strategic_thinking: { current: 10, required: 8, gap: -2, suitable: true },
//   leadership: { current: 7, required: 6, gap: -1, suitable: true },
//   innovation: { current: 9, required: 7, gap: -2, suitable: true }
// }
```

## 6. クイックリファレンス

### 6.1 よく使用するフィールド
| 用途 | フィールドパス | 説明 |
|------|---------------|------|
| タスク適性判定 | `mbti_types[TYPE].task_preferences[TASK]` | 0-10スケール |
| リーダー選出 | `mbti_types[TYPE].core_traits.leadership` | 8以上推奨 |
| 詳細作業適性 | `mbti_types[TYPE].core_traits.detail_orientation` | 7以上推奨 |
| チーム相性 | `compatibility_matrix[TYPE1][TYPE2]` | 6以上良好 |
| ストレス要因 | `mbti_types[TYPE].stress_factors` | 配列形式 |

### 6.2 閾値ガイドライン
| 項目 | 低 | 中 | 高 | 説明 |
|------|----|----|----|----|
| スキルレベル | 0-3 | 4-6 | 7-10 | 一般的な能力評価 |
| 相性スコア | 0-4 | 5-6 | 7-10 | チーム編成時の相性 |
| 成功確率 | 0-0.6 | 0.6-0.8 | 0.8-1.0 | プロジェクト成功率 |

### 6.3 計算式サマリー
```javascript
// タスク工数 = ベース工数 × 適性係数 × ストレス係数
taskHours = baseHours * aptitudeMultiplier * stressMultiplier

// 成功率 = ベース率 + 多様性ボーナス + リーダーシップボーナス - 不足ペナルティ  
successRate = baseRate + diversityBonus + leadershipBonus - deficitPenalty

// チーム相性 = Σ(ペア相性) / ペア数
teamCompatibility = sum(pairCompatibility) / pairCount
```

## 7. 注意事項・制限事項

### 7.1 データの性質
- MBTIは科学的根拠に議論があるため、補助的指標として使用
- 個人差があるため、実際の能力や成果と100%一致しない
- 定期的な見直しと実績データとの照合が必要

### 7.2 実装時の考慮点
- メンバーのMBTIタイプは任意入力とし、強制しない
- 他の評価指標（スキル、経験年数等）との組み合わせを推奨
- 計算結果は参考値として提示し、最終判断は人間が行う

### 7.3 拡張性
- 新しいタスクタイプの追加は`task_preferences`に項目追加
- 相性マトリックスは実績データに基づく調整が可能
- 係数値（multiplier）は運用データを基に最適化可能