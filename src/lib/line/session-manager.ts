// LINEボット用セッション管理
// インメモリストア（本番環境ではRedisやDBを推奨）

interface InputSession {
  userId: string;
  groupId?: string;
  type: string; // schedule, task, project, contact, memo
  currentField?: string; // 現在入力中のフィールド
  data: Record<string, any>; // 入力済みデータ
  startTime: number;
  lastActivity: number;
}

class SessionManager {
  private sessions: Map<string, InputSession> = new Map();
  
  // セッション開始
  startSession(userId: string, groupId: string | undefined, type: string): void {
    const sessionKey = this.getSessionKey(userId, groupId);
    const session: InputSession = {
      userId,
      groupId,
      type,
      data: {},
      startTime: Date.now(),
      lastActivity: Date.now()
    };
    
    this.sessions.set(sessionKey, session);
    console.log(`📝 Session started for ${sessionKey}: ${type}`);
  }
  
  // セッション取得
  getSession(userId: string, groupId: string | undefined): InputSession | null {
    const sessionKey = this.getSessionKey(userId, groupId);
    const session = this.sessions.get(sessionKey);
    
    if (session) {
      // 30分でタイムアウト
      if (Date.now() - session.lastActivity > 30 * 60 * 1000) {
        this.endSession(userId, groupId);
        return null;
      }
      
      // 最終活動時刻更新
      session.lastActivity = Date.now();
    }
    
    return session || null;
  }
  
  // 現在入力中フィールド設定
  setCurrentField(userId: string, groupId: string | undefined, fieldKey: string): void {
    const session = this.getSession(userId, groupId);
    if (session) {
      session.currentField = fieldKey;
      console.log(`🎯 Field set for ${this.getSessionKey(userId, groupId)}: ${fieldKey}`);
    }
  }
  
  // データ保存
  saveFieldData(userId: string, groupId: string | undefined, fieldKey: string, value: string | string[]): void {
    const session = this.getSession(userId, groupId);
    if (session) {
      session.data[fieldKey] = value;
      session.currentField = undefined; // フィールド入力完了
      console.log(`💾 Data saved for ${this.getSessionKey(userId, groupId)}: ${fieldKey} = ${JSON.stringify(value)}`);
    }
  }
  
  // セッション終了
  endSession(userId: string, groupId: string | undefined): InputSession | null {
    const sessionKey = this.getSessionKey(userId, groupId);
    const session = this.sessions.get(sessionKey);
    
    if (session) {
      this.sessions.delete(sessionKey);
      console.log(`🏁 Session ended for ${sessionKey}`);
    }
    
    return session || null;
  }
  
  // セッション存在確認
  hasActiveSession(userId: string, groupId: string | undefined): boolean {
    return this.getSession(userId, groupId) !== null;
  }
  
  // セッションキー生成
  private getSessionKey(userId: string, groupId: string | undefined): string {
    return groupId ? `${groupId}:${userId}` : userId;
  }
  
  // 入力待ち状態確認
  isWaitingForInput(userId: string, groupId: string | undefined): boolean {
    const session = this.getSession(userId, groupId);
    return session?.currentField !== undefined;
  }
  
  // セッション情報取得
  getSessionInfo(userId: string, groupId: string | undefined): { type: string; currentField?: string; data: Record<string, any> } | null {
    const session = this.getSession(userId, groupId);
    if (!session) return null;
    
    return {
      type: session.type,
      currentField: session.currentField,
      data: { ...session.data }
    };
  }
  
  // 全セッション数取得（デバッグ用）
  getActiveSessionCount(): number {
    return this.sessions.size;
  }
  
  // 古いセッションのクリーンアップ
  cleanup(): void {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30分
    
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(key);
        console.log(`🧹 Cleaned up expired session: ${key}`);
      }
    }
  }
}

// シングルトンインスタンス
const sessionManager = new SessionManager();

// 定期クリーンアップ（5分間隔）
setInterval(() => {
  sessionManager.cleanup();
}, 5 * 60 * 1000);

export default sessionManager;