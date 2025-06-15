"use client";

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { Project } from '@/lib/types';
import FullPageLoading from '@/components/FullPageLoading';
import Tabs from '@/components/Tabs';
import ProjectsTable from '@/components/ProjectsTable';
import GanttChart from '@/components/GanttChart';

const statusColors = {
  planning: 'from-gray-500 to-gray-600',
  active: 'from-blue-500 to-purple-600',
  on_hold: 'from-yellow-500 to-orange-600',
  completed: 'from-green-500 to-teal-600',
};

const statusText = {
  planning: '企画中',
  active: '進行中',
  on_hold: '保留中',
  completed: '完了',
};

const priorityColors = {
  A: 'bg-red-100 text-red-800',
  B: 'bg-yellow-100 text-yellow-800',
  C: 'bg-orange-100 text-orange-800',
  D: 'bg-green-100 text-green-800',
};

export default function ProjectsPage() {
  const { projects, loading: projectsLoading, addProject, updateProject, deleteProject } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const { users, loading: usersLoading } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<'all' | 'planning' | 'active' | 'on_hold' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState('table');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const tabs = [
    { id: 'table', label: 'プロジェクト一覧', icon: '📋' },
    { id: 'gantt', label: 'ガントチャート', icon: '📊' },
  ];

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(project => project.status === filter);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const projectData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as Project['status'],
      progress: parseInt(formData.get('progress') as string),
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
      teamMembers: [], // Initialize empty team members array
      priority: formData.get('priority') as Project['priority'],
    };

    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectData);
      } else {
        await addProject(projectData);
      }

      setShowModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  if (projectsLoading || tasksLoading || usersLoading) {
    return <FullPageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">プロジェクト</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {activeTab === 'table' && (
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base"
              >
                {viewMode === 'table' ? 'カード表示' : 'テーブル表示'}
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base"
            >
              新規プロジェクト
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-8"
        />

        {/* タブコンテンツ */}
        {activeTab === 'table' ? (
          <>
            {/* フィルター（テーブル表示時のみ） */}
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'active' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                進行中
              </button>
              <button
                onClick={() => setFilter('planning')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'planning' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                企画中
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                完了
              </button>
            </div>

            {/* テーブル/カード表示切り替え */}
            {viewMode === 'table' ? (
              <ProjectsTable
                projects={filteredProjects}
                onEdit={(project) => {
                  setEditingProject(project);
                  setShowModal(true);
                }}
                onDelete={async (projectId) => {
                  try {
                    await deleteProject(projectId);
                  } catch (error) {
                    console.error('Failed to delete project:', error);
                  }
                }}
              />
            ) : (
              <>
                {/* カード表示 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow">
                      <div className={`h-32 bg-gradient-to-r ${statusColors[project.status]} rounded-lg mb-4 flex items-center justify-center`}>
                        <span className="text-white font-bold text-lg truncate px-2">{project.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[project.priority]}`}>
                          {project.priority === 'A' ? '最優先' : project.priority === 'B' ? '重要' : project.priority === 'C' ? '緊急' : '要検討'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>ステータス: {statusText[project.status]}</span>
                          <span>進捗: {project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          チーム: {project.teamMembers.length > 0 ? `${project.teamMembers.length}人` : 'なし'}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setShowModal(true);
                          }}
                          className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                        >
                          編集
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteProject(project.id);
                            } catch (error) {
                              console.error('Failed to delete project:', error);
                            }
                          }}
                          className="flex-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">プロジェクトがありません</div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div>
            <GanttChart 
              tasks={tasks} 
              projects={projects} 
              users={users}
            />
          </div>
        )}

        {/* モーダル */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingProject ? 'プロジェクト編集' : '新規プロジェクト'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    プロジェクト名
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProject?.name || ''}
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
                    defaultValue={editingProject?.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    name="status"
                    defaultValue={editingProject?.status || 'planning'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="planning">企画中</option>
                    <option value="active">進行中</option>
                    <option value="on_hold">保留中</option>
                    <option value="completed">完了</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    進捗 (%)
                  </label>
                  <input
                    type="number"
                    name="progress"
                    min="0"
                    max="100"
                    defaultValue={editingProject?.progress || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    優先度
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingProject?.priority || 'C'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="A">最優先</option>
                    <option value="B">重要</option>
                    <option value="C">緊急</option>
                    <option value="D">要検討</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={editingProject ? new Date(editingProject.startDate).toISOString().split('T')[0] : ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了予定日
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={editingProject?.endDate ? new Date(editingProject.endDate).toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                  >
                    {editingProject ? '更新' : '作成'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProject(null);
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