#!/bin/bash

# Deploy to Both Development and Production Script
# Deploys current development work to both repositories with proper environment configurations

echo "🚀 Deploy to Both Development and Production"
echo "============================================"

# Configuration
DEV_REPO="git@github.com:Mika-Nim/TM-Case-Booking.git"
PROD_REPO="git@github.com:Mika-Nim/Live-CaseBooking.git"
VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
VERSION_BRANCH="Version-${VERSION}"

echo "📦 Current version: $VERSION"
echo "🌿 Version branch: $VERSION_BRANCH"
echo "🧪 Development repository: $DEV_REPO"
echo "🚀 Production repository: $PROD_REPO"
echo ""

# Confirmation
echo "⚠️  You are about to deploy to BOTH environments!"
echo ""
echo "This will:"
echo "  1. Create and push version branch: $VERSION_BRANCH"
echo "  2. Commit current development changes"
echo "  3. Push to Development repository (with development config)"
echo "  4. Build production version with production Supabase config"
echo "  5. Deploy to Production repository (GitHub Pages)"
echo "  6. Restore development environment"
echo ""
echo "Are you sure you want to continue? (y/N)"
read -r response

if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Step 1: Save current environment
echo ""
echo "💾 Step 1: Saving current environment..."
CURRENT_BRANCH=$(git branch --show-current)
cp .env .env.backup 2>/dev/null || echo "No .env to backup"
cp README.md README.dev.backup

echo "✅ Environment saved"
echo "   Current branch: $CURRENT_BRANCH"

# Step 2: Create and push version branch
echo ""
echo "🌿 Step 2: Creating version branch..."

# Create version branch from current state
echo "📝 Creating version branch: $VERSION_BRANCH"
git checkout -b "$VERSION_BRANCH" || {
    # If branch already exists, switch to it and update
    echo "📍 Version branch exists, switching to it..."
    git checkout "$VERSION_BRANCH" || {
        echo "❌ Failed to create/switch to version branch"
        exit 1
    }
    
    # Merge latest development changes
    echo "🔄 Merging latest development changes..."
    git merge development --no-edit || {
        echo "❌ Failed to merge development changes"
        exit 1
    }
}

# Commit any uncommitted changes to version branch
if ! git diff-index --quiet HEAD --; then
    echo "📝 Committing changes to version branch..."
    git add .
    git commit -m "Version $VERSION - $(date '+%Y-%m-%d %H:%M:%S')

Complete feature set and bug fixes for version $VERSION
Ready for production deployment

🚀 Features included:
- All development work up to v$VERSION
- Supabase full integration
- Multi-user authentication
- Case management system
- Real-time notifications" || {
        echo "❌ Version branch commit failed"
        exit 1
    }
fi

# Push version branch to both repositories
echo "📤 Pushing version branch to development repository..."
git push origin "$VERSION_BRANCH" || {
    echo "❌ Failed to push version branch to development"
    exit 1
}

echo "📤 Pushing version branch to production repository..."
# Set up production remote if not exists
if ! git remote get-url production > /dev/null 2>&1; then
    git remote add production "$PROD_REPO"
fi
git push production "$VERSION_BRANCH" || {
    echo "❌ Failed to push version branch to production"
    exit 1
}

echo "✅ Version branch created and pushed!"
echo "🌿 Branch: $VERSION_BRANCH"

# Switch back to development branch
echo "📍 Switching back to development branch..."
git checkout development || {
    echo "❌ Failed to switch back to development branch"
    exit 1
}

# Step 3: Commit and push to Development
echo ""
echo "🧪 Step 3: Deploying to Development..."

# Ensure we're on development branch
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "📍 Switching to development branch..."
    git checkout development || {
        echo "❌ Failed to switch to development branch"
        exit 1
    }
fi

# Set development environment
echo "🔧 Setting development environment..."
cp .env.development .env

# Commit development changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Committing development changes..."
    
    echo "💬 Enter commit message (or press Enter for auto-generated):"
    read -r COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Development update v${VERSION} - $(date '+%Y-%m-%d %H:%M:%S')

Features and improvements ready for production deployment."
    else
        COMMIT_MSG="$COMMIT_MSG"
    fi
    
    git add .
    git commit -m "$COMMIT_MSG" || {
        echo "❌ Development commit failed"
        exit 1
    }
else
    echo "✅ No uncommitted changes in development"
fi

# Push to development repository
echo "📤 Pushing to development repository..."
git push origin development || {
    echo "❌ Failed to push to development"
    exit 1
}

echo "✅ Development deployment completed!"
echo "🔗 Development repository: https://github.com/Mika-Nim/TM-Case-Booking"

# Step 4: Prepare and deploy to Production
echo ""
echo "🚀 Step 4: Deploying to Production..."

# Set production environment and configuration
echo "🔧 Setting production environment..."
cp .env.production .env
cp README.production.md README.md

