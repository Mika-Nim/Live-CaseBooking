#!/bin/bash

# Production Build Script
# Builds the application for production deployment

echo "🏗️  Building TM Case Booking - Production"
echo "========================================"

# Set production environment
echo "🔧 Setting up production environment..."
if [ -f .env.production ]; then
    cp .env.production .env
    echo "✅ Production environment configured"
else
    echo "⚠️  Creating production environment file..."
    cat > .env << EOF
# Production Environment Configuration
REACT_APP_SUPABASE_URL=https://yjllfmmzgnapsqfddbwt.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbGxmbW16Z25hcHNxZmRkYnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTMyMzUsImV4cCI6MjA2NjU2OTIzNX0.jnTiQM7XgrgztqWmC9iRhp_GFEXk_VyRZooWKEIwR1M
REACT_APP_ENV=production
EOF
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build

# Check dependencies
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "🔧 Installing dependencies..."
    npm ci --production=false
fi

# Run type checking
echo "🔍 Running TypeScript checks..."
npm run typecheck || {
    echo "❌ TypeScript errors found. Build aborted."
    exit 1
}

# Build for production
echo "🏗️  Building production bundle..."
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

npm run build || {
    echo "❌ Production build failed"
    exit 1
}

# Verify build
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo ""
    echo "✅ Production build completed successfully!"
    echo ""
    echo "📊 Build Statistics:"
    echo "   Build folder size: $(du -sh build | cut -f1)"
    echo "   Main JS file: $(ls -lh build/static/js/main.*.js | awk '{print $5 " " $9}' | head -1)"
    echo "   Main CSS file: $(ls -lh build/static/css/main.*.css | awk '{print $5 " " $9}' | head -1)"
    echo ""
    echo "🚀 Ready for deployment!"
    echo "   Run 'npm run prod:deploy' to deploy to GitHub Pages"
else
    echo "❌ Build verification failed - build folder is missing or invalid"
    exit 1
fi