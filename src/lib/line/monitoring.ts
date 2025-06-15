// LINE Bot監視のヘルパー関数

// 外部API経由でイベントを記録
export const recordBotEvent = async (
  type: string, 
  status: 'success' | 'error', 
  responseTime?: number, 
  error?: string
) => {
  try {
    await fetch('/api/line/monitoring', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        status,
        responseTime,
        error
      })
    });
  } catch (err) {
    console.warn('Failed to record bot event:', err);
  }
};

// 外部API経由でユーザーを記録
export const recordBotUser = async (userId: string, isNewUser: boolean = false) => {
  try {
    await fetch('/api/line/monitoring', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        isNewUser
      })
    });
  } catch (err) {
    console.warn('Failed to record bot user:', err);
  }
};

// 監視データを取得
export const getBotMetrics = async () => {
  try {
    const response = await fetch('/api/line/monitoring');
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return await response.json();
  } catch (err) {
    console.error('Failed to get bot metrics:', err);
    return null;
  }
};