/**
 * LINE ボット Flexメッセージ・UI生成
 * 
 * リッチなFlexメッセージとUI要素の生成を担当
 * notification.tsから分離・Flexメッセージに特化
 */

import { sendFlexMessage } from './line-sender';
import { getTypeDisplayName } from '@/lib/constants/line-types';
import { formatDateTime } from './line-messages';

/**
 * 確認用ボタンメッセージ
 * @param replyToken 返信トークン
 * @returns 送信成功フラグ
 */
export async function createTestButtonMessage(replyToken: string): Promise<boolean> {
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🧪 ボタンテスト',
          weight: 'bold',
          size: 'xl',
          margin: 'md'
        },
        {
          type: 'text',
          text: 'LINEボタン機能のテストです。どちらかのボタンを押してください。',
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'YES',
            data: 'confirm_yes'
          }
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: 'NO',
            data: 'confirm_no'
          }
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, 'ボタンテスト', flexContent);
}

/**
 * 分類確認ボタンメッセージ
 * @param replyToken 返信トークン
 * @param extractedData 抽出データ
 * @returns 送信成功フラグ
 */
export async function createClassificationConfirmMessage(replyToken: string, extractedData: any, type?: string, isMenuSession?: boolean): Promise<boolean> {
  console.log('🔍 DEBUG TYPE_MAP keys:', Object.keys({}));
  console.log('🔍 DEBUG extractedData.type in flex-ui:', JSON.stringify(extractedData.type));
  const actualType = type || extractedData.type;
  const typeText = getTypeDisplayName(actualType);
  const confidence = extractedData.confidence ? Math.round(extractedData.confidence * 100) : 95; // メニュー選択時は高信頼度

  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🤖 内容確認',
          weight: 'bold',
          size: 'xl',
          margin: 'md'
        },
        {
          type: 'text',
          text: `以下の分類で正しいですか？`,
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '種類:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: typeText,
                  size: 'sm',
                  color: '#111111',
                  flex: 2
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'タイトル:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: extractedData.title || '(不明)',
                  size: 'sm',
                  color: '#111111',
                  flex: 2,
                  wrap: true
                }
              ]
            },
            ...(extractedData.datetime ? [{
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '日時:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: formatDateTime(extractedData.datetime),
                  size: 'sm',
                  color: '#111111',
                  flex: 2,
                  wrap: true
                }
              ]
            }] : []),
            ...(extractedData.location ? [{
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '場所:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: extractedData.location,
                  size: 'sm',
                  color: '#111111',
                  flex: 2,
                  wrap: true
                }
              ]
            }] : []),
            ...(extractedData.description && extractedData.description !== extractedData.title ? [{
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '説明:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: extractedData.description.length > 50 ? extractedData.description.substring(0, 50) + '...' : extractedData.description,
                  size: 'sm',
                  color: '#111111',
                  flex: 2,
                  wrap: true
                }
              ]
            }] : []),
            ...(extractedData.priority ? [{
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '優先度:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: extractedData.priority === 'high' ? '高' : extractedData.priority === 'medium' ? '中' : '低',
                  size: 'sm',
                  color: extractedData.priority === 'high' ? '#FF4444' : extractedData.priority === 'medium' ? '#FF8800' : '#00C851',
                  flex: 2
                }
              ]
            }] : []),
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'AI解析信頼度:',
                  size: 'sm',
                  color: '#555555',
                  flex: 1
                },
                {
                  type: 'text',
                  text: `${confidence}%`,
                  size: 'sm',
                  color: confidence > 70 ? '#00C851' : confidence > 50 ? '#FF8800' : '#FF4444',
                  flex: 2
                }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '✅ 正しい',
            data: `classification_confirm_${actualType}`
          }
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '🔧 修正',
            data: 'show_modification_ui'
          }
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, '分類確認', flexContent);
}

/**
 * 再分類選択ボタンメッセージ
 * @param replyToken 返信トークン
 * @returns 送信成功フラグ
 */
export async function createReclassificationMessage(replyToken: string): Promise<boolean> {
  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🔄 種類を選択',
          weight: 'bold',
          size: 'xl',
          margin: 'md'
        },
        {
          type: 'text',
          text: '正しい種類を選択してください',
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'md'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'xs',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📅 予定',
                data: 'reclassify_personal_schedule'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '🎯 イベント',
                data: 'reclassify_schedule'
              }
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📋 タスク',
                data: 'reclassify_task'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📊 プロジェクト',
                data: 'reclassify_project'
              }
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '👤 人脈',
                data: 'reclassify_contact'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📝 メモ',
                data: 'reclassify_memo'
              }
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'xs',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📅 アポイント',
                data: 'reclassify_appointment'
              }
            },
            {
              type: 'spacer'
            }
          ]
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, '種類選択', flexContent);
}

