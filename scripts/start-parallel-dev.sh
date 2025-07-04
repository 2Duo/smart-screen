#!/bin/bash

# Smart Display - ローカル並列開発スクリプト
# 複数のターミナルで異なるタスクを並列実行

echo "🚀 Smart Display - ローカル並列開発セットアップ"
echo "================================================"

# 利用可能なタスク
declare -A TASKS=(
    ["weather"]="天気情報API統合"
    ["socket"]="Socket.io リアルタイム通信"
    ["responsive"]="レスポンシブデザイン"
    ["testing"]="テストフレームワーク設定"
    ["widgets"]="新しいウィジェット追加"
    ["ui"]="UIコンポーネント改善"
    ["backend"]="バックエンドAPI拡張"
    ["deploy"]="デプロイメント設定"
)

# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)
echo "現在のブランチ: $CURRENT_BRANCH"

# 利用可能なタスクを表示
echo ""
echo "利用可能なタスク:"
for key in "${!TASKS[@]}"; do
    echo "  $key: ${TASKS[$key]}"
done

echo ""
echo "使用方法:"
echo "  ./scripts/start-parallel-dev.sh <task1> <task2> ..."
echo "  例: ./scripts/start-parallel-dev.sh weather socket responsive"

# 引数がない場合、インタラクティブモードで開始
if [ $# -eq 0 ]; then
    echo ""
    echo "インタラクティブモード - 実行したいタスクを選択してください:"
    
    # タスク選択
    SELECTED_TASKS=()
    echo "タスクを選択 (複数可、完了したらEnter):"
    for key in "${!TASKS[@]}"; do
        echo -n "$key を追加しますか? (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            SELECTED_TASKS+=("$key")
        fi
    done
    
    if [ ${#SELECTED_TASKS[@]} -eq 0 ]; then
        echo "タスクが選択されていません。終了します。"
        exit 1
    fi
    
    set -- "${SELECTED_TASKS[@]}"
fi

# 各タスクに対してブランチを作成し、新しいターミナルを開く
for task in "$@"; do
    if [[ -n "${TASKS[$task]}" ]]; then
        echo ""
        echo "🔧 タスク設定: $task - ${TASKS[$task]}"
        
        # ブランチ名を生成
        BRANCH_NAME="feature/${task}-$(date +%Y%m%d-%H%M%S)"
        
        # ブランチを作成
        git checkout -b "$BRANCH_NAME"
        git push -u origin "$BRANCH_NAME"
        
        # 元のブランチに戻る
        git checkout "$CURRENT_BRANCH"
        
        # 新しいターミナルでタスクを開始
        case "$OSTYPE" in
            "darwin"*)
                # macOS
                osascript -e "
                tell application \"Terminal\"
                    do script \"cd '$(pwd)' && git checkout $BRANCH_NAME && echo '🚀 タスク開始: ${TASKS[$task]}' && echo 'ブランチ: $BRANCH_NAME' && echo '' && claude code --task '${TASKS[$task]}を実装してください。以下のプロジェクト構造を参考に、既存のコードスタイルに合わせて実装してください。' --target-files '$(pwd)'\"
                end tell"
                ;;
            "linux-gnu"*)
                # Linux
                if command -v gnome-terminal &> /dev/null; then
                    gnome-terminal --tab --title="Task: $task" -- bash -c "cd '$(pwd)' && git checkout $BRANCH_NAME && echo '🚀 タスク開始: ${TASKS[$task]}' && echo 'ブランチ: $BRANCH_NAME' && echo '' && claude code --task '${TASKS[$task]}を実装してください。' --target-files '$(pwd)' && bash"
                elif command -v konsole &> /dev/null; then
                    konsole --new-tab --title="Task: $task" -e bash -c "cd '$(pwd)' && git checkout $BRANCH_NAME && echo '🚀 タスク開始: ${TASKS[$task]}' && echo 'ブランチ: $BRANCH_NAME' && echo '' && claude code --task '${TASKS[$task]}を実装してください。' --target-files '$(pwd)' && bash"
                else
                    echo "サポートされているターミナルが見つかりません。手動で新しいターミナルを開いてください。"
                    echo "コマンド: cd '$(pwd)' && git checkout $BRANCH_NAME && claude code"
                fi
                ;;
            *)
                echo "サポートされていないOS: $OSTYPE"
                echo "手動で新しいターミナルを開いてください。"
                echo "コマンド: cd '$(pwd)' && git checkout $BRANCH_NAME && claude code"
                ;;
        esac
        
        echo "✅ ブランチ作成完了: $BRANCH_NAME"
        sleep 1
    else
        echo "❌ 不明なタスク: $task"
        echo "利用可能なタスク: ${!TASKS[*]}"
    fi
done

echo ""
echo "🎉 並列開発セットアップ完了！"
echo "各ターミナルでタスクを実行してください。"
echo ""
echo "💡 ヒント:"
echo "  - 各ブランチで独立して作業"
echo "  - 完了後は PR を作成"
echo "  - 競合を避けるため、異なるファイル/機能を担当"