"use client";

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task, Project, TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/types';
import { CheckCircle, FileText, Rocket, Pause, Folder } from 'lucide-react';

interface ProjectKanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  onTaskMove: (taskId: string, newProjectId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

function TaskCard({ task, onEdit, onDelete, onQuickAction }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'A': return 'border-l-red-400';
      case 'B': return 'border-l-yellow-400';
      case 'C': return 'border-l-orange-400';
      case 'D': return 'border-l-green-400';
      default: return 'border-l-gray-400';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'IDEA': return 'bg-gray-100 text-gray-800';
      case 'PLAN': return 'bg-blue-100 text-blue-800';
      case 'DO': return 'bg-yellow-100 text-yellow-800';
      case 'CHECK': return 'bg-orange-100 text-orange-800';
      case 'COMPLETE': return 'bg-green-100 text-green-800';
      case 'KNOWLEDGE': return 'bg-purple-100 text-purple-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 h-24 opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(task.priority)} p-4 cursor-grab hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
          {task.title}
        </h4>
        <div className="flex gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="text-xs text-gray-400 hover:text-blue-600"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
        <span className="truncate">{task.user?.name || task.userId}</span>
        {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>}
      </div>
      
      <div className="flex justify-between items-center">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {TASK_STATUS_LABELS[task.status]}
        </div>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          task.priority === 'A' ? 'bg-red-100 text-red-800' :
          task.priority === 'B' ? 'bg-yellow-100 text-yellow-800' :
          task.priority === 'C' ? 'bg-orange-100 text-orange-800' :
          'bg-green-100 text-green-800'
        }`}>
          {PRIORITY_LABELS[task.priority]}
        </div>
      </div>
      
      {/* クイックアクションボタン */}
      {onQuickAction && (
        <div className="flex gap-1 mt-2">
          {task.status !== 'COMPLETE' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(task.id, 'complete');
              }}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
              title="完了にする"
            >
              ✓
            </button>
          )}
          
          {task.dueDate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onQuickAction(task.id, 'extendDeadline', tomorrow.toISOString().split('T')[0]);
              }}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded"
              title="期限を1日延長"
            >
              +1
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextPriority = task.priority === 'A' ? 'B' : task.priority === 'B' ? 'C' : task.priority === 'C' ? 'D' : 'A';
              onQuickAction(task.id, 'changePriority', nextPriority);
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
            title="優先度を変更"
          >
            ↕
          </button>
        </div>
      )}
    </div>
  );
}

interface ProjectColumnProps {
  project: Project | null;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onQuickAction?: (taskId: string, action: string, value?: any) => void;
}

function ProjectColumn({ project, tasks, onEdit, onDelete, onQuickAction }: ProjectColumnProps) {
  const taskIds = tasks.map(task => task.id);
  const projectId = project?.id || 'unassigned';
  
  const { setNodeRef, isOver } = useDroppable({
    id: `project-${projectId}`,
    data: {
      type: 'project',
      projectId,
    },
  });

  const getProjectColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100';
    switch (status) {
      case 'planning': return 'bg-gray-100';
      case 'active': return 'bg-blue-100';
      case 'on_hold': return 'bg-yellow-100';
      case 'completed': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'planning': return <FileText className="w-4 h-4" />;
      case 'active': return <Rocket className="w-4 h-4" />;
      case 'on_hold': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Folder className="w-4 h-4" />;
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`${getProjectColor(project?.status)} rounded-lg p-4 min-h-96 transition-colors ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="text-lg mr-2">
            {getStatusIcon(project?.status)}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {project ? project.name : 'プロジェクト未設定'}
            </h3>
            {project && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-20">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{project.progress}%</span>
              </div>
            )}
          </div>
        </div>
        <span className="bg-white rounded-full px-2 py-1 text-xs font-medium text-gray-600">
          {tasks.length}
        </span>
      </div>
      
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onQuickAction={onQuickAction}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ProjectKanbanBoard({ tasks, projects, onTaskMove, onTaskEdit, onTaskDelete, onQuickAction }: ProjectKanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const activeTask = active.data.current?.task as Task;
    
    if (!activeTask) {
      setActiveTask(null);
      return;
    }
    
    let newProjectId: string | null = null;
    
    if (over.data.current?.type === 'project') {
      const projectId = over.data.current.projectId as string;
      newProjectId = projectId === 'unassigned' ? '' : projectId;
    }
    
    if (newProjectId !== null && activeTask.projectId !== newProjectId) {
      onTaskMove(activeTask.id, newProjectId);
    }
    
    setActiveTask(null);
  };

  const getTasksByProject = (projectId: string | undefined) => {
    if (!projectId) {
      // プロジェクト未設定タスク
      return tasks.filter(task => !task.projectId || task.projectId === '');
    }
    return tasks.filter(task => task.projectId === projectId);
  };

  // アクティブプロジェクト + 未設定列
  const allColumns = [
    ...projects.filter(project => project.status !== 'completed'),
    null // プロジェクト未設定用
  ];

  return (
    <div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allColumns.map((project) => (
            <ProjectColumn
              key={project?.id || 'unassigned'}
              project={project}
              tasks={getTasksByProject(project?.id)}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onQuickAction={onQuickAction}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}