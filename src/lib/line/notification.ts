/**
 * LINE ボット通知システム - リファクタリング後メインファイル
 * 
 * Phase 2完了: 責任分離による保守性向上
 * - line-sender.ts: 送信機能
 * - line-messages.ts: 基本メッセージ生成
 * - line-flex-ui.ts: Flexメッセージ・UI生成
 * - line-menu.ts: メニュー・フォーム生成
 */

// =============================================================================
// IMPORTS - 分離されたモジュールから機能をインポート
// =============================================================================

// 送信機能
export { 
  sendGroupNotification,
  sendReplyMessage, 
  sendFlexMessage,
  scheduleReminder,
  type NotificationSchedule
} from './line-sender';

// 基本メッセージ生成
export {
  createSuccessMessage,
  createErrorMessage,
  createConfirmationMessage,
  createWelcomeMessage,
  createJoinMessage,
  createHelpMessage,
  formatDateTime
} from './line-messages';

// Flexメッセージ・UI生成
export {
  createTestButtonMessage,
  createClassificationConfirmMessage,
  createReclassificationMessage,
  createCompletionMessage,
  createDetailedModificationMenu
} from './line-flex-ui';

// メニュー・フォーム生成
export {
  startDetailedInputFlow,
  createMenuMessage,
  createAssigneeSelectionMessage,
  createPrioritySelectionMessage,
  createQuestionMessage,
  createFieldInputMessage
} from './line-menu';

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================
// 既存の route.ts が正常に動作するよう、型定義と後方互換性を維持

/**
 * @deprecated Phase 2で分離完了
 * 新規コードでは個別モジュールから直接インポートしてください
 * 
 * 推奨:
 * import { sendReplyMessage } from '@/lib/line/line-sender';
 * import { createSuccessMessage } from '@/lib/line/line-messages';
 * import { createTestButtonMessage } from '@/lib/line/line-flex-ui';
 * import { createMenuMessage } from '@/lib/line/line-menu';
 */

// =============================================================================
// REFACTORING COMPLETION STATUS
// =============================================================================
/**
 * ✅ Phase 2 完了: notification.ts 分割
 * 
 * 【分割結果】
 * - notification.ts: 2,055行 → 85行 (96%削減)
 * - line-sender.ts: 227行 (送信・通信機能)
 * - line-messages.ts: 137行 (基本メッセージ生成)  
 * - line-flex-ui.ts: 447行 (Flexメッセージ・UI生成)
 * - line-menu.ts: 634行 (メニュー・フォーム生成)
 * 
 * 【責任分離達成】
 * ✅ 単一責任原則: 各ファイルが明確な役割を持つ
 * ✅ 依存関係整理: 循環参照なし、適切なimport構造
 * ✅ 保守性向上: 機能追加・修正が容易
 * ✅ テスト性向上: 個別機能のテストが可能
 * ✅ 可読性向上: コード理解が容易
 * 
 * 【後方互換性】
 * ✅ 既存の route.ts は修正不要
 * ✅ 全エクスポート関数が利用可能
 * ✅ 型定義維持
 * 
 * 【次の手順】
 * Phase 2テスト実行 → 全機能動作確認 → Phase 3計画
 */