#!/bin/bash

# Smart Display - ローカル並列開発スクリプト
# 複数のターミナルで異なるタスクを並列実行

echo "🚀 Smart Display - ローカル並列開発セットアップ"
echo "================================================"

# 汎用的なテンプレートタスク（参考用）
declare -A TEMPLATE_TASKS=(
    ["frontend"]="フロントエンド機能開発"
    ["backend"]="バックエンド機能開発"
    ["fullstack"]="フルスタック機能開発"
    ["bugfix"]="バグ修正"
    ["refactor"]="リファクタリング"
    ["test"]="テスト追加・改善"
    ["docs"]="ドキュメント更新"
    ["config"]="設定・環境整備"
)

# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)
echo "現在のブランチ: $CURRENT_BRANCH"

# 使用方法を表示
show_usage() {
    echo ""
    echo "使用方法:"
    echo "  ./scripts/start-parallel-dev.sh                # インタラクティブモード"
    echo "  ./scripts/start-parallel-dev.sh custom         # カスタムタスク作成"
    echo "  ./scripts/start-parallel-dev.sh template <type> # テンプレートタスク実行"
    echo ""
    echo "テンプレートタイプ（参考用）:"
    for key in "${!TEMPLATE_TASKS[@]}"; do
        echo "  $key: ${TEMPLATE_TASKS[$key]}"
    done
    echo ""
    echo "💡 推奨: 具体的なプロンプトを入力できるカスタムタスクを使用"
}

# カスタムタスクを作成
create_custom_task() {
    echo ""
    echo "🎨 カスタムタスク作成"
    echo "===================="
    
    echo -n "タスク名 (英数字とハイフンのみ): "
    read -r task_id
    
    # タスクIDの検証
    if [[ ! "$task_id" =~ ^[a-zA-Z0-9-]+$ ]]; then
        echo "❌ 無効なタスク名です。英数字とハイフンのみ使用してください。"
        return 1
    fi
    
    echo -n "タスクの説明: "
    read -r task_description
    
    echo ""
    echo "📝 Claude Code に送信するプロンプトを入力してください:"
    echo "（複数行入力可能。完了したら空行でEnterを押してください）"
    echo "----------------------------------------"
    
    # マルチラインプロンプト入力
    custom_prompt=""
    while IFS= read -r line; do
        if [[ -z "$line" && -n "$custom_prompt" ]]; then
            break
        fi
        if [[ -n "$custom_prompt" ]]; then
            custom_prompt="$custom_prompt
$line"
        else
            custom_prompt="$line"
        fi
    done
    
    if [[ -z "$custom_prompt" ]]; then
        echo "❌ プロンプトが入力されていません。"
        return 1
    fi
    
    echo ""
    echo "📋 作成するタスク情報:"
    echo "ID: $task_id"
    echo "説明: $task_description"
    echo "プロンプト:"
    echo "----------------------------------------"
    echo "$custom_prompt"
    echo "----------------------------------------"
    echo ""
    echo -n "このタスクを実行しますか? (y/n): "
    read -r confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        execute_task "$task_id" "$task_description" "$custom_prompt"
    else
        echo "タスク作成をキャンセルしました。"
    fi
}

# タスクを実行
execute_task() {
    local task_id="$1"
    local task_description="$2"
    local task_prompt="$3"
    
    echo ""
    echo "🔧 タスク実行: $task_id - $task_description"
    
    # ブランチ名を生成
    BRANCH_NAME="feature/${task_id}-$(date +%Y%m%d-%H%M%S)"
    
    # ブランチを作成
    echo "ブランチ作成中: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"
    git push -u origin "$BRANCH_NAME"
    
    # 元のブランチに戻る
    git checkout "$CURRENT_BRANCH"
    
    # 共通ルールを読み込み
    COMMON_RULES_FILE="$(dirname "$0")/common-rules.txt"
    if [ -f "$COMMON_RULES_FILE" ]; then
        common_rules=$(cat "$COMMON_RULES_FILE")
    else
        common_rules="# 共通ルールファイルが見つかりません"
    fi
    
    # 完全なプロンプトを構築
    full_prompt="$common_rules

========================================
以下のタスクを実行してください:

$task_prompt
========================================

上記の共通ルールを必ず遵守し、特に以下を確実に実行してください：
1. ultrathink で作業を計画
2. 既存コードの調査とスタイル統一
3. TypeScript型安全性の確保
4. 作業完了後のlint・typecheck実行"
    
    # プロンプトをエスケープ
    escaped_prompt=$(printf '%s\n' "$full_prompt" | sed 's/"/\\"/g' | sed 's/$/\\n/' | tr -d '\n')
    
    # 新しいターミナルでタスクを開始
    case "$OSTYPE" in
        "darwin"*)
            # macOS
            osascript -e "
            tell application \"Terminal\"
                do script \"cd '$(pwd)' && git checkout $BRANCH_NAME && echo '🚀 タスク開始: $task_description' && echo 'ブランチ: $BRANCH_NAME' && echo '' && echo 'プロンプト:' && echo '$escaped_prompt' && echo '' && claude code\"
            end tell"
            ;;
        "linux-gnu"*)
            # Linux
            if command -v gnome-terminal &> /dev/null; then
                gnome-terminal --tab --title="Task: $task_id" -- bash -c "cd '$(pwd)' && git checkout $BRANCH_NAME && echo '🚀 タスク開始: $task_description' && echo 'ブランチ: $BRANCH_NAME' && echo '' && echo 'プロンプト:' && echo '$escaped_prompt' && echo '' && claude code && bash"
            elif command -v konsole &> /dev/null; then
                konsole --new-tab --title="Task: $task_id" -e bash -c "cd '$(pwd)' && git checkout $BRANCH_NAME && echo '🚀 タスク開始: $task_description' && echo 'ブランチ: $BRANCH_NAME' && echo '' && echo 'プロンプト:' && echo '$escaped_prompt' && echo '' && claude code && bash"
            else
                echo "サポートされているターミナルが見つかりません。手動で新しいターミナルを開いてください。"
                echo "コマンド: cd '$(pwd)' && git checkout $BRANCH_NAME && claude code"
                echo "プロンプト: $task_prompt"
            fi
            ;;
        *)
            echo "サポートされていないOS: $OSTYPE"
            echo "手動で新しいターミナルを開いてください。"
            echo "コマンド: cd '$(pwd)' && git checkout $BRANCH_NAME && claude code"
            echo "プロンプト: $task_prompt"
            ;;
    esac
    
    echo "✅ ブランチ作成完了: $BRANCH_NAME"
    sleep 1
}

