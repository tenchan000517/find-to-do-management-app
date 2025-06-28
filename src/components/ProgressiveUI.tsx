"use client";
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  ChevronRight, 
  Sparkles, 
  Trophy, 
  Target,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface UserProgress {
  level: 'beginner' | 'intermediate' | 'expert';
  tasksCompleted: number;
  daysActive: number;
  featuresUnlocked: string[];
  skillPoints: number;
  achievements: string[];
}

interface FeatureGate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiredLevel: 'beginner' | 'intermediate' | 'expert';
  requiredSkillPoints: number;
  category: 'basic' | 'advanced' | 'expert';
  path: string;
  unlocked: boolean;
}

interface ProgressiveUIProps {
  currentProgress?: UserProgress;
  onLevelChange?: (level: 'beginner' | 'intermediate' | 'expert') => void;
  className?: string;
}

export default function ProgressiveUI({ 
  currentProgress, 
  onLevelChange, 
  className 
}: ProgressiveUIProps) {
  const [userProgress, setUserProgress] = useState<UserProgress>(
    currentProgress || {
      level: 'beginner',
      tasksCompleted: 0,
      daysActive: 1,
      featuresUnlocked: ['tasks', 'calendar'],
      skillPoints: 0,
      achievements: []
    }
  );

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureGate | null>(null);

  // Define feature gates with progressive unlocking
  const featureGates: FeatureGate[] = [
    // Beginner Features (Always Available)
    {
      id: 'tasks',
      title: 'タスク管理',
      description: '基本的なタスクの作成・管理',
      icon: <Target className="w-5 h-5" />,
      requiredLevel: 'beginner',
      requiredSkillPoints: 0,
      category: 'basic',
      path: '/tasks',
      unlocked: true
    },
    {
      id: 'calendar',
      title: 'カレンダー',
      description: 'スケジュール管理',
      icon: <BookOpen className="w-5 h-5" />,
      requiredLevel: 'beginner',
      requiredSkillPoints: 0,
      category: 'basic',
      path: '/calendar',
      unlocked: true
    },

    // Intermediate Features (Unlock after 1 week of usage)
    {
      id: 'projects',
      title: 'プロジェクト管理',
      description: '複数タスクをまとめて管理',
      icon: <Users className="w-5 h-5" />,
      requiredLevel: 'intermediate',
      requiredSkillPoints: 50,
      category: 'advanced',
      path: '/projects',
      unlocked: false
    },
    {
      id: 'voice-input',
      title: '音声タスク作成',
      description: '話すだけでタスクを作成',
      icon: <Sparkles className="w-5 h-5" />,
      requiredLevel: 'intermediate',
      requiredSkillPoints: 30,
      category: 'advanced',
      path: '/dashboard?feature=voice',
      unlocked: false
    },
    {
      id: 'auto-schedule',
      title: '自動スケジューリング',
      description: 'AIが最適なスケジュールを生成',
      icon: <Zap className="w-5 h-5" />,
      requiredLevel: 'intermediate',
      requiredSkillPoints: 40,
      category: 'advanced',
      path: '/dashboard?feature=auto-schedule',
      unlocked: false
    },

    // Expert Features (Unlock after mastering intermediate)
    {
      id: 'mbti-analysis',
      title: 'MBTI チーム最適化',
      description: '性格分析によるチーム編成',
      icon: <Users className="w-5 h-5" />,
      requiredLevel: 'expert',
      requiredSkillPoints: 100,
      category: 'expert',
      path: '/dashboard/mbti',
      unlocked: false
    },
    {
      id: 'ltv-analysis',
      title: 'LTV・収益分析',
      description: '顧客生涯価値と収益予測',
      icon: <BarChart3 className="w-5 h-5" />,
      requiredLevel: 'expert',
      requiredSkillPoints: 120,
      category: 'expert',
      path: '/dashboard/financial',
      unlocked: false
    },
    {
      id: 'sales-automation',
      title: '営業プロセス自動化',
      description: 'AI による営業活動の最適化',
      icon: <Target className="w-5 h-5" />,
      requiredLevel: 'expert',
      requiredSkillPoints: 150,
      category: 'expert',
      path: '/dashboard/sales',
      unlocked: false
    }
  ];

  // Calculate user's current skill points and level
  useEffect(() => {
    calculateUserProgress();
  }, []);

  const calculateUserProgress = async () => {
    try {
      // This would typically fetch from API
      const response = await fetch('/api/user/progress');
      if (response.ok) {
        const progress = await response.json();
        setUserProgress(progress);
        updateFeatureUnlocks(progress);
      } else {
        // Simulate progress calculation
        const simulatedProgress = {
          ...userProgress,
          skillPoints: userProgress.tasksCompleted * 5 + userProgress.daysActive * 10,
          level: calculateLevel(userProgress.tasksCompleted, userProgress.daysActive)
        };
        setUserProgress(simulatedProgress);
        updateFeatureUnlocks(simulatedProgress);
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
    }
  };

  const calculateLevel = (tasksCompleted: number, daysActive: number): 'beginner' | 'intermediate' | 'expert' => {
    const totalScore = tasksCompleted * 5 + daysActive * 10;
    
    if (totalScore >= 200) return 'expert';
    if (totalScore >= 80) return 'intermediate';
    return 'beginner';
  };

  const updateFeatureUnlocks = (progress: UserProgress) => {
    featureGates.forEach(feature => {
      const meetsLevelRequirement = 
        (feature.requiredLevel === 'beginner') ||
        (feature.requiredLevel === 'intermediate' && ['intermediate', 'expert'].includes(progress.level)) ||
        (feature.requiredLevel === 'expert' && progress.level === 'expert');
      
      const meetsSkillRequirement = progress.skillPoints >= feature.requiredSkillPoints;
      
      feature.unlocked = meetsLevelRequirement && meetsSkillRequirement;
    });
  };

  const handleFeatureClick = (feature: FeatureGate) => {
    if (feature.unlocked) {
      window.location.href = feature.path;
    } else {
      setSelectedFeature(feature);
      setShowUpgradePrompt(true);
    }
  };

  const getProgressToNextLevel = () => {
    const currentSkillPoints = userProgress.skillPoints;
    let nextLevelPoints = 80; // Points needed for intermediate
    
    if (userProgress.level === 'intermediate') {
      nextLevelPoints = 200; // Points needed for expert
    } else if (userProgress.level === 'expert') {
      return 100; // Already at max level
    }
    
    return Math.min(100, (currentSkillPoints / nextLevelPoints) * 100);
  };

  const getNextMilestone = () => {
    const unlockedFeatures = featureGates.filter(f => f.unlocked).length;
    const nextFeature = featureGates.find(f => !f.unlocked && f.requiredSkillPoints <= userProgress.skillPoints + 50);
    
    if (nextFeature) {
      const pointsNeeded = nextFeature.requiredSkillPoints - userProgress.skillPoints;
      return {
        feature: nextFeature.title,
        pointsNeeded,
        message: `あと${pointsNeeded}ポイントで「${nextFeature.title}」が解放されます`
      };
    }
    
    return null;
  };

  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-blue-100 text-blue-800',
    expert: 'bg-purple-100 text-purple-800'
  };

  const levelLabels = {
    beginner: '初心者',
    intermediate: '中級者',
    expert: '上級者'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Progress Card */}
      <Card variant="elevated" padding="normal">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                あなたの習熟度
              </h3>
              <p className="text-sm text-gray-600">
                使い続けることで新機能が解放されます
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${levelColors[userProgress.level]}`}>
              {levelLabels[userProgress.level]}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">次のレベルまで</span>
              <span className="font-medium text-gray-900">
                {userProgress.skillPoints}pt / {userProgress.level === 'beginner' ? '80pt' : userProgress.level === 'intermediate' ? '200pt' : 'MAX'}
              </span>
            </div>
            <Progress value={getProgressToNextLevel()} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{userProgress.tasksCompleted}</div>
              <div className="text-xs text-gray-600">完了タスク</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{userProgress.daysActive}</div>
              <div className="text-xs text-gray-600">利用日数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{featureGates.filter(f => f.unlocked).length}</div>
              <div className="text-xs text-gray-600">解放機能</div>
            </div>
          </div>

          {/* Next Milestone */}
          {getNextMilestone() && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 font-medium">
                🎯 {getNextMilestone()?.message}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Feature Gates */}
      <Card variant="elevated" padding="normal">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            利用可能な機能
          </h3>

          {/* Basic Features */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">基本機能</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featureGates.filter(f => f.category === 'basic').map(feature => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  onClick={() => handleFeatureClick(feature)}
                />
              ))}
            </div>
          </div>

          {/* Advanced Features */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">高度な機能</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featureGates.filter(f => f.category === 'advanced').map(feature => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  onClick={() => handleFeatureClick(feature)}
                />
              ))}
            </div>
          </div>

          {/* Expert Features */}
          {userProgress.level === 'expert' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">エキスパート機能</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featureGates.filter(f => f.category === 'expert').map(feature => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    onClick={() => handleFeatureClick(feature)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && selectedFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card variant="elevated" padding="normal" className="max-w-md mx-4">
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {selectedFeature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedFeature.title}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedFeature.description}
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>解放条件:</strong><br />
                  • レベル: {levelLabels[selectedFeature.requiredLevel]}<br />
                  • 必要ポイント: {selectedFeature.requiredSkillPoints}pt
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  現在のポイント: {userProgress.skillPoints}pt
                </p>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">ポイントを獲得するには:</p>
                <ul className="space-y-1 text-xs">
                  <li>• タスクを完了する (+5pt)</li>
                  <li>• 毎日ログインする (+10pt)</li>
                  <li>• プロジェクトを完了する (+15pt)</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowUpgradePrompt(false)}
                  variant="outline"
                  className="flex-1"
                >
                  閉じる
                </Button>
                <Link href="/tasks" className="flex-1">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    タスクを始める
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

interface FeatureCardProps {
  feature: FeatureGate;
  onClick: () => void;
}

function FeatureCard({ feature, onClick }: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        feature.unlocked
          ? 'border-green-200 bg-green-50 hover:bg-green-100'
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-75'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            feature.unlocked ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'
          }`}>
            {feature.unlocked ? <span className="text-sm">✓</span> : feature.icon}
          </div>
          <div>
            <h4 className={`text-sm font-medium ${
              feature.unlocked ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {feature.title}
            </h4>
            <p className="text-xs text-gray-500">{feature.description}</p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 ${
          feature.unlocked ? 'text-green-600' : 'text-gray-400'
        }`} />
      </div>
      
      {!feature.unlocked && (
        <div className="mt-2 text-xs text-gray-500">
          {feature.requiredSkillPoints}pt で解放
        </div>
      )}
    </div>
  );
}