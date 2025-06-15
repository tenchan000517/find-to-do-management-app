"use client";

import { useState, useMemo } from 'react';
import { Task, Project, User } from '@/lib/types';

interface GanttChartProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
}

interface GanttItem {
  id: string;
  title: string;
  type: 'project' | 'task';
  startDate: Date;
  endDate: Date;
  assignee?: string;
  progress: number | string;
  priority: 'A' | 'B' | 'C' | 'D';
  projectId?: string;
}

export default function GanttChart({ tasks, projects, users }: GanttChartProps) {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // 現在の日付から表示範囲を計算
  const today = new Date();
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(today);
    const end = new Date(today);
    
    switch (timeRange) {
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'quarter':
        start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
        end.setMonth(start.getMonth() + 3);
        end.setDate(0);
        break;
      case 'year':
        start.setMonth(0, 1);
        end.setFullYear(end.getFullYear() + 1, 0, 0);
        break;
    }
    
    return { startDate: start, endDate: end };
  }, [timeRange, today]);

  // プロジェクトとタスクをガントアイテムに変換
  const ganttItems = useMemo(() => {
    const items: GanttItem[] = [];
    
    // プロジェクトを追加
    projects.forEach(project => {
      if (selectedUser === 'all' || project.teamMembers?.includes(selectedUser)) {
        items.push({
          id: `project-${project.id}`,
          title: project.name,
          type: 'project',
          startDate: new Date(project.startDate),
          endDate: project.endDate ? new Date(project.endDate) : new Date(project.startDate),
          progress: project.progress,
          priority: project.priority,
          projectId: project.id,
        });
      }
    });
    
    // タスクを追加
    tasks.forEach(task => {
      if (selectedUser === 'all' || task.userId === selectedUser) {
        const taskStartDate = new Date(task.createdAt);
        const taskEndDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
        
        items.push({
          id: `task-${task.id}`,
          title: task.title,
          type: 'task',
          startDate: taskStartDate,
          endDate: taskEndDate,
          assignee: task.user?.name || task.userId,
          progress: task.status,
          priority: task.priority,
          projectId: task.projectId,
        });
      }
    });
    
    return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [tasks, projects, selectedUser]);

  // 日付の範囲を生成
  const dateRange = useMemo(() => {
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [startDate, endDate]);

  // 位置とサイズを計算
  const calculatePosition = (item: GanttItem) => {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const itemStart = Math.max(0, Math.ceil((item.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const itemEnd = Math.min(totalDays, Math.ceil((item.endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const itemDuration = Math.max(1, itemEnd - itemStart);
    
    return {
      left: `${(itemStart / totalDays) * 100}%`,
      width: `${(itemDuration / totalDays) * 100}%`,
    };
  };

  const getPriorityColor = (priority: 'A' | 'B' | 'C' | 'D') => {
    switch (priority) {
      case 'A': return 'bg-red-500';
      case 'B': return 'bg-yellow-500';
      case 'C': return 'bg-orange-500';
      case 'D': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number | string) => {
    if (typeof progress === 'string') {
      // String status case
      switch (progress) {
        case 'COMPLETE': return 'bg-green-600';
        case 'CHECK': return 'bg-blue-600';
        case 'DO': return 'bg-yellow-600';
        case 'PLAN': return 'bg-orange-600';
        case 'IDEA': return 'bg-gray-400';
        case 'KNOWLEDGE': return 'bg-purple-600';
        case 'DELETE': return 'bg-red-400';
        default: return 'bg-gray-400';
      }
    } else {
      // Number progress case (for projects)
      if (progress >= 100) return 'bg-green-600';
      if (progress >= 75) return 'bg-blue-600';
      if (progress >= 50) return 'bg-yellow-600';
      if (progress >= 25) return 'bg-orange-600';
      return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">ガントチャート</h2>
        <div className="flex gap-4">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全メンバー</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'month' | 'quarter' | 'year')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">1ヶ月</option>
            <option value="quarter">3ヶ月</option>
            <option value="year">1年</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* ヘッダー（日付）*/}
          <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div className="w-64 px-4 py-3 border-r border-gray-200 font-semibold text-gray-900">
              タスク・プロジェクト
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {timeRange === 'month' && dateRange.filter((_, index) => index % 1 === 0).map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 px-2 py-3 border-r border-gray-200 text-xs text-center"
                    style={{ minWidth: '24px' }}
                  >
                    {date.getDate()}
                  </div>
                ))}
                {timeRange === 'quarter' && dateRange.filter((_, index) => index % 7 === 0).map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 px-2 py-3 border-r border-gray-200 text-xs text-center"
                    style={{ minWidth: '40px' }}
                  >
                    {date.getMonth() + 1}/{date.getDate()}
                  </div>
                ))}
                {timeRange === 'year' && dateRange.filter((_, index) => index % 30 === 0).map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 px-2 py-3 border-r border-gray-200 text-xs text-center"
                    style={{ minWidth: '60px' }}
                  >
                    {date.getMonth() + 1}月
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ガント項目 */}
          {ganttItems.map((item, index) => {
            const position = calculatePosition(item);
            return (
              <div key={item.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                <div className="w-64 px-4 py-3 border-r border-gray-200">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      item.type === 'project' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></span>
                    <div>
                      <div className="font-medium text-sm text-gray-900 truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.type === 'project' ? 'プロジェクト' : 'タスク'}
                        {item.assignee && ` - ${item.assignee}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative py-3 px-2">
                  <div
                    className={`relative h-6 rounded-md ${getProgressColor(item.progress)} opacity-80 cursor-pointer hover:opacity-100 transition-opacity`}
                    style={position}
                    title={`${item.title} - ${typeof item.progress === 'number' ? item.progress + '% 完了' : item.progress}`}
                  >
                    <div 
                      className="h-full bg-white bg-opacity-20 rounded-md"
                      style={{ width: `${typeof item.progress === 'number' ? item.progress : 100}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white truncate px-2">
                        {typeof item.progress === 'number' ? `${item.progress}%` : item.progress}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 今日の線 */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
              style={{
                left: `${64 + ((today.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * (window.innerWidth - 64)}px`
              }}
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
          </div>

          {ganttItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              表示できるアイテムがありません
            </div>
          )}
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
          プロジェクト
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          タスク
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
          今日
        </div>
      </div>
    </div>
  );
}