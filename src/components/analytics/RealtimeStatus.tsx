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

  const activeUsers = data?.activeUsers || 0;

  // Use real device data if available
  const deviceData = data?.byDevice?.length > 0 ? 
    data.byDevice.slice(0, 3).map((item: any) => ({
      device: item.device || 'Unknown',
      users: item.activeUsers || 0,
      percentage: activeUsers > 0 ? Math.round((item.activeUsers / activeUsers) * 100) : 0
    })) : [];

  // Use real country data if available
  const countryData = data?.byCountry?.length > 0 ? 
    data.byCountry.slice(0, 3).map((item: any) => ({
      country: item.country || 'Unknown',
      users: item.activeUsers || 0,
      flag: getCountryFlag(item.country)
    })) : [];

  const getCountryFlag = (country: string) => {
    const countryFlags: { [key: string]: string } = {
      'JP': '🇯🇵', 'JPN': '🇯🇵', 'Japan': '🇯🇵', '日本': '🇯🇵',
      'US': '🇺🇸', 'USA': '🇺🇸', 'United States': '🇺🇸', 'アメリカ': '🇺🇸',
      'CN': '🇨🇳', 'China': '🇨🇳', '中国': '🇨🇳',
      'KR': '🇰🇷', 'Korea': '🇰🇷', '韓国': '🇰🇷',
      'GB': '🇬🇧', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'イギリス': '🇬🇧',
    };
    return countryFlags[country] || '🌍';
  };

  const getDeviceIcon = (device: string) => {
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('desktop') || deviceLower.includes('computer')) return '💻';
    if (deviceLower.includes('mobile') || deviceLower.includes('phone')) return '📱';
    if (deviceLower.includes('tablet')) return '📲';
    return '🖥️';
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
            {activeUsers}
          </div>
          <div className="text-sm text-gray-600">現在のアクティブユーザー</div>
        </div>

        {/* Device Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">デバイス別</h4>
          {deviceData.length > 0 ? (
            <div className="space-y-2">
              {deviceData.map((device, index) => (
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
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">データなし</p>
            </div>
          )}
        </div>

        {/* Country Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">国別</h4>
          {countryData.length > 0 ? (
            <div className="space-y-2">
              {countryData.map((country: any, index: number) => (
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
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">データなし</p>
            </div>
          )}
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