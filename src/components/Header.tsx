'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Rocket, 
  CheckCircle, 
  Calendar, 
  Users, 
  Phone, 
  BookOpen, 
  FileText, 
  Bot, 
  BarChart3, 
  ClipboardList,
  ChevronDown,
  TrendingUp,
  FileBarChart,
  PieChart,
  Twitter
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import AuthButton from './auth/AuthButton';
import { Button } from './ui/Button';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  
  const navItems = [
    // { href: '/', label: 'ダッシュボード', icon: Home },
    { href: '/projects', label: 'プロジェクト', icon: Rocket },
    { href: '/tasks', label: 'タスク', icon: CheckCircle },
    { href: '/calendar', label: 'カレンダー', icon: Calendar },
    { href: '/connections', label: 'つながり', icon: Users },
    { href: '/appointments', label: 'アポイント', icon: Phone },
    { href: '/knowledge', label: 'ナレッジ', icon: BookOpen },
    { href: '/meeting-notes', label: '議事録', icon: FileText },
    { href: '/dashboard/google-docs', label: 'サマリー', icon: FileBarChart },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              <span className="text-lg md:text-xl font-bold text-gray-900">FIND to DO</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.slice(0, -1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Dashboard Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname?.startsWith('/dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>ダッシュボード</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {dashboardDropdownOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      href="/dashboard/sales-analytics"
                      onClick={() => setDashboardDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <TrendingUp className="mr-3 h-4 w-4" />
                      営業アナリティクス
                    </Link>
                    <Link
                      href="/dashboard/google-docs"
                      onClick={() => setDashboardDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Bot className="mr-3 h-4 w-4" />
                      IIDA_AIサマリー
                    </Link>
                    <Link
                      href="/analytics"
                      onClick={() => setDashboardDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PieChart className="mr-3 h-4 w-4" />
                      GA4アナリティクス
                    </Link>
                    <Link
                      href="/social-analytics"
                      onClick={() => setDashboardDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Twitter className="mr-3 h-4 w-4" />
                      SNSアナリティクス
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Discord Insights & User Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link 
              href="/dashboard/discord-insights"
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg text-sm"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Discord インサイト
            </Link>
            <Button 
              onClick={() => setNotificationCenterOpen(true)}
              variant="ghost"
              size="sm"
              className="p-2 text-gray-400 hover:text-gray-500 relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* 未読通知バッジ（実装後に動的に制御） */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            <AuthButton />
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200">
          <nav className="px-4 pt-2 pb-3 space-y-1">
            {navItems.slice(0, -1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Dashboard Section for Mobile */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ダッシュボード
              </div>
              <Link
                href="/dashboard/sales-analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <TrendingUp className="h-5 w-5" />
                <span>営業アナリティクス</span>
              </Link>
              <Link
                href="/dashboard/google-docs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Bot className="h-5 w-5" />
                <span>IIDA_AIサマリー</span>
              </Link>
              <Link
                href="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <PieChart className="h-5 w-5" />
                <span>GA4アナリティクス</span>
              </Link>
              <Link
                href="/social-analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Twitter className="h-5 w-5" />
                <span>SNSアナリティクス</span>
              </Link>
            </div>
            
            {/* Discord Insights for Mobile */}
            <Link
              href="/dashboard/discord-insights"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white mt-2"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Discord インサイト</span>
            </Link>
          </nav>
        </div>
      )}

      {/* NotificationCenter Modal */}
      <NotificationCenter 
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />
    </header>
  );
}