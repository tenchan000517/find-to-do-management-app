# 📚 ドキュメント整理システム

**作成日**: 2025-06-16
**目的**: プロジェクト文書の効率的な管理と参照

---

## 📁 ディレクトリ構造

```
documentation/
├── README.md                    # このファイル
├── active/                      # 【A】参照必須（現在も活用）
│   ├── current/                 # 現在の開発状況
│   │   └── PROJECT_PROGRESS_REPORT.md
│   ├── troubleshooting/         # トラブルシューティング
│   │   └── PHASE9-10_TYPESCRIPT_FIX_REPORT.md
│   └── design/                  # 次期開発設計（将来使用）
├── completed/                   # 【B】完了済み（参照のみ）
│   ├── calendar/                # カレンダー機能実装完了
│   │   ├── CALENDAR_IMPLEMENTATION_PROMPT.md
│   │   ├── CALENDAR_REQUIREMENTS_DISCUSSION_PROMPT.md
│   │   ├── CALENDAR_SYSTEM_FIXES_REQUIRED.md
│   │   └── CALENDAR_URGENT_FIXES_PROMPT.md
│   ├── personal-schedules/      # 個人予定管理実装完了
│   │   ├── PERSONAL_SCHEDULES_IMPLEMENTATION_GUIDE.md
│   │   └── PERSONAL_SCHEDULES_SYSTEM_SPECIFICATION.md
│   └── implementation/          # その他実装完了
│       ├── DATABASE_STRUCTURE_SPECIFICATION.md
│       ├── DISCORD_*.md         # Discord機能
│       ├── LINE_*.md           # LINE Bot機能
│       └── IMPLEMENTATION_*.md  # 各種実装ガイド
└── archive/                     # 【C】アーカイブ（歴史的記録）
    ├── initial/                 # 初期開発文書
    │   ├── 要件定義書.md
    │   ├── REQUIREMENTS_V2.md
    │   └── プロジェクト中心型AIアシスタント付き*.md
    ├── progress-reports/        # 過去の進捗報告
    │   ├── PROGRESS_REPORT_V1.md
    │   ├── PROGRESS_REPORT_V2.md
    │   └── TASK_MANAGEMENT_*.md
    └── old-prompts/            # 過去の実装プロンプト
        ├── NEXT_ENGINEER_PROMPT*.md
        ├── UI_IMPROVEMENT_PLAN.md
        └── PHASE9-10_OPTIMIZATION_*.md
```

---

## 🎯 使用方法

### 新しいClaude Codeセッション開始時
1. **メインプロンプト**: `DEVELOPMENT_PROMPT.md` を最初に読む
2. **現在状況確認**: `active/current/PROJECT_PROGRESS_REPORT.md` で最新進捗を把握
3. **問題発生時**: `active/troubleshooting/` でエラー解決法を確認

### 実装完了時の文書移動
- 新機能実装完了 → `completed/` 該当カテゴリに移動
- 古くなったプロンプト → `archive/old-prompts/` に移動
- 進捗報告完了 → `archive/progress-reports/` に移動

### カテゴリ判断基準
- **Active**: 現在も定期的に参照・更新する文書
- **Completed**: 実装完了済みで、参照のみ行う文書  
- **Archive**: 歴史的価値はあるが、日常的な参照は不要な文書

---

## 🔗 参照先

**メイン開発プロンプト**: `../DEVELOPMENT_PROMPT.md`
**技術文書**: `../docs/` (既存のdocsディレクトリは技術仕様として維持)

---

**注意**: このディレクトリ構造により、情報の欠損なく効率的な文書管理を実現しています。