/**
 * LINE ボット用共通ユーティリティ関数
 * 
 * このファイルは複数箇所で使用される処理ロジックを一元管理します。
 * 重複コード解消とメンテナンス性向上を目的としています。
 */

import { PriorityLevel, PRIORITY_MAP, DEFAULT_PRIORITY } from '../constants/line-types';

/**
 * 優先度文字列を正規化された優先度レベルに変換
 * 
 * @param priority 変換対象の優先度文字列（日本語・英語・大文字小文字混在対応）
 * @returns 正規化された優先度レベル（A, B, C, D）
 * 
 * @example
 * convertPriority('高') // 'A'
 * convertPriority('medium') // 'B'
 * convertPriority('低') // 'C'
 * convertPriority('unknown') // 'C' (デフォルト)
 */
export function convertPriority(priority: string): PriorityLevel {
  if (!priority || priority === 'null' || priority.trim() === '') {
    return DEFAULT_PRIORITY;
  }

  // 前後の空白を除去し、小文字に正規化
  const normalizedPriority = priority.trim().toLowerCase();
  
  // 直接マッピングをチェック
  if (normalizedPriority in PRIORITY_MAP) {
    return PRIORITY_MAP[normalizedPriority];
  }

  // 元の文字列でのマッピングもチェック（大文字小文字保持）
  const originalPriority = priority.trim();
  if (originalPriority in PRIORITY_MAP) {
    return PRIORITY_MAP[originalPriority];
  }

  // A, B, C, D の直接指定をチェック
  const directPriority = normalizedPriority.toUpperCase();
  if (directPriority === 'A' || directPriority === 'B' || directPriority === 'C' || directPriority === 'D') {
    return directPriority as PriorityLevel;
  }

  // フォールバックとしてデフォルト優先度を返す
  console.warn(`Unknown priority: ${priority}, using default: ${DEFAULT_PRIORITY}`);
  return DEFAULT_PRIORITY;
}

/**
 * 優先度レベルを表示用文字列に変換
 * 
 * @param priority 優先度レベル
 * @returns 表示用の優先度文字列
 * 
 * @example
 * getPriorityDisplayName('A') // '最高'
 * getPriorityDisplayName('B') // '中'
 * getPriorityDisplayName('C') // '低'
 * getPriorityDisplayName('D') // '最低'
 */
export function getPriorityDisplayName(priority: PriorityLevel): string {
  const displayMap: { [key in PriorityLevel]: string } = {
    'A': '最高',
    'B': '中',
    'C': '低',
    'D': '最低'
  };
  
  return displayMap[priority] || '低';
}

/**
 * 優先度の有効性チェック
 * 
 * @param priority チェック対象の優先度
 * @returns 有効な優先度かどうか
 */
export function isValidPriority(priority: string): boolean {
  if (!priority) return false;
  
  const normalizedPriority = priority.trim().toLowerCase();
  const directPriority = priority.trim().toUpperCase();
  
  return (
    normalizedPriority in PRIORITY_MAP ||
    priority.trim() in PRIORITY_MAP ||
    (directPriority === 'A' || directPriority === 'B' || directPriority === 'C' || directPriority === 'D')
  );
}

/**
 * 文字列の安全な切り取り
 * LINE APIの文字数制限に対応するため、指定された長さで文字列を切り取る
 * 
 * @param text 対象文字列
 * @param maxLength 最大長
 * @param suffix 切り取られた場合に追加するサフィックス（デフォルト: '...'）
 * @returns 切り取られた文字列
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 日時文字列のフォーマット
 * 
 * @param dateString 日時文字列
 * @returns フォーマットされた日時文字列
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn(`Failed to format date: ${dateString}`, error);
    return dateString;
  }
}