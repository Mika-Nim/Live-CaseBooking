#!/bin/bash

# Development Watch Script
# Starts development server with file watching and auto-restart

echo "👀 Starting TM Case Booking - Development Watch Mode"
echo "==================================================="

# Check if nodemon is available
if ! command -v npx >/dev/null 2>&1; then
    echo "❌ npx not available. Please install Node.js"
    exit 1
fi

# Kill any existing process on port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "🔫 Killing existing process on port 3000..."
    npm run kill:port
fi

# Set up development environment
if [ -f .env.development ]; then
    cp .env.development .env
fi

echo "👀 Starting development server with file watching..."
echo "📝 Changes to the following will trigger restart:"
echo "   - TypeScript/JavaScript files"
echo "   - CSS files"
echo "   - Environment files"
echo ""
echo "🚀 Press Ctrl+C to stop watching"

# Start with nodemon for auto-restart
npx nodemon --watch src --watch public --ext ts,tsx,js,jsx,css,json --exec "npm start" || {
    echo ""
    echo "⚠️  Nodemon not available, falling back to regular start..."
    npm start
}