# Update package.json for production
echo "📦 Configuring package.json for production..."
sed -i 's|"homepage": "\."|"homepage": "https://mika-nim.github.io/Live-CaseBooking"|g' package.json

# Build production version
echo "🏗️  Building production version..."
npm run build || {
    echo "❌ Production build failed"
    # Restore environment
    cp .env.backup .env 2>/dev/null
    cp README.dev.backup README.md
    sed -i 's|"homepage": "https://mika-nim.github.io/Live-CaseBooking"|"homepage": "\."|g' package.json
    exit 1
}

# Commit production build
echo "💾 Committing production build..."
git add .
git commit -m "Production deployment v${VERSION} - $(date '+%Y-%m-%d %H:%M:%S')

🚀 Production deployment includes:
- Latest development features
- Production Supabase configuration (yjllfmmzgnapsqfddbwt.supabase.co)
- Optimized production build
- GitHub Pages configuration" || {
    echo "❌ Production commit failed"
    exit 1
}

# Set up production remote if not exists
echo "🔗 Setting up production remote..."
if ! git remote get-url production > /dev/null 2>&1; then
    git remote add production "$PROD_REPO"
    echo "✅ Production remote added"
else
    git remote set-url production "$PROD_REPO"
    echo "✅ Production remote updated"
fi

# Push to production repository
echo "📤 Pushing to production repository..."
git push production HEAD:main --force || {
    echo "❌ Failed to push to production"
    echo "💡 Make sure you have SSH access to production repository"
    exit 1
}

# Push tags
if git tag -l | grep -q .; then
    echo "🏷️  Pushing tags to production..."
    git push production --tags || echo "⚠️  Failed to push tags (continuing anyway)"
fi

echo "✅ Production deployment completed!"
echo "🔗 Production repository: https://github.com/Mika-Nim/Live-CaseBooking"
echo "🌐 Live URL: https://mika-nim.github.io/Live-CaseBooking/"

# Step 5: Restore development environment
echo ""
echo "🔄 Step 5: Restoring development environment..."

# Restore development files
cp .env.development .env
cp README.dev.backup README.md
sed -i 's|"homepage": "https://mika-nim.github.io/Live-CaseBooking"|"homepage": "\."|g' package.json

# Commit restoration
git add .
git commit -m "Restore development environment after production deployment

- Restored development README and configuration
- Reset homepage for development
- Environment ready for continued development" || echo "⚠️  Restoration commit failed (continuing)"

# Push restoration to development
git push origin development || echo "⚠️  Failed to push restoration (continuing)"

# Clean up backup files
rm -f .env.backup README.dev.backup

echo "✅ Development environment restored!"

# Step 6: Final verification
echo ""
echo "🔍 Step 6: Final verification..."

# Verify production deployment
echo "🌐 Checking production site..."
sleep 5  # Wait for GitHub Pages to update
if curl -s -o /dev/null -w "%{http_code}" "https://mika-nim.github.io/Live-CaseBooking/" | grep -q "200"; then
    echo "✅ Production site is responding"
else
    echo "⚠️  Production site may still be deploying (GitHub Pages takes 2-5 minutes)"
fi

# Show environment status
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "✅ Version branch: $VERSION_BRANCH created and pushed to both repos"
echo "✅ Development repository: Updated and pushed"
echo "✅ Production repository: Updated and deployed"
echo "✅ Development environment: Restored"
echo ""
echo "🔗 URLs:"
echo "   Development: https://github.com/Mika-Nim/TM-Case-Booking"
echo "   Production: https://github.com/Mika-Nim/Live-CaseBooking"
echo "   Live Site: https://mika-nim.github.io/Live-CaseBooking/"
echo ""
echo "🌿 Version Branch URLs:"
echo "   Development: https://github.com/Mika-Nim/TM-Case-Booking/tree/$VERSION_BRANCH"
echo "   Production: https://github.com/Mika-Nim/Live-CaseBooking/tree/$VERSION_BRANCH"
echo ""
echo "🗃️ Database Connections:"
echo "   Development: puppogbxzkppdesjvhev.supabase.co (current)"
echo "   Production: yjllfmmzgnapsqfddbwt.supabase.co (deployed)"
echo ""
echo "⏱️  GitHub Pages deployment typically takes 2-5 minutes"
echo "🔍 Monitor deployment: https://github.com/Mika-Nim/Live-CaseBooking/actions"
echo ""
echo "🎉 Dual deployment completed successfully!"
echo ""
echo "💡 Next steps:"
echo "   - Continue development in current environment"
echo "   - Test production at: https://mika-nim.github.io/Live-CaseBooking/"
echo "   - Production uses: yjllfmmzgnapsqfddbwt.supabase.co"
echo "   - Development uses: puppogbxzkppdesjvhev.supabase.co"