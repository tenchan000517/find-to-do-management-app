"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import MobileLayout from '@/components/mobile/layout/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Target, Calendar, ArrowLeft } from 'lucide-react';
import QuickProjectCreator from '@/components/QuickProjectCreator';

export default function MobileDashboard() {
  const router = useRouter();
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();

  // モバイル専用の統計計算
  const stats = {
    todayTasks: tasks?.filter(task => {
      const today = new Date().toDateString();
      return new Date(task.createdAt).toDateString() === today;
    }).length || 0,
    completedToday: tasks?.filter(task => 
      task.status === 'COMPLETE' && 
      new Date(task.updatedAt).toDateString() === new Date().toDateString()
    ).length || 0,
    activeProjects: projects?.filter(project => project.status === 'active').length || 0,
    urgentTasks: tasks?.filter(task => 
      task.priority === 'A' && task.status !== 'COMPLETE'
    ).length || 0
  };

  const handleSwitchToDesktop = () => {
    router.push('/dashboard');
  };

  if (tasksLoading || projectsLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-4">
        {/* Header with mode switch */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold whitespace-nowrap">モバイルダッシュボード</h1>
          <Button 
            onClick={handleSwitchToDesktop}
            className="text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="whitespace-nowrap">デスクトップ版へ</span>
          </Button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.completedToday}</p>
                <p className="text-sm text-blue-700 whitespace-nowrap">今日完了</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.todayTasks}</p>
                <p className="text-sm text-green-700 whitespace-nowrap">今日のタスク</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{stats.activeProjects}</p>
                <p className="text-sm text-purple-700 whitespace-nowrap">進行中プロジェクト</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-900">{stats.urgentTasks}</p>
                <p className="text-sm text-red-700 whitespace-nowrap">緊急タスク</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Tasks Preview */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3 whitespace-nowrap">最近のタスク</h2>
          <div className="space-y-2">
            {tasks?.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm truncate">{task.title}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === 'COMPLETE' ? 'bg-green-100 text-green-800' :
                  task.status === 'DO' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Project Creation */}
        <QuickProjectCreator 
          variant="mobile"
          onProjectCreated={(project) => {
            console.log('モバイルで新プロジェクト作成:', project);
            // 成功時にプロジェクト一覧に移動
            setTimeout(() => {
              router.push('/mobile/projects');
            }, 2000);
          }}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => router.push('/mobile/tasks')}
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <span className="whitespace-nowrap">タスク管理</span>
          </Button>
          <Button 
            onClick={() => router.push('/mobile/projects')}
            className="h-12 bg-green-600 hover:bg-green-700 text-white"
          >
            <span className="whitespace-nowrap">プロジェクト</span>
          </Button>
        </div>

        {/* Gesture Instructions */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2 whitespace-nowrap">ジェスチャー操作</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>• 右スワイプ: タスク完了</p>
            <p>• 左スワイプ: タスク延期</p>
            <p>• 長押し: 詳細メニュー</p>
            <p>※ Phase A完成後に利用可能</p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}