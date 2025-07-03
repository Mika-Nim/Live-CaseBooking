#!/bin/bash

# Git Development Push Script
# Commits and pushes changes to development repository

echo "📤 Git Push to Development Repository"
echo "===================================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Found uncommitted changes"
    
    # Show status
    echo ""
    echo "📋 Git Status:"
    git status --short
    echo ""
    
    # Ask for commit message
    echo "💬 Enter commit message (or press Enter for auto-generated message):"
    read -r COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Update development build - $(date '+%Y-%m-%d %H:%M:%S')

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    else
        COMMIT_MSG="$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    fi
    
    # Stage all changes
    echo "📦 Staging changes..."
    git add .
    
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "$COMMIT_MSG" || {
        echo "❌ Commit failed"
        exit 1
    }
else
    echo "✅ No uncommitted changes found"
fi

# Ensure we're on development branch
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "⚠️  Not on development branch. Switching to development..."
    git checkout development || {
        echo "❌ Failed to switch to development branch"
        exit 1
    }
fi

# Push to development repository
echo "🚀 Pushing to development repository..."
git push origin development || {
    echo "❌ Push failed. Trying to set upstream..."
    git push --set-upstream origin development || {
        echo "❌ Failed to push to development repository"
        exit 1
    }
}

echo ""
echo "✅ Successfully pushed to development repository!"
echo "🔗 Repository: https://github.com/Mika-Nim/TM-Case-Booking"
echo "🌿 Branch: development"

# Show recent commits
echo ""
echo "📜 Recent commits:"
git log --oneline -5