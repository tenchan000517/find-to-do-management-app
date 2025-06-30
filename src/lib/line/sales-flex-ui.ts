import { FlexMessage, FlexContainer } from '@line/bot-sdk';

interface SalesStatusData {
  dealName: string;
  customerName: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closing' | 'won' | 'lost';
  amount: number;
  probability: number;
  nextAction: string;
  dueDate: Date;
  lastActivity: string;
}

interface SalesMetricsData {
  monthlyTarget: number;
  currentProgress: number;
  dealsInPipeline: number;
  averageDealSize: number;
  conversionRate: number;
  forecastAccuracy: number;
}

interface ContractCelebrationData {
  customerName: string;
  contractAmount: number;
  salesRep: string;
  teamContribution: string[];
  nextSteps: string[];
}

/**
 * 営業専用Flex MessageUI
 * 営業プロセスの可視化とインタラクション
 */

/**
 * 営業案件ステータス表示
 */
export function createSalesStatusFlex(data: SalesStatusData): FlexMessage {
  const stageColors = {
    prospecting: '#BBBBBB',
    qualification: '#FFB84D',
    proposal: '#4D94FF',
    negotiation: '#FF8C4D',
    closing: '#4DFF88',
    won: '#00C851',
    lost: '#FF4444'
  };

  const stageNames = {
    prospecting: '見込み開拓',
    qualification: '資格確認',
    proposal: '提案',
    negotiation: '交渉',
    closing: 'クロージング',
    won: '成約',
    lost: '失注'
  };

  const progressPercentage = Math.min(Math.round(data.probability * 100), 100);

  const container: FlexContainer = {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '📊 営業案件ステータス',
              weight: 'bold',
              size: 'lg',
              color: '#FFFFFF',
              flex: 1
            },
            {
              type: 'text',
              text: stageNames[data.stage],
              weight: 'bold',
              size: 'sm',
              color: '#FFFFFF',
              align: 'end'
            }
          ]
        }
      ],
      backgroundColor: '#2E86C1',
      paddingAll: 'lg'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        // 案件情報
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '🏢 案件名',
                  size: 'sm',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: data.dealName,
                  size: 'sm',
                  weight: 'bold',
                  flex: 3,
                  wrap: true
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '👤 顧客名',
                  size: 'sm',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: data.customerName,
                  size: 'sm',
                  weight: 'bold',
                  flex: 3
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '💰 契約予定額',
                  size: 'sm',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: `¥${data.amount.toLocaleString()}`,
                  size: 'sm',
                  weight: 'bold',
                  color: '#E74C3C',
                  flex: 3
                }
              ]
            }
          ]
        },
        {
          type: 'separator'
        },
        // 成約確率
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: `🎯 成約確率: ${progressPercentage}%`,
              size: 'sm',
              weight: 'bold'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'box',
                      layout: 'vertical',
                      contents: [],
                      backgroundColor: stageColors[data.stage],
                      flex: progressPercentage,
                      cornerRadius: 'sm'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      contents: [],
                      backgroundColor: '#EEEEEE',
                      flex: 100 - progressPercentage,
                      cornerRadius: 'sm'
                    }
                  ],
                  height: '10px',
                  cornerRadius: 'sm'
                }
              ]
            }
          ]
        },
        {
          type: 'separator'
        },
        // 次のアクション
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: '📋 次のアクション',
              size: 'sm',
              weight: 'bold'
            },
            {
              type: 'text',
              text: data.nextAction,
              size: 'sm',
              wrap: true,
              color: '#2E86C1'
            },
            {
              type: 'text',
              text: `⏰ 期限: ${data.dueDate.toLocaleDateString()}`,
              size: 'xs',
              color: '#666666'
            }
          ]
        },
        {
          type: 'separator'
        },
        // 最新活動
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: '📝 最新活動',
              size: 'sm',
              weight: 'bold'
            },
            {
              type: 'text',
              text: data.lastActivity,
              size: 'sm',
              wrap: true,
              color: '#666666'
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
          color: '#2E86C1',
          action: {
            type: 'postback',
            label: '詳細確認',
            data: `action=view_deal_details&dealId=${data.dealName}`
          },
          flex: 1
        },
        {
          type: 'button',
          style: 'secondary',
          action: {
            type: 'postback',
            label: '進捗更新',
            data: `action=update_deal_progress&dealId=${data.dealName}`
          },
          flex: 1
        }
      ]
    }
  };

  return {
    type: 'flex',
    altText: `営業案件: ${data.dealName} (${stageNames[data.stage]})`,
    contents: container
  };
}

