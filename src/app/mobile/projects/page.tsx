"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import MobileLayout from '@/components/mobile/layout/MobileLayout';
import SwipeableCard from '@/components/mobile/ui/SwipeableCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Plus, 
  Search, 
  Users, 
  Target, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Folder
} from 'lucide-react';

export default function MobileProjects() {
  const router = useRouter();
  const { projects, loading: projectsLoading, addProject, updateProject } = useProjects();
  const { tasks } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  // プロジェクトに関連するタスク統計を計算
  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks?.filter(task => task.projectId === projectId) || [];
    return {
      total: projectTasks.length,
      completed: projectTasks.filter(task => task.status === 'COMPLETE').length,
      inProgress: projectTasks.filter(task => task.status === 'DO').length,
      pending: projectTasks.filter(task => task.status === 'IDEA').length
    };
  };

  // フィルタリングされたプロジェクト
  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || project.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  }) || [];

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    
    try {
      await addProject({
        name: newProjectTitle,
        description: '',
        status: 'active',
        priority: 'B',
        progress: 0,
        startDate: new Date().toISOString(),
        teamMembers: []
      });
      setNewProjectTitle('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('プロジェクト作成エラー:', error);
    }
  };

  const handleProjectComplete = async (projectId: string) => {
    try {
      await updateProject(projectId, { 
        status: 'completed'
      });
    } catch (error) {
      console.error('プロジェクト完了エラー:', error);
    }
  };

  const handleProjectArchive = async (projectId: string) => {
    try {
      await updateProject(projectId, { 
        status: 'on_hold'
      });
    } catch (error) {
      console.error('プロジェクトアーカイブエラー:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'border-blue-200 bg-blue-50';
      case 'COMPLETED': return 'border-green-200 bg-green-50';
      case 'ON_HOLD': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'ON_HOLD': return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default: return <Folder className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (stats: { completed: number; total: number }) => {
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  if (projectsLoading) {
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => router.back()}
              variant="ghost" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold">プロジェクト</h1>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            新規
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-blue-900">
              {filteredProjects.filter(p => p.status === 'active').length}
            </p>
            <p className="text-xs text-blue-700">進行中</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-green-900">
              {filteredProjects.filter(p => p.status === 'completed').length}
            </p>
            <p className="text-xs text-green-700">完了</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {filteredProjects.filter(p => p.status === 'on_hold').length}
            </p>
            <p className="text-xs text-gray-700">保留</p>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="プロジェクトを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: '全て' },
              { value: 'active', label: '進行中' },
              { value: 'completed', label: '完了' },
              { value: 'on_hold', label: '保留' }
            ].map(({ value, label }) => (
              <Button
                key={value}
                onClick={() => setFilter(value as any)}
                variant={filter === value ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3">新しいプロジェクト</h3>
            <div className="space-y-3">
              <Input
                placeholder="プロジェクト名を入力..."
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCreateProject}
                  disabled={!newProjectTitle.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  作成
                </Button>
                <Button 
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProjectTitle('');
                  }}
                  variant="outline"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Project List */}
        <div className="space-y-3">
          {filteredProjects.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <Folder className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? '条件に合うプロジェクトがありません' 
                  : 'プロジェクトがありません。新しいプロジェクトを作成しましょう！'
                }
              </p>
            </Card>
          ) : (
            filteredProjects.map(project => {
              const stats = getProjectStats(project.id);
              const progress = calculateProgress(stats);
              
              return (
                <SwipeableCard
                  key={project.id}
                  onSwipeRight={() => handleProjectComplete(project.id)}
                  onSwipeLeft={() => handleProjectArchive(project.id)}
                  onSwipeUp={() => router.push(`/mobile/projects/${project.id}`)}
                  className={`p-4 ${getStatusColor(project.status)}`}
                >
                  <div className="space-y-3">
                    {/* Project Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusIcon(project.status)}
                          <h3 className={`font-medium ${
                            project.status === 'completed' ? 'line-through text-gray-500' : ''
                          }`}>
                            {project.name}
                          </h3>
                        </div>
                        
                        {project.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {stats.total > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>進捗: {progress}%</span>
                          <span>{stats.completed}/{stats.total} タスク完了</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Task Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Target className="w-3 h-3" />
                          <span>{stats.total} タスク</span>
                        </div>
                        
                        {project.teamMembers && project.teamMembers.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{project.teamMembers.length} メンバー</span>
                          </div>
                        )}
                      </div>
                      
                      {project.endDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(project.endDate).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </SwipeableCard>
              );
            })
          )}
        </div>

        {/* Gesture Help */}
        <Card className="p-4 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">ジェスチャー操作</h3>
          <div className="text-xs text-green-700 space-y-1">
            <p>• 右スワイプ → プロジェクト完了</p>
            <p>• 左スワイプ → プロジェクト保留</p>
            <p>• 上スワイプ → 詳細表示</p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}