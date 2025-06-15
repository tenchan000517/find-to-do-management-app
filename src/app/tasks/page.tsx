"use client";

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { Task, TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';
import KanbanBoard from '@/components/KanbanBoard';
import UserKanbanBoard from '@/components/UserKanbanBoard';
import ProjectKanbanBoard from '@/components/ProjectKanbanBoard';
import DeadlineKanbanBoard from '@/components/DeadlineKanbanBoard';
import FullPageLoading from '@/components/FullPageLoading';

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
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks();
  const { users } = useUsers();
  const { projects } = useProjects();
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [kanbanView, setKanbanView] = useState<'status' | 'user' | 'project' | 'deadline'>('status');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.priority === filter);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const taskData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      projectId: formData.get('projectId') as string || undefined,
      userId: formData.get('userId') as string,
      status: formData.get('status') as Task['status'],
      priority: formData.get('priority') as Task['priority'],
      dueDate: formData.get('dueDate') as string || undefined,
      isArchived: false,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }

    setShowModal(false);
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
              </nav>
            </div>

            {/* カンバンビューの表示 */}
            {kanbanView === 'status' && (
              <KanbanBoard
                tasks={filteredTasks}
                onTaskMove={handleTaskMove}
                onTaskEdit={(task) => {
                  setEditingTask(task);
                  setShowModal(true);
                }}
                onTaskDelete={deleteTask}
                onQuickAction={handleQuickAction}
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
                          <div>担当者: <span className="font-medium text-gray-900">{task.user?.name || task.userId}</span></div>
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
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingTask ? 'タスク編集' : '新規タスク'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タスク名
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingTask?.title || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingTask?.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    プロジェクト
                  </label>
                  <select
                    name="projectId"
                    defaultValue={editingTask?.projectId || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">なし</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    担当者
                  </label>
                  <select
                    name="userId"
                    defaultValue={editingTask?.userId || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">担当者を選択してください</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    name="status"
                    defaultValue={editingTask?.status || 'IDEA'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IDEA">{TASK_STATUS_LABELS.IDEA}</option>
                    <option value="PLAN">{TASK_STATUS_LABELS.PLAN}</option>
                    <option value="DO">{TASK_STATUS_LABELS.DO}</option>
                    <option value="CHECK">{TASK_STATUS_LABELS.CHECK}</option>
                    <option value="COMPLETE">{TASK_STATUS_LABELS.COMPLETE}</option>
                    <option value="KNOWLEDGE">{TASK_STATUS_LABELS.KNOWLEDGE}</option>
                    <option value="DELETE">{TASK_STATUS_LABELS.DELETE}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    優先度
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingTask?.priority || 'C'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="A">{PRIORITY_LABELS.A}</option>
                    <option value="B">{PRIORITY_LABELS.B}</option>
                    <option value="C">{PRIORITY_LABELS.C}</option>
                    <option value="D">{PRIORITY_LABELS.D}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    期限
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={editingTask?.dueDate || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                  >
                    {editingTask ? '更新' : '作成'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTask(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}