#!/bin/bash

# Production Serve Script
# Serves the production build locally for testing

echo "🍽️  Serving Production Build Locally"
echo "===================================="

# Check if build exists
if [ ! -d "build" ]; then
    echo "❌ Production build not found"
    echo "🏗️  Building production version..."
    npm run prod:build || {
        echo "❌ Build failed"
        exit 1
    }
fi

# Check if serve is available
if ! command -v npx >/dev/null 2>&1; then
    echo "❌ npx not available"
    exit 1
fi

# Find available port
PORT=3000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "📦 Serving production build..."
echo "🌐 Local URL: http://localhost:$PORT"
echo "📁 Serving from: $(pwd)/build"
echo ""
echo "🚀 Press Ctrl+C to stop the server"

# Serve the build directory
npx serve -s build -p $PORT || {
    echo "❌ Failed to start server"
    echo "💡 Try installing serve globally: npm install -g serve"
    exit 1
}