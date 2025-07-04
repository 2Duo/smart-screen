#!/bin/bash

# Smart Display - ブランチ管理スクリプト
# 並列開発のブランチを管理

echo "🌿 Smart Display - ブランチ管理ツール"
echo "===================================="

# 関数定義
show_help() {
    echo "使用方法:"
    echo "  ./scripts/branch-manager.sh <command>"
    echo ""
    echo "コマンド:"
    echo "  list       - 全ブランチを表示"
    echo "  active     - アクティブなfeatureブランチを表示"
    echo "  clean      - マージ済みブランチを削除"
    echo "  sync       - mainブランチと同期"
    echo "  status     - 各ブランチの状態を確認"
    echo "  merge      - ブランチをmainにマージ"
    echo "  help       - このヘルプを表示"
}

list_branches() {
    echo "📋 全ブランチ一覧:"
    echo "=================="
    git branch -a --sort=-committerdate
}

show_active_branches() {
    echo "🔥 アクティブなfeatureブランチ:"
    echo "============================="
    git branch --sort=-committerdate | grep feature | head -10
}

clean_merged_branches() {
    echo "🧹 マージ済みブランチのクリーンアップ:"
    echo "===================================="
    
    # ローカルのマージ済みブランチを削除
    echo "ローカルのマージ済みブランチを削除中..."
    git branch --merged main | grep -v "main\|develop" | xargs -n 1 git branch -d
    
    # リモートのマージ済みブランチを削除
    echo "リモートのマージ済みブランチを削除中..."
    git remote prune origin
    
    echo "✅ クリーンアップ完了"
}

sync_with_main() {
    echo "🔄 mainブランチとの同期:"
    echo "======================="
    
    CURRENT_BRANCH=$(git branch --show-current)
    echo "現在のブランチ: $CURRENT_BRANCH"
    
    # mainブランチに切り替えて更新
    git checkout main
    git pull origin main
    
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo "元のブランチに戻り、mainをマージ..."
        git checkout "$CURRENT_BRANCH"
        git merge main
        
        # 競合があった場合
        if [ $? -ne 0 ]; then
            echo "⚠️  競合が発生しました。手動で解決してください。"
            echo "解決後、以下のコマンドを実行:"
            echo "  git add ."
            echo "  git commit -m 'resolve merge conflicts'"
        else
            echo "✅ 同期完了"
        fi
    fi
}

show_branch_status() {
    echo "📊 ブランチ状態確認:"
    echo "==================="
    
    # 各featureブランチの状態を表示
    for branch in $(git branch | grep feature | sed 's/^..//' | head -5); do
        echo ""
        echo "ブランチ: $branch"
        echo "------------------------"
        
        # 最新コミット
        git log --oneline -1 "$branch" 2>/dev/null || echo "  エラー: ブランチが存在しません"
        
        # mainとの差分
        ahead=$(git rev-list --count main.."$branch" 2>/dev/null || echo "0")
        behind=$(git rev-list --count "$branch"..main 2>/dev/null || echo "0")
        echo "  main より $ahead コミット先行, $behind コミット遅延"
        
        # 変更ファイル数
        changed_files=$(git diff --name-only main..."$branch" 2>/dev/null | wc -l)
        echo "  変更ファイル数: $changed_files"
    done
}

merge_branch() {
    echo "🔀 ブランチのマージ:"
    echo "=================="
    
    # 現在のブランチを確認
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [ "$CURRENT_BRANCH" = "main" ]; then
        echo "mainブランチにいます。マージするブランチを指定してください:"
        git branch | grep feature | head -10
        echo -n "マージするブランチ名: "
        read -r BRANCH_TO_MERGE
    else
        echo "現在のブランチ ($CURRENT_BRANCH) をmainにマージしますか? (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            BRANCH_TO_MERGE=$CURRENT_BRANCH
        else
            echo "マージをキャンセルしました。"
            return
        fi
    fi
    
    # マージ前のチェック
    echo "マージ前チェック..."
    git checkout main
    git pull origin main
    
    # マージ実行
    echo "マージ実行中..."
    git merge "$BRANCH_TO_MERGE" --no-ff
    
    if [ $? -eq 0 ]; then
        echo "✅ マージ完了"
        echo "mainブランチをプッシュしますか? (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            git push origin main
            echo "✅ プッシュ完了"
        fi
        
        # ブランチ削除の確認
        echo "マージしたブランチ ($BRANCH_TO_MERGE) を削除しますか? (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            git branch -d "$BRANCH_TO_MERGE"
            git push origin --delete "$BRANCH_TO_MERGE"
            echo "✅ ブランチ削除完了"
        fi
    else
        echo "❌ マージに失敗しました。競合を解決してください。"
    fi
}

# メイン処理
case "$1" in
    "list")
        list_branches
        ;;
    "active")
        show_active_branches
        ;;
    "clean")
        clean_merged_branches
        ;;
    "sync")
        sync_with_main
        ;;
    "status")
        show_branch_status
        ;;
    "merge")
        merge_branch
        ;;
    "help"|"")
        show_help
        ;;
    *)
        echo "❌ 不明なコマンド: $1"
        show_help
        ;;
esac