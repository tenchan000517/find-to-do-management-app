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
  savedToDb?: boolean; // データベース保存済みフラグ
  dbRecordId?: string; // 保存されたレコードID
  isMenuSession?: boolean; // メニューセッション状態
  menuTimeout?: number; // メニューセッション自動終了時刻
}

class SessionManager {
  private sessions: Map<string, InputSession> = new Map();
  
  // セッション開始（既存データを保持）
  startSession(userId: string, groupId: string | undefined, type: string): void {
    const sessionKey = this.getSessionKey(userId, groupId);
    const existingSession = this.sessions.get(sessionKey);
    
    // 既存セッションがある場合はデータを引き継ぐ
    const session: InputSession = {
      userId,
      groupId,
      type,
      data: existingSession?.data || {},  // 既存データを保持
      startTime: existingSession?.startTime || Date.now(),
      lastActivity: Date.now(),
      isMenuSession: false // 通常セッション
    };
    
    this.sessions.set(sessionKey, session);
    console.log(`📝 Session ${existingSession ? 'resumed' : 'started'} for ${sessionKey}: ${type}`, 
                existingSession ? `with existing data: ${JSON.stringify(session.data)}` : '');
  }

  // メニューセッション開始（2分タイムアウト）
  startMenuSession(userId: string, groupId: string | undefined): void {
    const sessionKey = this.getSessionKey(userId, groupId);
    const now = Date.now();
    
    const session: InputSession = {
      userId,
      groupId,
      type: 'menu',
      data: {},
      startTime: now,
      lastActivity: now,
      isMenuSession: true,
      menuTimeout: now + (2 * 60 * 1000) // 2分後にタイムアウト
    };
    
    this.sessions.set(sessionKey, session);
    console.log(`📋 Menu session started for ${sessionKey} with 2min timeout`);
  }
  
  // セッション再開専用メソッド（明示的にデータ引き継ぎ）
  resumeSession(userId: string, groupId: string | undefined, type: string): boolean {
    const sessionKey = this.getSessionKey(userId, groupId);
    const existingSession = this.sessions.get(sessionKey);
    
    if (existingSession) {
      // 既存セッションのタイプを更新し、データを保持
      existingSession.type = type;
      existingSession.lastActivity = Date.now();
      existingSession.currentField = undefined; // 入力フィールドをリセット
      
      console.log(`🔄 Session resumed for ${sessionKey}: ${type} with data:`, existingSession.data);
      return true;
    } else {
      console.log(`⚠️ No existing session found for ${sessionKey}, starting new session`);
      this.startSession(userId, groupId, type);
      return false;
    }
  }
  
  // セッション取得
  getSession(userId: string, groupId: string | undefined): InputSession | null {
    const sessionKey = this.getSessionKey(userId, groupId);
    const session = this.sessions.get(sessionKey);
    
    if (session) {
      const now = Date.now();
      
      // メニューセッションのタイムアウトチェック（2分）
      if (session.isMenuSession && session.menuTimeout && now > session.menuTimeout) {
        console.log(`⏰ Menu session timeout for ${sessionKey}`);
        this.endSession(userId, groupId);
        return null;
      }
      
      // 通常セッション：30分でタイムアウト
      if (!session.isMenuSession && now - session.lastActivity > 30 * 60 * 1000) {
        console.log(`⏰ Regular session timeout for ${sessionKey}`);
        this.endSession(userId, groupId);
        return null;
      }
      
      // 最終活動時刻更新
      session.lastActivity = now;
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
  getSessionInfo(userId: string, groupId: string | undefined): { type: string; currentField?: string; data: Record<string, any>; savedToDb?: boolean; dbRecordId?: string; isMenuSession?: boolean } | null {
    const session = this.getSession(userId, groupId);
    if (!session) return null;
    
    return {
      type: session.type,
      currentField: session.currentField,
      data: { ...session.data },
      savedToDb: session.savedToDb,
      dbRecordId: session.dbRecordId,
      isMenuSession: session.isMenuSession
    };
  }

  // メニューセッション状態確認
  isMenuSession(userId: string, groupId: string | undefined): boolean {
    const session = this.getSession(userId, groupId);
    return session?.isMenuSession === true;
  }

  // メニューセッション→通常セッション変換
  convertToDataSession(userId: string, groupId: string | undefined, type: string): void {
    const session = this.getSession(userId, groupId);
    if (session && session.isMenuSession) {
      session.type = type;
      session.isMenuSession = false;
      session.menuTimeout = undefined;
      console.log(`🔄 Menu session converted to data session: ${type} for ${this.getSessionKey(userId, groupId)}`);
    }
  }

  // データベース保存済みマーク
  markAsSaved(userId: string, groupId: string | undefined, recordId: string): void {
    const session = this.getSession(userId, groupId);
    if (session) {
      session.savedToDb = true;
      session.dbRecordId = recordId;
      console.log(`✅ Session marked as saved for ${this.getSessionKey(userId, groupId)}: ${recordId}`);
    }
  }

  // 保存済み状態確認
  isSavedToDb(userId: string, groupId: string | undefined): boolean {
    const session = this.getSession(userId, groupId);
    return session?.savedToDb === true;
  }
  
  // 全セッション数取得（デバッグ用）
  getActiveSessionCount(): number {
    return this.sessions.size;
  }
  
  // セッション詳細取得（デバッグ用）
  getSessionDetails(userId: string, groupId: string | undefined): any {
    const sessionKey = this.getSessionKey(userId, groupId);
    const session = this.sessions.get(sessionKey);
    
    if (!session) {
      return { status: 'no_session', sessionKey };
    }
    
    return {
      status: 'active',
      sessionKey,
      type: session.type,
      dataKeys: Object.keys(session.data),
      dataCount: Object.keys(session.data).length,
      currentField: session.currentField,
      startTime: new Date(session.startTime).toISOString(),
      lastActivity: new Date(session.lastActivity).toISOString(),
      age: Date.now() - session.startTime,
      data: session.data
    };
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