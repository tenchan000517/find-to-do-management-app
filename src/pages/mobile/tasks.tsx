"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import MobileLayout from '@/components/mobile/layout/MobileLayout';
import SwipeableCard from '@/components/mobile/ui/SwipeableCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  ArrowLeft
} from 'lucide-react';

export default function MobileTasks() {
  const router = useRouter();
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // フィルタリングされたタスク
  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || task.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  }) || [];

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      await createTask({
        title: newTaskTitle,
        description: '',
        priority: 'MEDIUM',
        status: 'PENDING'
      });
      setNewTaskTitle('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('タスク作成エラー:', error);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await updateTask(taskId, { 
        status: 'COMPLETED',
        completedAt: new Date()
      });
    } catch (error) {
      console.error('タスク完了エラー:', error);
    }
  };

  const handleTaskPostpone = async (taskId: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await updateTask(taskId, { 
        dueDate: tomorrow,
        status: 'PENDING'
      });
    } catch (error) {
      console.error('タスク延期エラー:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('タスク削除エラー:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'border-red-200 bg-red-50';
      case 'MEDIUM': return 'border-yellow-200 bg-yellow-50';
      case 'LOW': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'PENDING': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
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
            <h1 className="text-xl font-bold">タスク管理</h1>
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
              {filteredTasks.filter(t => t.status === 'PENDING').length}
            </p>
            <p className="text-xs text-blue-700">未着手</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-orange-900">
              {filteredTasks.filter(t => t.status === 'IN_PROGRESS').length}
            </p>
            <p className="text-xs text-orange-700">進行中</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-green-900">
              {filteredTasks.filter(t => t.status === 'COMPLETED').length}
            </p>
            <p className="text-xs text-green-700">完了</p>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="タスクを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: '全て' },
              { value: 'pending', label: '未着手' },
              { value: 'in_progress', label: '進行中' },
              { value: 'completed', label: '完了' }
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

        {/* Create Task Form */}
        {showCreateForm && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3">新しいタスク</h3>
            <div className="space-y-3">
              <Input
                placeholder="タスクのタイトルを入力..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  作成
                </Button>
                <Button 
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTaskTitle('');
                  }}
                  variant="outline"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <CheckCircle className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? '条件に合うタスクがありません' 
                  : 'タスクがありません。新しいタスクを作成しましょう！'
                }
              </p>
            </Card>
          ) : (
            filteredTasks.map(task => (
              <SwipeableCard
                key={task.id}
                onSwipeRight={() => handleTaskComplete(task.id)}
                onSwipeLeft={() => handleTaskPostpone(task.id)}
                onSwipeUp={() => router.push(`/mobile/tasks/${task.id}`)}
                onSwipeDown={() => handleTaskDelete(task.id)}
                className={`p-4 ${getPriorityColor(task.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className={`font-medium ${
                        task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''
                      }`}>
                        {task.title}
                      </h3>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded ${
                        task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      
                      {task.dueDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SwipeableCard>
            ))
          )}
        </div>

        {/* Gesture Help */}
        <Card className="p-4 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">ジェスチャー操作</h3>
          <div className="text-xs text-green-700 space-y-1">
            <p>• 右スワイプ → タスク完了</p>
            <p>• 左スワイプ → 明日に延期</p>
            <p>• 上スワイプ → 詳細表示</p>
            <p>• 下スワイプ → 削除</p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}