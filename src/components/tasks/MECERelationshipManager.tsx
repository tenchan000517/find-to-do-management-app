'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { 
  Target, 
  ArrowRight, 
  Users, 
  Clock, 
  Link, 
  Plus, 
  X, 
  Edit,
  Trash2 
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId?: string;
  projects?: {
    id: string;
    name: string;
  };
}

interface TaskRelationship {
  id: string;
  sourceTaskId: string;
  targetTaskId?: string;
  projectId?: string;
  relationshipType: 'TRANSFERABLE' | 'SIMULTANEOUS' | 'DEPENDENT';
  sourceTask: Task;
  targetTask?: Task;
  project?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface MECERelationshipManagerProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: any) => void;
}

const RELATIONSHIP_TYPES = {
  TRANSFERABLE: {
    label: '移譲可能',
    icon: Users,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'このタスクを他の人に任せることができます'
  },
  SIMULTANEOUS: {
    label: '同時実行',
    icon: Clock,
    color: 'bg-green-100 text-green-700 border-green-200',
    description: '他のタスクと同時に進行できます'
  },
  DEPENDENT: {
    label: '依存関係',
    icon: Link,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: '他のタスクの完了を待つ必要があります'
  }
} as const;

const DraggableTask: React.FC<{ task: Task }> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 bg-white rounded-lg border border-gray-200 cursor-grab
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        <Target className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {task.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`
              px-2 py-0.5 text-xs rounded-full
              ${task.status === 'COMPLETE' ? 'bg-green-100 text-green-700' :
                task.status === 'DO' ? 'bg-blue-100 text-blue-700' :
                task.status === 'PLAN' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'}
            `}>
              {task.status}
            </span>
            <span className={`
              px-2 py-0.5 text-xs rounded-full
              ${task.priority === 'A' ? 'bg-red-100 text-red-700' :
                task.priority === 'B' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'}
            `}>
              {task.priority}
            </span>
          </div>
          {task.projects && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {task.projects.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const RelationshipDropZone: React.FC<{
  relationshipType: keyof typeof RELATIONSHIP_TYPES;
  onDrop: (taskId: string, relationshipType: string) => void;
}> = ({ relationshipType, onDrop }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `relationship-${relationshipType}`,
    data: { relationshipType }
  });

  const typeConfig = RELATIONSHIP_TYPES[relationshipType];
  const IconComponent = typeConfig.icon;

  return (
    <div
      ref={setNodeRef}
      className={`
        p-4 rounded-lg border-2 border-dashed transition-all duration-200
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className="w-5 h-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">{typeConfig.label}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {typeConfig.description}
      </p>
      <div className="min-h-[100px] flex items-center justify-center">
        {isOver ? (
          <p className="text-blue-600 font-medium">ここにドロップ</p>
        ) : (
          <p className="text-gray-400">タスクをドラッグしてください</p>
        )}
      </div>
    </div>
  );
};

const RelationshipCard: React.FC<{
  relationship: TaskRelationship;
  onEdit: (relationship: TaskRelationship) => void;
  onDelete: (relationshipId: string) => void;
}> = ({ relationship, onEdit, onDelete }) => {
  const typeConfig = RELATIONSHIP_TYPES[relationship.relationshipType];
  const IconComponent = typeConfig.icon;

  return (
    <div className={`
      p-4 rounded-lg border ${typeConfig.color}
      transition-all duration-200 hover:shadow-md
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4" />
          <span className="font-medium text-sm">{typeConfig.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(relationship)}
            className="p-1 hover:bg-white rounded"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(relationship.id)}
            className="p-1 hover:bg-white rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-3 h-3 text-gray-500" />
          <span className="text-sm font-medium truncate">
            {relationship.sourceTask.title}
          </span>
        </div>

        {relationship.targetTask && (
          <>
            <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-gray-500" />
              <span className="text-sm truncate">
                {relationship.targetTask.title}
              </span>
            </div>
          </>
        )}

        {relationship.project && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              プロジェクト: {relationship.project.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MECERelationshipManager({ 
  tasks, 
  onTaskUpdate 
}: MECERelationshipManagerProps) {
  const [relationships, setRelationships] = useState<TaskRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // プロジェクト一覧を取得
  const projects = Array.from(
    new Map(
      tasks
        .filter(task => task.projects)
        .map(task => [task.projects!.id, task.projects!])
    ).values()
  );

  // フィルターされたタスク
  const filteredTasks = selectedProjectFilter
    ? tasks.filter(task => task.projectId === selectedProjectFilter)
    : tasks;

  // 関係性を取得
  const fetchRelationships = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedProjectFilter) {
        params.append('projectId', selectedProjectFilter);
      }
      
      const response = await fetch(`/api/task-relationships?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRelationships(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch relationships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [selectedProjectFilter]);

  // ドラッグ開始
  const handleDragStart = (event: any) => {
    setDraggedTask(event.active.data.current?.task || null);
  };

  // ドラッグ終了
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over || !active.data.current?.task) return;

    const task = active.data.current.task;
    const overData = over.data.current;

    // 関係性作成エリアにドロップされた場合
    if (overData?.relationshipType) {
      await createRelationship(task.id, overData.relationshipType);
    }
  };

  // 関係性作成
  const createRelationship = async (
    sourceTaskId: string, 
    relationshipType: string,
    targetTaskId?: string
  ) => {
    try {
      const response = await fetch('/api/task-relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceTaskId,
          targetTaskId,
          projectId: selectedProjectFilter || undefined,
          relationshipType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchRelationships();
      } else {
        alert(data.error || 'Failed to create relationship');
      }
    } catch (error) {
      console.error('Failed to create relationship:', error);
      alert('Failed to create relationship');
    }
  };

  // 関係性削除
  const deleteRelationship = async (relationshipId: string) => {
    if (!confirm('この関係性を削除しますか？')) return;

    try {
      const response = await fetch(`/api/task-relationships/${relationshipId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchRelationships();
      } else {
        alert(data.error || 'Failed to delete relationship');
      }
    } catch (error) {
      console.error('Failed to delete relationship:', error);
      alert('Failed to delete relationship');
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            MECE関係性管理
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            タスク間の関係性を可視化・管理します
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          手動作成
        </button>
      </div>

      {/* プロジェクトフィルター */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          プロジェクトフィルター:
        </label>
        <select
          value={selectedProjectFilter}
          onChange={(e) => setSelectedProjectFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全プロジェクト</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* タスク一覧 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">タスク一覧</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTasks.map(task => (
                <DraggableTask key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* 関係性作成エリア */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">関係性タイプ</h3>
            <div className="space-y-3">
              {Object.entries(RELATIONSHIP_TYPES).map(([type, config]) => (
                <RelationshipDropZone
                  key={type}
                  relationshipType={type as keyof typeof RELATIONSHIP_TYPES}
                  onDrop={createRelationship}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ドラッグオーバーレイ */}
        <DragOverlay>
          {draggedTask ? <DraggableTask task={draggedTask} /> : null}
        </DragOverlay>
      </DndContext>

      {/* 既存の関係性 */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">作成済み関係性</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">読み込み中...</p>
          </div>
        ) : relationships.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            関係性が作成されていません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relationships.map(relationship => (
              <RelationshipCard
                key={relationship.id}
                relationship={relationship}
                onEdit={() => {}}
                onDelete={deleteRelationship}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}