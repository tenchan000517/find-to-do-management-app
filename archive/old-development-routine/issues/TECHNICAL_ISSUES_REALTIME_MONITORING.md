# 🚨 技術課題: リアルタイム監視機能の実装ギャップ

**発見日**: 2025年6月29日  
**課題種別**: 機能実装不備  
**影響度**: Medium（マニュアルと実装の乖離）  
**緊急度**: Low（代替手段あり）

---

## 📋 課題概要

マニュアルに記載された「リアルタイム監視システム」と実際の実装に大きなギャップが存在。Vercelのサーバーレス環境制約により、一部機能が動作していない状況。

---

## 🔍 詳細分析結果

### **動作している機能 ✅**

#### 1. LINE Bot連携（完全動作）
**実装場所:**
- `/src/app/api/webhook/line/route.ts` - LINE Webhook
- `/src/lib/line/notification.ts` - プッシュ通知
- `/src/lib/services/notification-service.ts` - 通知サービス

**動作状況:** ✅ 真のリアルタイム通信が可能

#### 2. HTTPポーリングシステム（30秒間隔）
**実装場所:**
- `/src/components/RealTimeDashboard.tsx` - フロントエンド
- `/src/app/api/realtime/metrics/route.ts` - メトリクス取得
- `/src/app/api/realtime/events/route.ts` - イベント取得

**動作状況:** ✅ 30秒間隔でのデータ更新が動作

---

### **実装済みだが動作しない機能 ❌**

#### 1. WebSocketサーバー
**クライアント実装場所:**
```javascript
// /src/components/RealTimeDashboard.tsx (行60-120)
const ws = new WebSocket(`wss://${window.location.host}/ws`);
// 接続処理、再接続ロジック、ping/pong実装済み
```

**問題:** 対応するWebSocketサーバー実装が存在しない
**症状:** クライアントは接続を試行するが常に失敗し、ポーリングにフォールバック

#### 2. バックグラウンドジョブスケジューラー
**実装場所:**
```javascript
// /src/lib/jobs/alert-scheduler.ts
if (process.env.NODE_ENV === 'development') {
  // 4時間ごとのアラートチェック
  setInterval(alertCheck, 4 * 60 * 60 * 1000);
  
  // 1時間ごとの通知処理
  setInterval(notifications, 60 * 60 * 1000);
  
  // 30分ごとのリマインダー
  setInterval(reminders, 30 * 60 * 1000);
}
```

**問題:** 開発環境でのみ動作、本番環境（Vercel）では無効
**制御API:** `/src/app/api/alerts/scheduler/route.ts` （手動実行可能）

---

### **未実装の機能 ❌**

#### 1. データベーストリガー
**現状:** PostgreSQL側にchange notificationトリガーなし
**影響:** データ変更の即座検知ができない

#### 2. プッシュ通知システム
**現状:** Service Worker実装済みだが、プッシュ通知機能なし
**場所:** `/public/sw.js` - オフラインキャッシュのみ

#### 3. Vercel Cron Jobs
**現状:** `vercel.json`にcron設定なし
**影響:** 定期実行タスクが動作しない

---

## 🛠️ 実装可能な解決策

### **Option 1: Vercel Cron Jobs**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/monitoring/health-check",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/alerts/process",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### **Option 2: GitHub Actions Workflow**
```yaml
# .github/workflows/monitoring.yml
name: Monitoring Tasks
on:
  schedule:
    - cron: '0 */4 * * *'  # 4時間ごと
jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Call Monitoring API
        run: |
          curl -X POST ${{ secrets.MONITORING_WEBHOOK_URL }} \
            -H "Authorization: Bearer ${{ secrets.API_TOKEN }}"
```

### **Option 3: Google Apps Script (GAS) + 時間ドリブントリガー**
```javascript
// GAS Script
function triggerMonitoring() {
  const response = UrlFetchApp.fetch('https://your-app.vercel.app/api/alerts/scheduler', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    payload: JSON.stringify({ action: 'run_manual' })
  });
}

// 時間ドリブントリガー設定: 4時間ごと実行
```

### **Option 4: Database Triggers + Webhook**
```sql
-- PostgreSQL Trigger例
CREATE OR REPLACE FUNCTION notify_line_webhook()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('data_change', 
    json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 重要テーブルにトリガー設定
CREATE TRIGGER task_notification_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_line_webhook();
```

---

## 📁 関連ファイル一覧

### **Frontend実装**
```
/src/components/RealTimeDashboard.tsx      # WebSocketクライアント（動作せず）
/src/components/SmartDashboard.tsx         # ダッシュボードUI
/public/sw.js                              # Service Worker（プッシュ通知なし）
```

### **Backend API**
```
/src/app/api/realtime/metrics/route.ts     # メトリクス取得（動作中）
/src/app/api/realtime/events/route.ts      # イベント取得（動作中）
/src/app/api/alerts/scheduler/route.ts     # 手動実行API（動作中）
/src/app/api/webhook/line/route.ts         # LINE Webhook（動作中）
```

### **Services & Utils**
```
/src/lib/jobs/alert-scheduler.ts           # バックグラウンドジョブ（開発のみ）
/src/lib/line/notification.ts              # LINE通知（動作中）
/src/lib/services/notification-service.ts  # 通知サービス（動作中）
```

### **Configuration**
```
vercel.json                                # Cron Jobs未設定
.github/workflows/                         # GitHub Actions未設定
```

---

## 🎯 推奨実装順序

### **Phase 1: 即座対応（1-2時間）**
1. **マニュアル修正**: リアルタイム監視の実際の動作を正確記載
2. **Vercel Cron Jobs設定**: 最も簡単で確実な解決策

### **Phase 2: 中期対応（1-2日）**
1. **Database Triggers実装**: データ変更の即座検知
2. **WebSocket代替**: Server-Sent Events実装

### **Phase 3: 長期改善（1週間）**
1. **プッシュ通知システム**: ブラウザプッシュ通知
2. **WebSocketサーバー**: 真のリアルタイム通信（別サービス検討）

---

## 🔗 参考技術資料

### **Vercel Documentation**
- [Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Serverless Functions Limits](https://vercel.com/docs/functions/serverless-functions/runtimes#limits)

### **Alternative Solutions**
- [GitHub Actions Scheduling](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Google Apps Script Triggers](https://developers.google.com/apps-script/guides/triggers/installable)
- [PostgreSQL LISTEN/NOTIFY](https://www.postgresql.org/docs/current/sql-notify.html)

---

## 📞 Next Actions

1. **Issue Tracking**: GitHubにIssueとして登録
2. **Priority Discussion**: チームでの実装優先度検討
3. **Technical Spike**: 各解決策のPoCおよび工数見積もり
4. **Documentation Update**: マニュアルの現実反映

---

**作成者**: Claude Code Assistant  
**最終更新**: 2025年6月29日  
**ステータス**: 調査完了・対応待ち