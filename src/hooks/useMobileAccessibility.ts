"use client";
import { useState, useEffect } from 'react';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  oneHandMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  voiceControl: boolean;
}

export function useMobileAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    oneHandMode: false,
    reducedMotion: false,
    highContrast: false,
    voiceControl: false
  });

  const [reachableHeight, setReachableHeight] = useState<number>(window.innerHeight);

  useEffect(() => {
    // ローカルストレージから設定を読み込み
    const savedSettings = localStorage.getItem('mobile-accessibility');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // システムの設定をチェック
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast
      }));
    }

    // 片手操作モード時のリーチャブル高さを計算
    const calculateReachableHeight = () => {
      const screenHeight = window.innerHeight;
      // 親指の届く範囲（画面下部から約75%）
      return screenHeight * 0.75;
    };

    setReachableHeight(calculateReachableHeight());

    const handleResize = () => {
      setReachableHeight(calculateReachableHeight());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('mobile-accessibility', JSON.stringify(updated));

    // フォントサイズをCSS変数に適用
    applyFontSize(updated.fontSize);
    
    // 片手操作モードをCSS変数に適用
    applyOneHandMode(updated.oneHandMode);
    
    // 高コントラストモードを適用
    applyHighContrast(updated.highContrast);
  };

  const applyFontSize = (fontSize: AccessibilitySettings['fontSize']) => {
    const root = document.documentElement;
    const sizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    
    root.style.setProperty('--mobile-font-size', sizeMap[fontSize]);
    
    // 相対的なサイズも調整
    const multipliers = {
      'small': 0.875,
      'medium': 1,
      'large': 1.125,
      'extra-large': 1.25
    };
    
    const multiplier = multipliers[fontSize];
    root.style.setProperty('--mobile-font-xs', `${12 * multiplier}px`);
    root.style.setProperty('--mobile-font-sm', `${14 * multiplier}px`);
    root.style.setProperty('--mobile-font-lg', `${18 * multiplier}px`);
    root.style.setProperty('--mobile-font-xl', `${20 * multiplier}px`);
  };

  const applyOneHandMode = (enabled: boolean) => {
    const root = document.documentElement;
    if (enabled) {
      root.style.setProperty('--mobile-max-height', `${reachableHeight}px`);
      root.style.setProperty('--mobile-content-position', 'bottom');
      root.classList.add('one-hand-mode');
    } else {
      root.style.removeProperty('--mobile-max-height');
      root.style.removeProperty('--mobile-content-position');
      root.classList.remove('one-hand-mode');
    }
  };

  const applyHighContrast = (enabled: boolean) => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  };

  // 動的フォントサイズ調整
  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    const sizes: AccessibilitySettings['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    
    let newIndex;
    if (direction === 'increase') {
      newIndex = Math.min(currentIndex + 1, sizes.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    updateSettings({ fontSize: sizes[newIndex] });
  };

  // 片手操作モード切替
  const toggleOneHandMode = () => {
    updateSettings({ oneHandMode: !settings.oneHandMode });
  };

  // 高コントラスト切替
  const toggleHighContrast = () => {
    updateSettings({ highContrast: !settings.highContrast });
  };

  // 音声コントロール切替
  const toggleVoiceControl = () => {
    updateSettings({ voiceControl: !settings.voiceControl });
  };

  // リーチャブルな領域内かどうかを判定
  const isReachable = (elementY: number): boolean => {
    if (!settings.oneHandMode) return true;
    return elementY >= window.innerHeight - reachableHeight;
  };

  // アクセシビリティCSS クラス生成
  const getAccessibilityClasses = () => {
    const classes = [];
    
    if (settings.oneHandMode) classes.push('one-hand-mode');
    if (settings.reducedMotion) classes.push('reduced-motion');
    if (settings.highContrast) classes.push('high-contrast');
    
    return classes.join(' ');
  };

  return {
    settings,
    updateSettings,
    adjustFontSize,
    toggleOneHandMode,
    toggleHighContrast,
    toggleVoiceControl,
    isReachable,
    reachableHeight,
    getAccessibilityClasses
  };
}