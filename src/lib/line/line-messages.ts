/**
 * LINE ボット基本メッセージ生成
 * 
 * テキストベースのメッセージ生成を担当
 * notification.tsから分離・責任を明確化
 */

import { getTypeDisplayName } from '@/lib/constants/line-types';

/**
 * 成功通知メッセージの作成
 * @param type データタイプ
 * @param title タイトル
 * @returns 成功メッセージ
 */
export function createSuccessMessage(type: string, title: string): string {
  const typeText = getTypeDisplayName(type);

  return `✅ ${typeText}を登録しました！

タイトル: ${title}

詳細はアプリで確認できます 👉 https://find-to-do-management-app.vercel.app/`;
}

/**
 * エラー通知メッセージの作成
 * @param error エラー内容
 * @returns エラーメッセージ
 */
export function createErrorMessage(error: string): string {
  return `❌ 処理中にエラーが発生しました

エラー: ${error}

もう一度お試しいただくか、手動でアプリに入力してください。`;
}

/**
 * 確認要求メッセージの作成
 * @param extractedData 抽出データ
 * @returns 確認メッセージ
 */
export function createConfirmationMessage(extractedData: any): string {
  return `🤖 以下の内容で登録しますか？

種類: ${extractedData.type}
タイトル: ${extractedData.title}
${extractedData.datetime ? `日時: ${extractedData.datetime}` : ''}
${extractedData.attendees ? `参加者: ${extractedData.attendees.join(', ')}` : ''}
${extractedData.location ? `場所: ${extractedData.location}` : ''}

信頼度: ${Math.round(extractedData.confidence * 100)}%

「はい」「OK」で確定、「いいえ」「キャンセル」で取消`;
}

/**
 * ウェルカムメッセージ
 * @returns ウェルカムメッセージ
 */
export function createWelcomeMessage(): string {
  return `🎉 FIND to DO Botにご登録いただき、ありがとうございます！

このボットでできること:
📅 予定の自動登録
📋 タスクの作成
📊 プロジェクト管理
👤 人脈情報の記録

使い方:
@find_todo [種類] [内容]

例:
@find_todo 予定 明日14時 田中さんと打ち合わせ
@find_todo タスク 企画書作成 来週金曜まで
@find_todo 人脈 山田太郎 ABC商事 営業部長

まずはお試しください！`;
}

/**
 * グループ参加メッセージ
 * @returns 参加メッセージ
 */
export function createJoinMessage(): string {
  return `👋 FIND to DO Botがグループに参加しました！

メンション(@find_todo)でボットを呼び出せます。
予定やタスクの管理をサポートします。

詳しい使い方: @FIND to DO ヘルプ`;
}

/**
 * ヘルプメッセージ
 * @returns ヘルプメッセージ
 */
export function createHelpMessage(): string {
  return `📚 FIND to DO Bot 使い方ガイド

🔹 基本的な使い方
@FIND to DO [内容] でメッセージを送信

🔹 機能一覧
📅 **予定登録**
例: @FIND to DO 明日14時 田中さんと会議
例: @FIND to DO 予定 来週火曜 プレゼン準備

📋 **タスク作成**  
例: @FIND to DO タスク 企画書作成 来週金曜まで
例: @FIND to DO やること 資料整理

📊 **プロジェクト管理**
例: @FIND to DO プロジェクト 新サービス開発
例: @FIND to DO 案件 ABC商事との契約

👤 **人脈記録**
例: @FIND to DO 人脈 山田太郎 ABC商事 営業部長

📝 **メモ作成**
例: @FIND to DO メモ 今日の気づき

🔹 特殊コマンド
• @FIND to DO ヘルプ → この画面を表示
• @FIND to DO @コマンド → ボタンテスト

🤖 AI機能で自動的に内容を解析し、適切な形で登録します。
信頼度が低い場合は確認メッセージを送信します。`;
}

/**
 * 日時フォーマット関数
 * @param datetime 日時文字列
 * @returns フォーマット済み日時
 */
export function formatDateTime(datetime: string): string {
  try {
    const date = new Date(datetime);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // 日付部分
    let dateStr = '';
    if (date.toDateString() === now.toDateString()) {
      dateStr = '今日';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateStr = '明日';
    } else {
      dateStr = `${month}/${day}`;
      if (year !== now.getFullYear()) {
        dateStr = `${year}/${dateStr}`;
      }
    }
    
    // 時刻部分（時刻が00:00でない場合のみ表示）
    let timeStr = '';
    if (hours !== 0 || minutes !== 0) {
      timeStr = ` ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return dateStr + timeStr;
  } catch (error) {
    console.error('DateTime format error:', error);
    return datetime;
  }
}