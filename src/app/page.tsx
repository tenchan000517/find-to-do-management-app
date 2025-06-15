"use client";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { useProjects } from "@/hooks/useProjects";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useConnections } from "@/hooks/useConnections";
import { useAppointments } from "@/hooks/useAppointments";

const menuItems = [
  {
    title: "プロジェクト",
    description: "進行中のプロジェクトを管理",
    href: "/projects",
    icon: "🚀",
    color: "from-blue-500 to-purple-600"
  },
  {
    title: "タスク",
    description: "チームのタスクと進捗を追跡",
    href: "/tasks",
    icon: "✅",
    color: "from-green-500 to-teal-600"
  },
  {
    title: "カレンダー",
    description: "スケジュールとイベント管理",
    href: "/calendar",
    icon: "📅",
    color: "from-purple-500 to-pink-600"
  },
  {
    title: "つながり",
    description: "人脈とネットワーク管理",
    href: "/connections",
    icon: "👥",
    color: "from-orange-500 to-red-600"
  },
  {
    title: "ナレッジ",
    description: "知識と情報の共有",
    href: "/knowledge",
    icon: "📚",
    color: "from-indigo-500 to-blue-600"
  },
  {
    title: "アポ",
    description: "テレアポと営業管理",
    href: "/appointments",
    icon: "📞",
    color: "from-pink-500 to-rose-600"
  },
  {
    title: "議事録",
    description: "会議録と文書管理",
    href: "/meeting-notes",
    icon: "📝",
    color: "from-gray-500 to-gray-600"
  }
];

