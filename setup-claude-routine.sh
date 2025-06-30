#!/bin/bash

# Claude Code 開発ルーティーン セットアップスクリプト
# 目的: 新しい環境で開発ルーティーンを一発セットアップ
# 作成日: 2025年6月30日

set -e  # エラー時に停止

echo "🚀 Claude Code 開発ルーティーン セットアップ開始"
echo "=================================================="

# 1. 必須ディレクトリ作成
echo "📁 必須ディレクトリ作成中..."
mkdir -p phases/current
mkdir -p phases/completed  
mkdir -p phases/planned
mkdir -p reference
mkdir -p issues
mkdir -p temp
mkdir -p active

# 2. 必須ファイルの存在確認
echo "📋 必須ファイル確認中..."
required_files=(
    "CLAUDE.md"
    "DEV_RULES.md" 
    "PROJECT_SPECIFIC_RULES.md"
    "CLAUDE_CODE_REFRESH_PROMPT.md"
    "CLAUDE_CODE_NEW_PROJECT_PROMPT.md"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ 以下の必須ファイルが見つかりません:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo "これらのファイルを配置してから再実行してください。"
    exit 1
fi

# 3. Reference ディレクトリの確認・作成
echo "📚 Reference ディレクトリ構造確認中..."
reference_files=(
    "reference/DEV_RULES.md"
    "reference/PROJECT_SPECIFIC_RULES.md"
    "reference/DEVELOPMENT_FLOW_PROCEDURES.md"
    "reference/DOCUMENT_FORMATS.md"
    "reference/ISSUE_MANAGEMENT_AND_DOC_AUTOMATION.md"
)

missing_ref_files=()
for file in "${reference_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_ref_files+=("$file")
    fi
done

if [ ${#missing_ref_files[@]} -ne 0 ]; then
    echo "⚠️  以下のreferenceファイルが見つかりません:"
    for file in "${missing_ref_files[@]}"; do
        echo "   - $file"
    done
    echo "詳細ドキュメントが必要な場合は手動で配置してください。"
fi

# 4. .gitignoreに一時ディレクトリを追加
echo "🔧 .gitignore設定中..."
if [ -f ".gitignore" ]; then
    # temp/, active/ がまだ追加されていない場合のみ追加
    if ! grep -q "^temp/$" .gitignore; then
        echo "temp/" >> .gitignore
    fi
    if ! grep -q "^active/$" .gitignore; then
        echo "active/" >> .gitignore
    fi
    echo "✅ .gitignore更新完了"
else
    # .gitignoreが存在しない場合は作成
    cat > .gitignore << EOF
# Claude Code 開発ルーティーン用一時ディレクトリ
temp/
active/

# HANDOVER.mdは一時ファイルなので除外
phases/current/HANDOVER.md
EOF
    echo "✅ .gitignore作成完了"
fi

# 5. 初期設定完了の確認
echo "🔍 セットアップ状況確認中..."

echo ""
echo "📊 セットアップ結果:"
echo "=================="
echo "✅ 必須ディレクトリ: 作成完了"
echo "✅ 必須ファイル: ${#required_files[@]}個確認済み"
echo "📚 Referenceファイル: $((${#reference_files[@]} - ${#missing_ref_files[@]}))/${#reference_files[@]}個存在"
echo "✅ .gitignore: 設定完了"

# 6. 次のステップガイド
echo ""
echo "🎯 次のステップ:"
echo "==============="
echo "1. 新しいプロジェクト開始の場合:"
echo "   → CLAUDE_CODE_NEW_PROJECT_PROMPT.md のプロンプトを使用"
echo ""
echo "2. 既存プロジェクト継続の場合:"
echo "   → CLAUDE_CODE_REFRESH_PROMPT.md のプロンプトを使用"
echo ""
echo "3. フェーズ管理を開始する場合:"
echo "   → phases/current/ に PHASE_PLAN.md と PROGRESS_REPORT.md を作成"

# 7. ファイル構成表示
echo ""
echo "📁 作成されたディレクトリ構造:"
echo "=============================="
tree -a -I '.git' . 2>/dev/null || ls -la

echo ""
echo "🎉 Claude Code 開発ルーティーン セットアップ完了！"
echo "======================================================"