/**
 * 営業メトリクスダッシュボード
 */
export function createSalesMetricsFlex(data: SalesMetricsData): FlexMessage {
  const progressPercentage = Math.min(Math.round((data.currentProgress / data.monthlyTarget) * 100), 100);
  const progressColor = progressPercentage >= 80 ? '#00C851' : progressPercentage >= 60 ? '#FFB84D' : '#FF4444';

  const container: FlexContainer = {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📈 営業メトリクス',
          weight: 'bold',
          size: 'lg',
          color: '#FFFFFF'
        },
        {
          type: 'text',
          text: new Date().toLocaleDateString() + ' 現在',
          size: 'sm',
          color: '#FFFFFF'
        }
      ],
      backgroundColor: '#28B463',
      paddingAll: 'lg'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'lg',
      contents: [
        // 月次目標達成率
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '🎯 月次目標達成',
                  size: 'md',
                  weight: 'bold',
                  flex: 1
                },
                {
                  type: 'text',
                  text: `${progressPercentage}%`,
                  size: 'lg',
                  weight: 'bold',
                  color: progressColor,
                  align: 'end'
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [],
                  backgroundColor: progressColor,
                  flex: progressPercentage,
                  cornerRadius: 'sm'
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [],
                  backgroundColor: '#EEEEEE',
                  flex: Math.max(100 - progressPercentage, 1),
                  cornerRadius: 'sm'
                }
              ],
              height: '12px',
              cornerRadius: 'sm'
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `現在: ¥${data.currentProgress.toLocaleString()}`,
                  size: 'xs',
                  color: '#666666'
                },
                {
                  type: 'text',
                  text: `目標: ¥${data.monthlyTarget.toLocaleString()}`,
                  size: 'xs',
                  color: '#666666',
                  align: 'end'
                }
              ]
            }
          ]
        },
        {
          type: 'separator'
        },
        // KPI指標
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'xs',
                  contents: [
                    {
                      type: 'text',
                      text: '📊 パイプライン',
                      size: 'sm',
                      color: '#666666'
                    },
                    {
                      type: 'text',
                      text: `${data.dealsInPipeline}件`,
                      size: 'lg',
                      weight: 'bold',
                      color: '#2E86C1'
                    }
                  ],
                  flex: 1
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'xs',
                  contents: [
                    {
                      type: 'text',
                      text: '💰 平均案件額',
                      size: 'sm',
                      color: '#666666'
                    },
                    {
                      type: 'text',
                      text: `¥${Math.round(data.averageDealSize / 10000)}万`,
                      size: 'lg',
                      weight: 'bold',
                      color: '#E74C3C'
                    }
                  ],
                  flex: 1
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'xs',
                  contents: [
                    {
                      type: 'text',
                      text: '🎯 成約率',
                      size: 'sm',
                      color: '#666666'
                    },
                    {
                      type: 'text',
                      text: `${Math.round(data.conversionRate * 100)}%`,
                      size: 'lg',
                      weight: 'bold',
                      color: '#28B463'
                    }
                  ],
                  flex: 1
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'xs',
                  contents: [
                    {
                      type: 'text',
                      text: '📈 予測精度',
                      size: 'sm',
                      color: '#666666'
                    },
                    {
                      type: 'text',
                      text: `${Math.round(data.forecastAccuracy * 100)}%`,
                      size: 'lg',
                      weight: 'bold',
                      color: '#8E44AD'
                    }
                  ],
                  flex: 1
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
          color: '#28B463',
          action: {
            type: 'postback',
            label: '詳細レポート',
            data: 'action=view_sales_report'
          },
          flex: 1
        },
        {
          type: 'button',
          style: 'secondary',
          action: {
            type: 'postback',
            label: '案件一覧',
            data: 'action=view_deal_pipeline'
          },
          flex: 1
        }
      ]
    }
  };

  return {
    type: 'flex',
    altText: `営業メトリクス - 目標達成率: ${progressPercentage}%`,
    contents: container
  };
}

/**
 * 契約成立祝賀メッセージ
 */