# インタラクティブモード
interactive_mode() {
    echo ""
    echo "🎯 インタラクティブモード"
    echo "========================"
    
    CUSTOM_TASKS=()
    
    echo "カスタムタスクを作成してください (複数可):"
    echo ""
    
    while true; do
        echo -n "新しいタスクを追加しますか? (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo ""
            echo -n "タスクID (英数字とハイフンのみ): "
            read -r custom_id
            
            # タスクIDの検証
            if [[ ! "$custom_id" =~ ^[a-zA-Z0-9-]+$ ]]; then
                echo "❌ 無効なタスク名です。英数字とハイフンのみ使用してください。"
                continue
            fi
            
            echo -n "タスク説明: "
            read -r custom_desc
            echo "プロンプト (複数行可、空行でEnter):"
            
            custom_prompt=""
            while IFS= read -r line; do
                if [[ -z "$line" && -n "$custom_prompt" ]]; then
                    break
                fi
                if [[ -n "$custom_prompt" ]]; then
                    custom_prompt="$custom_prompt
$line"
                else
                    custom_prompt="$line"
                fi
            done
            
            if [[ -n "$custom_prompt" ]]; then
                CUSTOM_TASKS+=("$custom_id|$custom_desc|$custom_prompt")
                echo "✅ タスク追加: $custom_id"
            else
                echo "❌ プロンプトが空のため、タスクをスキップしました。"
            fi
        else
            break
        fi
    done
    
    # タスク実行
    if [ ${#CUSTOM_TASKS[@]} -eq 0 ]; then
        echo "タスクが選択されていません。終了します。"
        exit 1
    fi
    
    echo ""
    echo "🚀 作成されたタスクを実行します..."
    
    # カスタムタスクを実行
    for task_data in "${CUSTOM_TASKS[@]}"; do
        IFS='|' read -r task_id task_desc task_prompt <<< "$task_data"
        execute_task "$task_id" "$task_desc" "$task_prompt"
    done
}

# メイン処理
if [ $# -eq 0 ]; then
    # 引数なし: インタラクティブモード
    show_usage
    interactive_mode
elif [ "$1" = "custom" ]; then
    # カスタムタスク作成
    create_custom_task
elif [ "$1" = "template" ] && [ -n "$2" ]; then
    # テンプレートタスク実行
    template_type="$2"
    if [[ -n "${TEMPLATE_TASKS[$template_type]}" ]]; then
        echo ""
        echo "🎨 テンプレートタスク: ${TEMPLATE_TASKS[$template_type]}"
        echo "プロンプトを入力してください (複数行可、空行でEnter):"
        
        template_prompt=""
        while IFS= read -r line; do
            if [[ -z "$line" && -n "$template_prompt" ]]; then
                break
            fi
            if [[ -n "$template_prompt" ]]; then
                template_prompt="$template_prompt
$line"
            else
                template_prompt="$line"
            fi
        done
        
        if [[ -n "$template_prompt" ]]; then
            execute_task "$template_type" "${TEMPLATE_TASKS[$template_type]}" "$template_prompt"
        else
            echo "❌ プロンプトが入力されていません。"
        fi
    else
        echo "❌ 不明なテンプレートタイプ: $template_type"
        echo "利用可能なテンプレート: ${!TEMPLATE_TASKS[*]}"
    fi
elif [ "$1" = "help" ] || [ "$1" = "--help" ]; then
    # ヘルプ表示
    show_usage
else
    echo "❌ 不明なコマンド: $1"
    show_usage
fi

echo ""
echo "🎉 並列開発セットアップ完了！"
echo "各ターミナルでタスクを実行してください。"
echo ""
echo "💡 ヒント:"
echo "  - 各ブランチで独立して作業"
echo "  - 完了後は PR を作成"
echo "  - 競合を避けるため、異なるファイル/機能を担当"