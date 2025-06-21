'use client';

import { useState, useEffect } from 'react';

interface RealtimeData {
  activeUsers: number;
  byCountry: Array<any>;
  byDevice: Array<any>;
}

interface RealtimeStatusProps {
  data: RealtimeData;
}

export default function RealtimeStatus({ data }: RealtimeStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generate sample device data for demonstration
  const sampleDeviceData = [
    { device: 'Desktop', users: Math.floor(data.activeUsers * 0.6), percentage: 60 },
    { device: 'Mobile', users: Math.floor(data.activeUsers * 0.35), percentage: 35 },
    { device: 'Tablet', users: Math.floor(data.activeUsers * 0.05), percentage: 5 },
  ];

  // Generate sample country data for demonstration
  const sampleCountryData = [
    { country: '日本', users: Math.floor(data.activeUsers * 0.8), flag: '🇯🇵' },
    { country: 'アメリカ', users: Math.floor(data.activeUsers * 0.1), flag: '🇺🇸' },
    { country: 'その他', users: Math.floor(data.activeUsers * 0.1), flag: '🌍' },
  ];

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Desktop':
        return '💻';
      case 'Mobile':
        return '📱';
      case 'Tablet':
        return '📲';
      default:
        return '🖥️';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <h3 className="text-lg font-semibold text-gray-900">リアルタイム</h3>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {currentTime.toLocaleTimeString('ja-JP')} 更新
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Users */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {data.activeUsers || 0}
          </div>
          <div className="text-sm text-gray-600">現在のアクティブユーザー</div>
        </div>

        {/* Device Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">デバイス別</h4>
          <div className="space-y-2">
            {sampleDeviceData.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getDeviceIcon(device.device)}</span>
                  <span className="text-sm text-gray-600">{device.device}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {device.users}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Country Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">国別</h4>
          <div className="space-y-2">
            {sampleCountryData.map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm text-gray-600">{country.country}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {country.users}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">ライブデータ</span>
          </div>
          <div className="text-gray-500">
            過去30分間のデータ
          </div>
        </div>
      </div>
    </div>
  );
}