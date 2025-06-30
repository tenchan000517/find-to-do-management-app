了解しました。Neonの制限を考慮した効率的なデータベース設計を提案します。

## テーブル設計案

### 1. 日次サマリーテーブル（メイン）
```sql
-- discord_daily_summary
CREATE TABLE discord_daily_summary (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    
    -- 運営活動指標
    total_messages INTEGER DEFAULT 0,
    total_threads_created INTEGER DEFAULT 0,
    total_reactions INTEGER DEFAULT 0,
    total_voice_minutes INTEGER DEFAULT 0,
    
    -- メンバー指標  
    active_members INTEGER DEFAULT 0,  -- その日投稿したメンバー数
    new_joins INTEGER DEFAULT 0,
    leaves INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    total_mentions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, guild_id)
);
```

### 2. チャンネル別日次統計
```sql
-- discord_channel_daily_stats
CREATE TABLE discord_channel_daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    channel_id VARCHAR(20) NOT NULL,
    channel_name VARCHAR(255),
    
    message_count INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    threads_created INTEGER DEFAULT 0,
    reactions_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, guild_id, channel_id)
);
```

### 3. ユーザー別日次統計
```sql
-- discord_user_daily_stats  
CREATE TABLE discord_user_daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    username VARCHAR(255),
    
    message_count INTEGER DEFAULT 0,
    reactions_given INTEGER DEFAULT 0,
    reactions_received INTEGER DEFAULT 0,
    mentions_given INTEGER DEFAULT 0,
    mentions_received INTEGER DEFAULT 0,
    voice_minutes INTEGER DEFAULT 0,
    threads_created INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, guild_id, user_id)
);
```

### 4. リアルタイムイベント記録
```sql
-- discord_realtime_events
CREATE TABLE discord_realtime_events (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20),
    event_type VARCHAR(50) NOT NULL, -- 'voice_join', 'voice_leave', 'member_join', 'member_leave'
    channel_id VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- 追加データ用JSON
    metadata JSONB
);
```

## データ保存戦略

### リアルタイム処理
- ボイス接続/切断イベント → `discord_realtime_events`に即座に記録
- メンバー参加/退出 → `discord_realtime_events`に即座に記録

### 日次バッチ処理（毎日0:00実行）
1. **メッセージデータ収集**: 前日のメッセージを一括取得
2. **リアルタイムデータ集計**: `discord_realtime_events`から前日分を集計
3. **サマリー保存**: 各テーブルに日次データを保存
4. **古いイベントデータ削除**: 集計済みの`discord_realtime_events`を削除

## Neon制限対策
- **書き込み最小化**: 1日1回のバッチ処理でまとめて保存
- **インデックス最適化**: 日付とguild_idでのクエリを高速化
- **古いデータ削除**: 定期的にアーカイブして容量削減

この設計で進めますか？既存テーブルとの整合性も確認して調整できます。