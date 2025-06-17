"use client";

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { Task, TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';
import EnhancedTaskKanban from '@/components/tasks/EnhancedTaskKanban';
import UserKanbanBoard from '@/components/UserKanbanBoard';
import ProjectKanbanBoard from '@/components/ProjectKanbanBoard';
import DeadlineKanbanBoard from '@/components/DeadlineKanbanBoard';
import dynamic from 'next/dynamic';

const MECERelationshipManager = dynamic(
  () => import('@/components/tasks/MECERelationshipManager'),
  { ssr: false }
);
import FullPageLoading from '@/components/FullPageLoading';
import TaskModal from '@/components/TaskModal';

const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'IDEA': return 'bg-gray-200';
    case 'PLAN': return 'bg-blue-200';
    case 'DO': return 'bg-yellow-200';
    case 'CHECK': return 'bg-orange-200';
    case 'COMPLETE': return 'bg-green-200';
    case 'KNOWLEDGE': return 'bg-purple-200';
    case 'DELETE': return 'bg-red-200';
    default: return 'bg-gray-200';
  }
};

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'A': return 'bg-red-100 text-red-800';
    case 'B': return 'bg-yellow-100 text-yellow-800';
    case 'C': return 'bg-orange-100 text-orange-800';
    case 'D': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function TasksPage() {
  const { tasks, loading, addTask, updateTask, deleteTask, refreshTasks } = useTasks();
  const { users } = useUsers();
  const { projects } = useProjects();
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [kanbanView, setKanbanView] = useState<'status' | 'user' | 'project' | 'deadline' | 'relationships'>('status');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.priority === filter);

  const handleSubmit = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await addTask(taskData);
    }
    setEditingTask(null);
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    updateTask(taskId, { status: newStatus });
  };

  const handleTaskMove = (taskId: string, newStatus: Task['status']) => {
    updateTask(taskId, { status: newStatus });
  };

  const handleUserTaskMove = (taskId: string, newUserId: string) => {
    updateTask(taskId, { userId: newUserId });
  };

  const handleProjectTaskMove = (taskId: string, newProjectId: string) => {
    updateTask(taskId, { projectId: newProjectId || undefined });
  };

  const handleDeadlineTaskMove = (taskId: string, newDueDate: string) => {
    updateTask(taskId, { dueDate: newDueDate || undefined });
  };

  const handleQuickAction = (taskId: string, action: string, value?: any) => {
    switch (action) {
      case 'complete':
        updateTask(taskId, { status: 'COMPLETE' });
        break;
      case 'extendDeadline':
        updateTask(taskId, { dueDate: value });
        break;
      case 'changePriority':
        updateTask(taskId, { priority: value });
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <FullPageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">タスク管理</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  viewMode === 'kanban' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                カンバン
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                リスト
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilter('A')}
                className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'A' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">最優先</span>(A)
              </button>
              <button
                onClick={() => setFilter('B')}
                className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'B' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">重要</span>(B)
              </button>
              <button
                onClick={() => setFilter('C')}
                className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'C' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">緊急</span>(C)
              </button>
              <button
                onClick={() => setFilter('D')}
                className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'D' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">要検討</span>(D)
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap"
            >
              新規タスク
            </button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <div>
            {/* カンバンビューのタブ */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setKanbanView('status')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                    kanbanView === 'status'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ステータス別
                </button>
                <button
                  onClick={() => setKanbanView('user')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                    kanbanView === 'user'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ユーザー別
                </button>
                <button
                  onClick={() => setKanbanView('project')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                    kanbanView === 'project'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  プロジェクト別
                </button>
                <button
                  onClick={() => setKanbanView('deadline')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                    kanbanView === 'deadline'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  期限別
                </button>
                <button
                  onClick={() => setKanbanView('relationships')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                    kanbanView === 'relationships'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  MECE関係性
                </button>
              </nav>
            </div>

            {/* カンバンビューの表示 */}
            {kanbanView === 'status' && (
              <EnhancedTaskKanban
                tasks={filteredTasks}
                onTaskMove={handleTaskMove}
                onTaskEdit={(task) => {
                  setEditingTask(task);
                  setShowModal(true);
                }}
                onTaskDelete={deleteTask}
                onTaskUpdate={updateTask}
              />
            )}
            
            {kanbanView === 'user' && (
              <UserKanbanBoard
                tasks={filteredTasks}
                users={users}
                onTaskMove={handleUserTaskMove}
                onTaskEdit={(task) => {
                  setEditingTask(task);
                  setShowModal(true);
                }}
                onTaskDelete={deleteTask}
                onQuickAction={handleQuickAction}
              />
            )}
            
            {kanbanView === 'project' && (
              <ProjectKanbanBoard
                tasks={filteredTasks}
                projects={projects}
                onTaskMove={handleProjectTaskMove}
                onTaskEdit={(task) => {
                  setEditingTask(task);
                  setShowModal(true);
                }}
                onTaskDelete={deleteTask}
                onQuickAction={handleQuickAction}
              />
            )}
            
            {kanbanView === 'deadline' && (
              <DeadlineKanbanBoard
                tasks={filteredTasks}
                onTaskMove={handleDeadlineTaskMove}
                onTaskEdit={(task) => {
                  setEditingTask(task);
                  setShowModal(true);
                }}
                onTaskDelete={deleteTask}
                onQuickAction={handleQuickAction}
              />
            )}
            
            {kanbanView === 'relationships' && (
              <MECERelationshipManager
                tasks={filteredTasks}
                onTaskUpdate={updateTask}
              />
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
                return (
                  <div key={task.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow">
                    <div className="flex flex-col lg:flex-row items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base md:text-lg font-semibold text-gray-900">{task.title}</h3>
                          <div className="flex gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                            {project && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {project.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm md:text-base text-gray-600 mb-4">{task.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span>担当者:</span>
                            {(() => {
                              const assignee = task.assignee || task.user;
                              if (assignee) {
                                return (
                                  <div className="flex items-center gap-1">
                                    <div 
                                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                      style={{ backgroundColor: assignee.color }}
                                    >
                                      {assignee.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-900">{assignee.name}</span>
                                  </div>
                                );
                              } else {
                                return <span className="font-medium text-gray-500">未設定</span>;
                              }
                            })()}
                          </div>
                          {task.dueDate && <div>期限: <span className="font-medium text-gray-900">{task.dueDate}</span></div>}
                        </div>
                      </div>
                      <div className="flex flex-col lg:items-end gap-4 lg:flex-shrink-0">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} self-start lg:self-end`}>
                          {TASK_STATUS_LABELS[task.status]}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(['IDEA', 'PLAN', 'DO', 'CHECK', 'COMPLETE', 'KNOWLEDGE', 'DELETE'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(task.id, status)}
                              className={`px-2 py-1 text-xs rounded ${
                                task.status === status 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {TASK_STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setShowModal(true);
                            }}
                            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">該当するタスクがありません</div>
              </div>
            )}
          </>
        )}

        {/* モーダル */}
        <TaskModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          editingTask={editingTask}
          users={users}
          projects={projects}
          onSubmit={handleSubmit}
          onDataRefresh={refreshTasks}
        />
      </div>
    </div>
  );
}