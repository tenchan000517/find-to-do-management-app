# 汎用開発ルール（要点版）

**責任者**: CTO Level  
**目的**: Claude Code リフレッシュ時の必須ルール（簡潔版）

---

## ⚡ チェック作業の重複回避ルール

### **基本原則**
```
引き継ぎ前: 全チェック実行・結果記録・HANDOVER.mdに記載
引き継ぎ後: HANDOVER.mdの結果確認のみ（再実行禁止）
```

### **判断基準**
```
Errors: 必須修正（作業停止）
Warnings: 無視可能（継続可能）
```

---

## 🔄 リフレッシュ時標準プロトコル

### **必須読み込み（順序厳守）**
```bash
1. CLAUDE.md
2. dev/rules/DEV_RULES.md
3. dev/rules/PROJECT_SPECIFIC_RULES.md
4. dev/phases/current/PHASE_PLAN.md
5. dev/phases/current/PROGRESS_REPORT.md
6. dev/phases/current/HANDOVER.md
7. TodoRead
```

### **復帰時間目標**: 5分以内

---

## 🔄 作業フロー（要点）

### **新機能実装前**
```bash
# 重複防止の必須確認
rg "interface|type|enum" src/ | grep -i "機能名"
rg "status|Status" src/ | grep -E "(=|:)"
```

### **作業完了後**
```bash
1. TodoWrite でステータス更新
2. PROGRESS_REPORT.md 更新
3. 関連ドキュメント更新（必須）
4. [TYPE_CHECK] && [LINT_CHECK]
```

---

## 📝 ドキュメント更新義務

### **実装完了の定義**
```
実装完了 = コード完成 + ドキュメント更新完了（同時必須）
```

---

**詳細ルール**: reference/DEVELOPMENT_FLOW_PROCEDURES.md 参照  
**管理責任者**: CTO Level