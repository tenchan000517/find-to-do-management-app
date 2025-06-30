'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserResourceProfile, 
  USER_TYPE_PRESETS, 
  validateUserResourceProfile,
  applyUserTypePreset,
  calculateResourceUtilization
} from '@/types/resource-profile';

interface ResourceProfileSetupProps {
  initialProfile?: Partial<UserResourceProfile>;
  onProfileChange?: (profile: Partial<UserResourceProfile>) => void;
  onSave?: (profile: UserResourceProfile) => void;
  className?: string;
}

export default function ResourceProfileSetup({
  initialProfile,
  onProfileChange,
  onSave,
  className = ''
}: ResourceProfileSetupProps) {
  const [profile, setProfile] = useState<Partial<UserResourceProfile>>(
    initialProfile || { ...USER_TYPE_PRESETS.employee }
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({ 
    isValid: true, 
    errors: [] 
  });

  // プロファイル変更時のバリデーション
  useEffect(() => {
    const validationResult = validateUserResourceProfile(profile);
    setValidation(validationResult);
    onProfileChange?.(profile);
  }, [profile, onProfileChange]);

  // ユーザータイプ変更時にプリセットを適用
  const handleUserTypeChange = (userType: UserResourceProfile['userType']) => {
    const preset = applyUserTypePreset(userType);
    setProfile(prev => ({
      ...preset,
      userType,
      // 既存のカスタム設定は保持
      id: prev.id,
      userId: prev.userId,
      createdAt: prev.createdAt,
      updatedAt: prev.updatedAt
    }));
  };

  // 容量設定の更新
  const updateDailyCapacity = (field: keyof UserResourceProfile['dailyCapacity'], value: number) => {
    setProfile(prev => ({
      ...prev,
      dailyCapacity: {
        ...prev.dailyCapacity!,
        [field]: value
      }
    }));
  };

  // 時間制約の更新
  const updateTimeConstraints = (field: keyof UserResourceProfile['timeConstraints'], value: any) => {
    setProfile(prev => ({
      ...prev,
      timeConstraints: {
        ...prev.timeConstraints!,
        [field]: value
      }
    }));
  };

  // 作業パターンの更新
  const updateWorkingPattern = (field: keyof UserResourceProfile['workingPattern'], value: any) => {
    setProfile(prev => ({
      ...prev,
      workingPattern: {
        ...prev.workingPattern!,
        [field]: value
      }
    }));
  };

  // プリファレンスの更新
  const updatePreferences = (field: keyof UserResourceProfile['preferences'], value: any) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences!,
        [field]: value
      }
    }));
  };

  // 保存処理
  const handleSave = () => {
    if (!validation.isValid) {
      alert('入力エラーがあります：\n' + validation.errors.join('\n'));
      return;
    }

    const now = new Date().toISOString();
    const completeProfile: UserResourceProfile = {
      id: profile.id || `profile_${Date.now()}`,
      userId: profile.userId || 'current_user',
      userType: profile.userType!,
      commitmentRatio: profile.commitmentRatio!,
      dailyCapacity: profile.dailyCapacity!,
      timeConstraints: profile.timeConstraints!,
      workingPattern: profile.workingPattern!,
      personalConstraints: profile.personalConstraints || {},
      preferences: profile.preferences!,
      createdAt: profile.createdAt || now,
      updatedAt: now
    };

    onSave?.(completeProfile);
  };

  // 現在の容量利用状況のプレビュー
  const getCapacityPreview = () => {
    if (!profile.dailyCapacity) return null;
    
    // サンプルタスクでの利用状況計算
    const sampleLoad = {
      light: Math.floor(profile.dailyCapacity.lightTaskSlots * 0.7),
      heavy: Math.floor(profile.dailyCapacity.heavyTaskSlots * 0.5)
    };
    const sampleWeight = sampleLoad.light * 2 + sampleLoad.heavy * 7;
    
    return calculateResourceUtilization(
      profile as UserResourceProfile,
      sampleWeight,
      sampleLoad
    );
  };

  const capacityPreview = getCapacityPreview();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          リソースプロファイル設定
        </h3>
        <p className="text-sm text-gray-600">
          あなたの生活パターンに合わせてスケジュール生成を最適化します
        </p>
      </div>

      {/* ユーザータイプ選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ライフスタイル
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(USER_TYPE_PRESETS).map(([key, preset]) => {
            const isSelected = profile.userType === key;
            return (
              <button
                key={key}
                onClick={() => handleUserTypeChange(key as UserResourceProfile['userType'])}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium text-sm">
                  {key === 'student' && '学生'}
                  {key === 'employee' && '会社員'}
                  {key === 'freelancer' && 'フリーランス'}
                  {key === 'entrepreneur' && '起業家'}
                  {key === 'parent' && '子育て中'}
                  {key === 'retiree' && '退職者'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {key === 'student' && '授業・バイト中心'}
                  {key === 'employee' && '平日勤務・夜作業'}
                  {key === 'freelancer' && '自由度高・重作業可'}
                  {key === 'entrepreneur' && '高負荷・長時間'}
                  {key === 'parent' && '子供時間考慮'}
                  {key === 'retiree' && '時間余裕・軽作業'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 基本容量設定 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          日次作業容量
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">軽いタスク数/日</label>
            <input
              type="number"
              min="1"
              max="10"
              value={profile.dailyCapacity?.lightTaskSlots || 0}
              onChange={(e) => updateDailyCapacity('lightTaskSlots', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">重いタスク数/日</label>
            <input
              type="number"
              min="0"
              max="5"
              value={profile.dailyCapacity?.heavyTaskSlots || 0}
              onChange={(e) => updateDailyCapacity('heavyTaskSlots', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">総ウエイト上限</label>
            <input
              type="number"
              min="5"
              max="25"
              value={profile.dailyCapacity?.totalWeightLimit || 0}
              onChange={(e) => updateDailyCapacity('totalWeightLimit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">連続作業時間(h)</label>
            <input
              type="number"
              min="1"
              max="12"
              value={profile.dailyCapacity?.continuousWorkHours || 0}
              onChange={(e) => updateDailyCapacity('continuousWorkHours', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* 時間制約 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          時間制約
        </label>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">1日最大作業時間</label>
            <input
              type="number"
              min="1"
              max="16"
              value={profile.timeConstraints?.maxWorkingHours || 0}
              onChange={(e) => updateTimeConstraints('maxWorkingHours', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* プリファレンス */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          作業プリファレンス
        </label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'earlyStart' as const, label: '早朝作業可能' },
            { key: 'lateWork' as const, label: '夜間作業可能' },
            { key: 'weekendWork' as const, label: '週末作業可能' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={profile.preferences?.[key] || false}
                onChange={(e) => updatePreferences(key, e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 詳細設定トグル */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full py-2 px-4 text-sm text-blue-600 hover:text-blue-800 transition-colors mb-4"
      >
        {showAdvanced ? '詳細設定を閉じる' : '詳細設定を表示'}
      </button>

      {/* 詳細設定 */}
      {showAdvanced && (
        <div className="border-t pt-4 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">集中力レベル</label>
            <select
              value={profile.workingPattern?.focusCapacity || 'medium'}
              onChange={(e) => updateWorkingPattern('focusCapacity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">休憩頻度</label>
            <select
              value={profile.preferences?.breakFrequency || 'medium'}
              onChange={(e) => updatePreferences('breakFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="low">少ない</option>
              <option value="medium">普通</option>
              <option value="high">多い</option>
            </select>
          </div>
        </div>
      )}

      {/* 容量プレビュー */}
      {capacityPreview && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">設定プレビュー</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">軽タスク利用率</div>
              <div className={`font-medium ${
                capacityPreview.lightTaskUtilization > 0.8 ? 'text-red-600' : 
                capacityPreview.lightTaskUtilization > 0.6 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {Math.round(capacityPreview.lightTaskUtilization * 100)}%
              </div>
            </div>
            <div>
              <div className="text-gray-600">重タスク利用率</div>
              <div className={`font-medium ${
                capacityPreview.heavyTaskUtilization > 0.8 ? 'text-red-600' : 
                capacityPreview.heavyTaskUtilization > 0.6 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {Math.round(capacityPreview.heavyTaskUtilization * 100)}%
              </div>
            </div>
            <div>
              <div className="text-gray-600">負荷リスク</div>
              <div className={`font-medium ${
                capacityPreview.overloadRisk === 'high' ? 'text-red-600' : 
                capacityPreview.overloadRisk === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {capacityPreview.overloadRisk === 'high' ? '高' : 
                 capacityPreview.overloadRisk === 'medium' ? '中' : '低'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* バリデーションエラー */}
      {!validation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <h4 className="text-sm font-medium text-red-800 mb-1">入力エラー</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 保存ボタン */}
      {onSave && (
        <button
          onClick={handleSave}
          disabled={!validation.isValid}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            validation.isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          設定を保存
        </button>
      )}
    </div>
  );
}