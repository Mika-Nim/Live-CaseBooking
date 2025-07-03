#!/bin/bash

# Git Production Push Script
# Prepares and pushes changes to production repository

echo "🚀 Git Push to Production Repository"
echo "===================================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check if SSH key is available
if ! ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "⚠️  SSH authentication may not be properly configured"
    echo "🔑 Make sure your SSH key is added to GitHub"
fi

# Ensure we're on the right branch for production
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Build production version first
echo "🏗️  Building production version..."
npm run prod:build || {
    echo "❌ Production build failed. Cannot proceed with deployment."
    exit 1
}

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Found uncommitted changes - staging for production"
    
    # Show status
    echo ""
    echo "📋 Git Status:"
    git status --short
    echo ""
    
    # Ask for commit message
    echo "💬 Enter commit message for production (or press Enter for auto-generated):"
    read -r COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
        COMMIT_MSG="Production release v${VERSION} - $(date '+%Y-%m-%d %H:%M:%S')

Production build with:
- Latest Supabase integration
- Optimized performance
- Security updates"
    else
        COMMIT_MSG="$COMMIT_MSG"
    fi
    
    # Stage all changes
    echo "📦 Staging changes for production..."
    git add .
    
    # Commit changes
    echo "💾 Committing production changes..."
    git commit -m "$COMMIT_MSG" || {
        echo "❌ Commit failed"
        exit 1
    }
fi

# Create or update production remote
echo "🔗 Setting up production remote..."
if git remote get-url production > /dev/null 2>&1; then
    echo "✅ Production remote already exists"
    git remote set-url production git@github.com:Mika-Nim/Live-CaseBooking.git
else
    echo "➕ Adding production remote..."
    git remote add production git@github.com:Mika-Nim/Live-CaseBooking.git
fi

# Push to production repository
echo "🚀 Pushing to production repository..."
echo "   Repository: git@github.com:Mika-Nim/Live-CaseBooking.git"
echo "   Branch: main"

# Push to production main branch
git push production HEAD:main --force || {
    echo "❌ Failed to push to production repository"
    echo "💡 Make sure you have SSH access to the production repository"
    echo "🔑 Check your SSH key configuration with: ssh -T git@github.com"
    exit 1
}

# Also push tags if any
if git tag -l | grep -q .; then
    echo "🏷️  Pushing tags to production..."
    git push production --tags || echo "⚠️  Failed to push tags (continuing anyway)"
fi

echo ""
echo "✅ Successfully pushed to production repository!"
echo "🔗 Production Repository: https://github.com/Mika-Nim/Live-CaseBooking"
echo "🌐 Live URL: https://mika-nim.github.io/Live-CaseBooking/"
echo ""
echo "🚀 GitHub Actions will now build and deploy automatically"
echo "⏱️  Deployment typically takes 2-5 minutes"

# Show recent commits
echo ""
echo "📜 Recent commits pushed to production:"
git log --oneline -3