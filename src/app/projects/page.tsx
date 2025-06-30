"use client";

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Project, User } from '@/lib/types';
import FullPageLoading from '@/components/FullPageLoading';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BarChart3, FileText } from 'lucide-react';
import Tabs from '@/components/Tabs';
import ProjectsTable from '@/components/ProjectsTable';
import GanttChart from '@/components/GanttChart';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import UserProfileModal from '@/components/UserProfileModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';

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
  const projectsHook = useProjects();
  const { projects, loading: projectsLoading, addProject, updateProject, deleteProject, refreshProjects } = projectsHook;
  const { tasks, loading: tasksLoading } = useTasks();
  const { users, loading: usersLoading } = useUsers();
  const { saveUserProfile } = useUserProfile();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<'all' | 'planning' | 'active' | 'on_hold' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState('table');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectDetailModal, setProjectDetailModal] = useState<{ isOpen: boolean; project: Project | null }>({
    isOpen: false,
    project: null
  });
  const [userProfileModal, setUserProfileModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null
  });

  const tabs = [
    { id: 'table', label: 'プロジェクト一覧', icon: <FileText className="w-4 h-4" /> },
    { id: 'gantt', label: 'ガントチャート', icon: <BarChart3 className="w-4 h-4" /> },
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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (projectsLoading || tasksLoading || usersLoading) {
    return <FullPageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">プロジェクト</h1>
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
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'primary' : 'secondary'}
                size="sm"
              >
                すべて
              </Button>
              <Button
                onClick={() => setFilter('active')}
                variant={filter === 'active' ? 'primary' : 'secondary'}
                size="sm"
              >
                進行中
              </Button>
              <Button
                onClick={() => setFilter('planning')}
                variant={filter === 'planning' ? 'primary' : 'secondary'}
                size="sm"
              >
                企画中
              </Button>
              <Button
                onClick={() => setFilter('completed')}
                variant={filter === 'completed' ? 'primary' : 'secondary'}
                size="sm"
              >
                完了
              </Button>
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
                onViewDetails={(project) => {
                  setProjectDetailModal({ isOpen: true, project });
                }}
              />
            ) : (
              <>
                {/* カード表示 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} variant="elevated" padding="normal">
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
                        <Button
                          onClick={() => {
                            setEditingProject(project);
                            setShowModal(true);
                          }}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          編集
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              await deleteProject(project.id);
                            } catch (error) {
                              console.error('Failed to delete project:', error);
                            }
                          }}
                          variant="danger"
                          size="sm"
                          className="flex-1"
                        >
                          削除
                        </Button>
                      </div>
                    </Card>
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
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
              {/* ローディングオーバーレイ */}
              {isSubmitting && (
                <LoadingSpinner 
                  overlay={true}
                  message="プロジェクトを保存しています..."
                  size="sm"
                />
              )}
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
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '保存中...' : editingProject ? '更新' : '作成'}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowModal(false);
                      setEditingProject(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project Detail Modal */}
        {projectDetailModal.project && (
          <ProjectDetailModal
            project={projectDetailModal.project}
            users={users}
            isOpen={projectDetailModal.isOpen}
            onClose={() => setProjectDetailModal({ isOpen: false, project: null })}
            onDataRefresh={refreshProjects}
          />
        )}

        {/* User Profile Modal */}
        {userProfileModal.user && (
          <UserProfileModal
            user={userProfileModal.user}
            isOpen={userProfileModal.isOpen}
            onClose={() => setUserProfileModal({ isOpen: false, user: null })}
            onSave={async (profile) => {
              if (userProfileModal.user) {
                await saveUserProfile(userProfileModal.user.id, profile);
              }
            }}
            onDataRefresh={refreshProjects}
          />
        )}
      </div>
    </div>
  );
}