export function createContractCelebrationFlex(data: ContractCelebrationData): FlexMessage {
  const container: FlexContainer = {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🎉 契約成立おめでとうございます！',
          weight: 'bold',
          size: 'lg',
          color: '#FFFFFF',
          align: 'center'
        },
        {
          type: 'text',
          text: '素晴らしい成果です',
          size: 'sm',
          color: '#FFFFFF',
          align: 'center'
        }
      ],
      backgroundColor: '#F39C12',
      paddingAll: 'lg'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'lg',
      contents: [
        // 契約詳細
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '🏢 顧客名',
                  size: 'sm',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: data.customerName,
                  size: 'md',
                  weight: 'bold',
                  flex: 3
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '💰 契約金額',
                  size: 'sm',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: `¥${data.contractAmount.toLocaleString()}`,
                  size: 'xl',
                  weight: 'bold',
                  color: '#E74C3C',
                  flex: 3
                }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '👤 営業担当',
                  size: 'sm',
                  color: '#666666',
                  flex: 2
                },
                {
                  type: 'text',
                  text: data.salesRep,
                  size: 'md',
                  weight: 'bold',
                  color: '#2E86C1',
                  flex: 3
                }
              ]
            }
          ]
        },
        {
          type: 'separator'
        },
        // チーム貢献
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: '👥 チーム貢献',
              size: 'sm',
              weight: 'bold',
              color: '#28B463'
            },
            ...data.teamContribution.map(contribution => ({
              type: 'text' as const,
              text: `• ${contribution}`,
              size: 'sm' as const,
              wrap: true,
              color: '#666666'
            }))
          ]
        },
        {
          type: 'separator'
        },
        // 次のステップ
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: '📋 次のステップ',
              size: 'sm',
              weight: 'bold',
              color: '#8E44AD'
            },
            ...data.nextSteps.map(step => ({
              type: 'text' as const,
              text: `• ${step}`,
              size: 'sm' as const,
              wrap: true,
              color: '#666666'
            }))
          ]
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
              color: '#F39C12',
              action: {
                type: 'postback',
                label: 'プロジェクト開始',
                data: `action=start_project&customer=${data.customerName}`
              },
              flex: 1
            },
            {
              type: 'button',
              style: 'secondary',
              action: {
                type: 'postback',
                label: '成功分析',
                data: `action=analyze_success&deal=${data.customerName}`
              },
              flex: 1
            }
          ]
        },
        {
          type: 'button',
          style: 'link',
          action: {
            type: 'postback',
            label: '🎊 チームで祝う',
            data: 'action=team_celebration'
          }
        }
      ]
    }
  };

  return {
    type: 'flex',
    altText: `🎉 契約成立: ${data.customerName} - ¥${data.contractAmount.toLocaleString()}`,
    contents: container
  };
}

/**
 * 営業アクションメニュー
 */
export function createSalesActionMenuFlex(): FlexMessage {
  const container: FlexContainer = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🎯 営業アクションメニュー',
          weight: 'bold',
          size: 'lg',
          color: '#FFFFFF'
        }
      ],
      backgroundColor: '#2E86C1',
      paddingAll: 'lg'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#28B463',
          action: {
            type: 'postback',
            label: '📊 案件状況確認',
            data: 'action=check_deal_status'
          }
        },
        {
          type: 'button',
          style: 'primary',
          color: '#E74C3C',
          action: {
            type: 'postback',
            label: '🎯 成約確率分析',
            data: 'action=analyze_success_probability'
          }
        },
        {
          type: 'button',
          style: 'primary',
          color: '#8E44AD',
          action: {
            type: 'postback',
            label: '📝 提案書生成',
            data: 'action=generate_proposal'
          }
        },
        {
          type: 'button',
          style: 'primary',
          color: '#F39C12',
          action: {
            type: 'postback',
            label: '🤝 交渉戦略',
            data: 'action=negotiation_strategy'
          }
        },
        {
          type: 'button',
          style: 'secondary',
          action: {
            type: 'postback',
            label: '📈 営業メトリクス',
            data: 'action=view_sales_metrics'
          }
        },
        {
          type: 'button',
          style: 'secondary',
          action: {
            type: 'postback',
            label: '👥 顧客分析',
            data: 'action=customer_analysis'
          }
        }
      ]
    }
  };

  return {
    type: 'flex',
    altText: '営業アクションメニュー',
    contents: container
  };
}