#!/bin/bash

# Development Build Script
# Builds the application for development testing

echo "🔧 Building TM Case Booking - Development"
echo "========================================"

# Set development environment
echo "🌍 Setting up development environment..."
if [ -f .env.development ]; then
    cp .env.development .env
    echo "✅ Development environment configured"
else
    echo "⚠️  .env.development not found, using current .env"
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "🔧 Installing dependencies..."
    npm install
fi

# Run type checking
echo "🔍 Running TypeScript checks..."
npm run typecheck || {
    echo "⚠️  TypeScript errors found, but continuing with build..."
}

# Build for development
echo "🏗️  Building development bundle..."
export NODE_ENV=development
export GENERATE_SOURCEMAP=true

npm run build || {
    echo "❌ Development build failed"
    exit 1
}

# Verify build
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo ""
    echo "✅ Development build completed successfully!"
    echo ""
    echo "📊 Build Statistics:"
    echo "   Build folder size: $(du -sh build | cut -f1)"
    echo "   Files created: $(find build -type f | wc -l)"
    echo ""
    echo "🧪 Ready for development testing!"
else
    echo "❌ Build verification failed"
    exit 1
fi