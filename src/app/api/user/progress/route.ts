import { NextRequest, NextResponse } from 'next/server';

interface UserProgress {
  level: 'beginner' | 'intermediate' | 'expert';
  tasksCompleted: number;
  daysActive: number;
  featuresUnlocked: string[];
  skillPoints: number;
  achievements: string[];
}

export async function GET(request: NextRequest) {
  try {
    // In a real app, this would fetch from database based on user ID
    // For now, we'll calculate based on mock data or return default values
    
    const mockProgress: UserProgress = {
      level: 'beginner',
      tasksCompleted: 5,
      daysActive: 3,
      featuresUnlocked: ['tasks', 'calendar'],
      skillPoints: 35, // 5 tasks * 5pts + 3 days * 10pts = 55pts
      achievements: ['first_task', 'first_week']
    };

    // Calculate level based on skill points
    if (mockProgress.skillPoints >= 200) {
      mockProgress.level = 'expert';
    } else if (mockProgress.skillPoints >= 80) {
      mockProgress.level = 'intermediate';
    }

    // Update unlocked features based on level
    if (mockProgress.level === 'intermediate') {
      mockProgress.featuresUnlocked.push('projects', 'voice-input', 'auto-schedule');
    } else if (mockProgress.level === 'expert') {
      mockProgress.featuresUnlocked.push(
        'projects', 'voice-input', 'auto-schedule',
        'mbti-analysis', 'ltv-analysis', 'sales-automation'
      );
    }

    return NextResponse.json(mockProgress);

  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({
      error: 'ユーザー進捗の取得に失敗しました'
    }, { status: 500 });
  }
}