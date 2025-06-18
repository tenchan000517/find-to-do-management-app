/**
 * LINE ボット用共通定数定義
 * 
 * このファイルは全てのLINEボット関連機能で使用される定数を一元管理します。
 * 重複コード解消とメンテナンス性向上を目的としています。
 */

/**
 * データタイプとアイコンのマッピング
 * AI分析結果の分類タイプを画面表示用のテキストに変換
 */
export const TYPE_MAP: { [key: string]: string } = {
  personal_schedule: '📅 予定',
  schedule: '🎯 イベント',
  task: '📋 タスク',
  project: '📊 プロジェクト',
  contact: '👤 人脈',
  appointment: '📅 アポイントメント',
  memo: '📝 メモ・ナレッジ'
} as const;

/**
 * 優先度レベルの定義
 * AI分析やユーザー入力の優先度を正規化された値に変換
 */
export type PriorityLevel = 'A' | 'B' | 'C' | 'D';

/**
 * 優先度マッピング定義
 * 文字列形式の優先度を正規化された優先度レベルにマッピング
 */
export const PRIORITY_MAP: { [key: string]: PriorityLevel } = {
  '最高': 'A',
  '高': 'A', 
  'high': 'A',
  '中': 'B',
  'medium': 'B',
  '低': 'C',
  'low': 'C',
  '最低': 'D'
} as const;

/**
 * デフォルト優先度
 * 優先度が指定されていない場合に使用
 */
export const DEFAULT_PRIORITY: PriorityLevel = 'C';

/**
 * タイプの有効性チェック
 * @param type チェック対象のタイプ
 * @returns 有効なタイプかどうか
 */
export function isValidType(type: string): boolean {
  return type in TYPE_MAP;
}

/**
 * タイプ表示名取得
 * @param type データタイプ
 * @param fallback フォールバック表示（デフォルト: '📝 データ'）
 * @returns 表示用テキスト
 */
export function getTypeDisplayName(type: string, fallback: string = '📝 データ'): string {
  return TYPE_MAP[type] || fallback;
}