export default function Home() {
  const { addTask } = useTasks();
  const { users } = useUsers();
  const { addProject } = useProjects();
  const { addEvent } = useCalendarEvents();
  const { addConnection } = useConnections();
  const { addAppointment } = useAppointments();

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const handleTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const taskData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      userId: formData.get('userId') as string,
      status: 'IDEA' as const,
      priority: formData.get('priority') as 'A' | 'B' | 'C' | 'D',
      dueDate: formData.get('dueDate') as string,
      isArchived: false,
    };
    addTask(taskData);
    setShowTaskModal(false);
  };

  const handleProjectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const projectData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: 'planning' as const,
      progress: 0,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
      teamMembers: [],
      priority: formData.get('priority') as 'A' | 'B' | 'C' | 'D',
    };
    addProject(projectData);
    setShowProjectModal(false);
  };

  const handleEventSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const startDateTime = `${dateStr}T${timeStr}`;
    
    const eventData = {
      title: formData.get('title') as string,
      date: dateStr,
      time: timeStr,
      startTime: startDateTime,
      participants: [],
      type: formData.get('type') as 'meeting' | 'event' | 'deadline',
      description: formData.get('description') as string,
      location: formData.get('location') as string || '',
    };
    addEvent(eventData);
    setShowEventModal(false);
  };

  const handleConnectionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const connectionData = {
      date: new Date(formData.get('date') as string).toISOString(),
      location: formData.get('location') as string,
      company: formData.get('company') as string,
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      type: formData.get('type') as 'company' | 'student',
      description: formData.get('description') as string,
      conversation: formData.get('conversation') as string,
      potential: formData.get('potential') as string,
      businessCard: formData.get('businessCard') as string || undefined,
      createdById: 'user1',
    };
    addConnection(connectionData);
    setShowConnectionModal(false);
  };

  const handleAppointmentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const appointmentData = {
      contactName: formData.get('name') as string,
      companyName: formData.get('company') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      status: 'scheduled' as const,
      priority: formData.get('priority') as 'A' | 'B' | 'C' | 'D',
      lastContact: new Date().toISOString(),
      notes: formData.get('description') as string,
      nextAction: 'アポ取得済み',
      assignedToId: 'user1',
    };
    addAppointment(appointmentData);
    setShowAppointmentModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">

      {/* メインコンテンツ */}
      <main className="mx-auto px-4 lg:px-8 py-6">

        
        {/* クイックアクション - デスクトップ */}
        <div className="hidden md:block bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mb-2">🚀</span>
              <span className="text-sm font-medium text-gray-900">新規プロジェクト</span>
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex flex-col items-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl mb-2">✅</span>
              <span className="text-sm font-medium text-gray-900">タスク追加</span>
            </button>
            <button
              onClick={() => setShowConnectionModal(true)}
              className="flex flex-col items-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl mb-2">👥</span>
              <span className="text-sm font-medium text-gray-900">つながり追加</span>
            </button>
            <button
              onClick={() => setShowEventModal(true)}
              className="flex flex-col items-center p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
            >
              <span className="text-2xl mb-2">📅</span>
              <span className="text-sm font-medium text-gray-900">予定追加</span>
            </button>
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="flex flex-col items-center p-4 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors"
            >
              <span className="text-2xl mb-2">📞</span>
              <span className="text-sm font-medium text-gray-900">アポ追加</span>
            </button>
          </div>
        </div>
        

        {/* メニューグリッド - デスクトップのみ */}
        <div className="hidden md:block mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group block"
              >
                <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                  <div className={`h-20 bg-gradient-to-r ${item.color} flex items-center justify-center`}>
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ダッシュボード */}
        <Dashboard />
      </main>

      {/* モーダル群 */}
      {/* タスク作成モーダル */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">新規タスク</h2>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
                <input type="text" name="title" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                <select name="userId" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">担当者を選択してください</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                <select name="priority" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="A">最優先</option>
                  <option value="B">重要</option>
                  <option value="C">緊急</option>
                  <option value="D">要検討</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
                <input type="date" name="dueDate" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium">作成</button>
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* プロジェクト作成モーダル */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">新規プロジェクト</h2>
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プロジェクト名</label>
                <input type="text" name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                <select name="priority" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="A">最優先</option>
                  <option value="B">重要</option>
                  <option value="C">緊急</option>
                  <option value="D">要検討</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                <input type="date" name="startDate" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了予定日</label>
                <input type="date" name="endDate" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium">作成</button>
                <button type="button" onClick={() => setShowProjectModal(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 予定作成モーダル */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">新規予定</h2>
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                <input type="text" name="title" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
                <select name="type" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="meeting">打ち合わせ</option>
                  <option value="event">イベント</option>
                  <option value="deadline">期限</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                <input type="date" name="date" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">時間</label>
                <input type="time" name="time" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">場所</label>
                <input type="text" name="location" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium">作成</button>
                <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* つながり作成モーダル */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">新規つながり</h2>
            <form onSubmit={handleConnectionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                  <input type="date" name="date" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出会った場所</label>
                  <input type="text" name="location" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                  <input type="text" name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
                  <input type="text" name="position" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">会社名・組織名</label>
                  <input type="text" name="company" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                  <select name="type" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="company">企業</option>
                    <option value="student">学生</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">どんな人か</label>
                <textarea name="description" rows={2} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">どんな話をしたか</label>
                <textarea name="conversation" rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FIND to DOとどう関わっていけそうか</label>
                <textarea name="potential" rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名刺URL（任意）</label>
                <input type="text" name="businessCard" placeholder="名刺画像のURLなど" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium">作成</button>
                <button type="button" onClick={() => setShowConnectionModal(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* アポ作成モーダル */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">新規アポ</h2>
            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input type="text" name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
                <input type="text" name="company" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input type="email" name="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                <input type="tel" name="phone" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明・目的</label>
                <textarea name="description" rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                <select name="priority" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="A">最優先</option>
                  <option value="B">重要</option>
                  <option value="C">緊急</option>
                  <option value="D">要検討</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium">作成</button>
                <button type="button" onClick={() => setShowAppointmentModal(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium">キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* モバイル固定クイックアクション */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] shadow-lg pb-safe">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex flex-col items-center py-3 px-1 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base sm:text-lg mb-1">🚀</span>
            <span className="text-xs font-medium text-gray-900 leading-tight">プロジェクト</span>
          </button>
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex flex-col items-center py-3 px-1 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base sm:text-lg mb-1">✅</span>
            <span className="text-xs font-medium text-gray-900 leading-tight">タスク</span>
          </button>
          <button
            onClick={() => setShowConnectionModal(true)}
            className="flex flex-col items-center py-3 px-1 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base sm:text-lg mb-1">👥</span>
            <span className="text-xs font-medium text-gray-900 leading-tight">つながり</span>
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="flex flex-col items-center py-3 px-1 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base sm:text-lg mb-1">📅</span>
            <span className="text-xs font-medium text-gray-900 leading-tight">予定</span>
          </button>
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="flex flex-col items-center py-3 px-1 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base sm:text-lg mb-1">📞</span>
            <span className="text-xs font-medium text-gray-900 leading-tight">アポ</span>
          </button>
        </div>
      </div>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-16 mb-20 md:mb-0">
        <div className="mx-auto px-4 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 FIND to DO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}