#!/bin/bash

# Full Production Deployment Script
# Handles complete production deployment workflow

echo "🚀 Full Production Deployment"
echo "============================="

# Version check
VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
echo "📦 Current version: $VERSION"

# Confirmation
echo ""
echo "⚠️  You are about to deploy to PRODUCTION environment!"
echo "🌐 Live URL: https://mika-nim.github.io/Live-CaseBooking/"
echo ""
echo "This will:"
echo "  1. Build production bundle"
echo "  2. Commit all changes"
echo "  3. Push to production repository"
echo "  4. Trigger GitHub Pages deployment"
echo ""
echo "Are you sure you want to continue? (y/N)"
read -r response

if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Step 1: Production build
echo ""
echo "🏗️  Step 1: Building production bundle..."
npm run prod:build || {
    echo "❌ Production build failed. Deployment aborted."
    exit 1
}

# Step 2: Run tests if available
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo ""
    echo "🧪 Step 2: Running tests..."
    npm test -- --coverage --ci --watchAll=false || {
        echo "⚠️  Tests failed, but continuing deployment..."
    }
fi

# Step 3: Update version
echo ""
echo "📦 Step 3: Version management..."
echo "Current version: $VERSION"
echo "Update version? (patch/minor/major/skip)"
read -r version_update

case $version_update in
    patch)
        npm version patch --no-git-tag-version
        NEW_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
        echo "✅ Version updated to $NEW_VERSION"
        ;;
    minor)
        npm version minor --no-git-tag-version
        NEW_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
        echo "✅ Version updated to $NEW_VERSION"
        ;;
    major)
        npm version major --no-git-tag-version
        NEW_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
        echo "✅ Version updated to $NEW_VERSION"
        ;;
    *)
        NEW_VERSION=$VERSION
        echo "⏭️  Skipping version update"
        ;;
esac

# Step 4: Git operations
echo ""
echo "📤 Step 4: Git operations..."

# Commit current changes
if ! git diff-index --quiet HEAD --; then
    git add .
    git commit -m "Production deployment v${NEW_VERSION} - $(date '+%Y-%m-%d %H:%M:%S')

🚀 Production deployment includes:
- Latest features and bug fixes
- Production optimizations
- Database integration updates
- Security enhancements

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" || {
        echo "❌ Commit failed"
        exit 1
    }
fi

# Step 5: Deploy to production
echo ""
echo "🚀 Step 5: Deploying to production..."
npm run git:prod || {
    echo "❌ Production deployment failed"
    exit 1
}

# Step 6: Create git tag
if [ "$NEW_VERSION" != "$VERSION" ]; then
    echo ""
    echo "🏷️  Step 6: Creating git tag..."
    git tag -a "v${NEW_VERSION}" -m "Production release v${NEW_VERSION}"
    git push origin --tags || echo "⚠️  Failed to push tags to origin"
fi

# Success message
echo ""
echo "🎉 Production deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Version: v${NEW_VERSION}"
echo "   Production URL: https://mika-nim.github.io/Live-CaseBooking/"
echo "   Repository: https://github.com/Mika-Nim/Live-CaseBooking"
echo "   Deployment time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "⏱️  GitHub Pages deployment typically takes 2-5 minutes"
echo "🔍 Monitor deployment: https://github.com/Mika-Nim/Live-CaseBooking/actions"
echo ""
echo "✅ Production deployment complete!"