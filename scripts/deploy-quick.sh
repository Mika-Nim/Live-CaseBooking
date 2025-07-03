#!/bin/bash

# Quick Deploy to Both Repositories
# Fast deployment without confirmations for rapid development cycles

echo "⚡ Quick Deploy to Both Repositories"
echo "==================================="

# Get version and show info
VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
echo "📦 Version: $VERSION"
echo "🕒 Started: $(date '+%H:%M:%S')"
echo ""

# Function to handle errors
handle_error() {
    echo "❌ Error occurred during deployment"
    echo "🔄 Restoring development environment..."
    cp .env.development .env 2>/dev/null
    cp README.dev.backup README.md 2>/dev/null
    sed -i 's|"homepage": "https://mika-nim.github.io/Live-CaseBooking"|"homepage": "\."|g' package.json 2>/dev/null
    rm -f .env.backup README.dev.backup
    exit 1
}

# Set error handling
trap handle_error ERR

# Save current state
echo "💾 Saving environment..."
cp .env .env.backup 2>/dev/null || true
cp README.md README.dev.backup

# Step 1: Development deployment
echo "🧪 Deploying to Development..."
git checkout development 2>/dev/null || true
cp .env.development .env

if ! git diff-index --quiet HEAD --; then
    git add .
    git commit -m "Quick update v${VERSION} - $(date '+%H:%M:%S')

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

git push origin development
echo "✅ Development: DONE"

# Step 2: Production deployment
echo "🚀 Deploying to Production..."
cp .env.production .env
cp README.production.md README.md
sed -i 's|"homepage": "\."|"homepage": "https://mika-nim.github.io/Live-CaseBooking"|g' package.json

npm run build >/dev/null

git add .
git commit -m "Production v${VERSION} - $(date '+%H:%M:%S')

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Set up production remote
git remote add production git@github.com:Mika-Nim/Live-CaseBooking.git 2>/dev/null || \
git remote set-url production git@github.com:Mika-Nim/Live-CaseBooking.git

git push production HEAD:main --force
echo "✅ Production: DONE"

# Step 3: Restore development
echo "🔄 Restoring development..."
cp .env.development .env
cp README.dev.backup README.md
sed -i 's|"homepage": "https://mika-nim.github.io/Live-CaseBooking"|"homepage": "\."|g' package.json

git add .
git commit -m "Restore dev environment

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" 2>/dev/null || true

git push origin development 2>/dev/null || true

# Cleanup
rm -f .env.backup README.dev.backup

# Final status
echo ""
echo "🎉 Quick deployment completed!"
echo "🕒 Finished: $(date '+%H:%M:%S')"
echo "🌐 Live: https://mika-nim.github.io/Live-CaseBooking/"
echo "📊 Production uses: yjllfmmzgnapsqfddbwt.supabase.co"
echo "🧪 Development uses: puppogbxzkppdesjvhev.supabase.co"