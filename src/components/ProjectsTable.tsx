'use client';

import { Project } from '@/lib/types';

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const statusColors = {
  planning: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
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

const priorityText = {
  A: '緊急・重要',
  B: '緊急・重要でない',
  C: '緊急でない・重要',
  D: '緊急でない・重要でない',
};

export default function ProjectsTable({ projects, onEdit, onDelete }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">プロジェクトがありません</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                プロジェクト名
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                進捗
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                優先度
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                担当者
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                期間
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-4">
                  <div>
                    <div className="text-sm md:text-base font-medium text-gray-900">{project.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate max-w-xs" title={project.description}>
                      {project.description}
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                    {statusText[project.status]}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ width: '60px' }}>
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[project.priority]}`}>
                    {priorityText[project.priority]}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {project.teamMembers.length > 0 ? (
                      <div className="flex -space-x-2">
                        {project.teamMembers.slice(0, 3).map((memberId, index) => (
                          <div
                            key={memberId || index}
                            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                            title={memberId}
                          >
                            {memberId.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                            +{project.teamMembers.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">未割り当て</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>開始: {new Date(project.startDate).toLocaleDateString('ja-JP')}</div>
                    {project.endDate && (
                      <div>終了: {new Date(project.endDate).toLocaleDateString('ja-JP')}</div>
                    )}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(project)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => onDelete(project.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}