/**
 * 完了メッセージ（ダッシュボードリンク付き）
 * @param replyToken 返信トークン
 * @param type データタイプ
 * @param itemData アイテムデータ
 * @returns 送信成功フラグ
 */
export async function createCompletionMessage(replyToken: string, type: string, itemData?: { title?: string;[key: string]: any }): Promise<boolean> {
  const typeText = getTypeDisplayName(type);

  // タイトル情報がある場合はより詳細なメッセージを作成
  const titleInfo = itemData?.title || '';
  const mainMessage = titleInfo
    ? `${typeText}「${titleInfo}」を保存しました！`
    : `${typeText}として登録しました！`;

  const flexContent = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✅ 登録完了',
          weight: 'bold',
          size: 'xl',
          color: '#00C851',
          margin: 'md'
        },
        {
          type: 'text',
          text: mainMessage,
          wrap: true,
          color: '#333333',
          size: 'md',
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'text',
          text: '🎯 次のアクション',
          weight: 'bold',
          size: 'md',
          margin: 'md'
        },
        {
          type: 'text',
          text: '• このままLINEで続けて詳細入力\n• ダッシュボードで詳細を編集',
          wrap: true,
          color: '#666666',
          size: 'sm',
          margin: 'sm'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              color: '#1E90FF',
              action: {
                type: 'uri',
                label: '📊 ダッシュボード',
                uri: 'https://find-to-do-management-app.vercel.app/'
              },
              flex: 1
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📝 詳細入力',
                data: `start_detailed_input_${type}`
              },
              flex: 1
            }
          ]
        },
        {
          type: 'text',
          text: 'または、このまま次の項目をメッセージで送信してください',
          wrap: true,
          color: '#999999',
          size: 'xs',
          align: 'center',
          margin: 'sm'
        }
      ]
    }
  };

  return await sendFlexMessage(replyToken, '登録完了', flexContent);
}

/**
 * 包括的修正UIメニュー（すべての項目を編集可能）
 * @param replyToken 返信トークン
 * @param sessionData セッションデータ
 * @returns 送信成功フラグ
 */
export async function createDetailedModificationMenu(replyToken: string, sessionData: any): Promise<boolean> {
  console.log(`🎯 Creating detailed modification menu for:`, sessionData);

  const currentData = sessionData.pendingItem || {};
  const typeText = getTypeDisplayName(sessionData.currentType);

  const flexContent = {
    type: 'carousel',
    contents: [
      // 基本情報編集バブル
      {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📝 基本情報編集',
              weight: 'bold',
              size: 'md',
              color: '#1DB446'
            },
            {
              type: 'text',
              text: typeText,
              size: 'sm',
              color: '#666666'
            }
          ]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '🔄 種類選択',
                data: 'classification_change'
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📋 タイトル',
                data: `modify_field_${sessionData.currentType}_title`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📝 説明',
                data: `modify_field_${sessionData.currentType}_description`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '🎯 優先度',
                data: `modify_field_${sessionData.currentType}_priority`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '👤 担当者',
                data: `modify_field_${sessionData.currentType}_assignee`
              }
            },
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '💾 保存',
                data: `confirm_save_${sessionData.currentType}`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '❌ キャンセル',
                data: 'cancel_modification'
              }
            }
          ]
        }
      },
      // 日時・場所編集バブル
      {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🕒 日時・場所編集',
              weight: 'bold',
              size: 'md',
              color: '#FF6B6B'
            },
            {
              type: 'text',
              text: '日程と場所を修正',
              size: 'sm',
              color: '#666666'
            }
          ]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📅 日時',
                data: `modify_field_${sessionData.currentType}_datetime`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '📍 場所',
                data: `modify_field_${sessionData.currentType}_location`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '⏰ 期限',
                data: `modify_field_${sessionData.currentType}_deadline`
              }
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '⏱️ 工数',
                data: `modify_field_${sessionData.currentType}_estimatedHours`
              }
            }
          ]
        }
      }
    ]
  };

  return await sendFlexMessage(replyToken, '詳細編集メニュー', flexContent);
}