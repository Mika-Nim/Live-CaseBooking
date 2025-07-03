#!/bin/bash

# Development Start Script
# Sets up development environment and starts the development server

echo "🚀 Starting TM Case Booking - Development Environment"
echo "======================================================="

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use!"
    echo "Would you like to kill the process and continue? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "🔫 Killing process on port 3000..."
        npx kill-port 3000 2>/dev/null || {
            echo "Trying alternative method..."
            lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        }
        sleep 2
    else
        echo "❌ Exiting. Please free port 3000 and try again."
        exit 1
    fi
fi

# Set up development environment
echo "🔧 Setting up development environment..."
if [ ! -f .env ]; then
    if [ -f .env.development ]; then
        echo "📋 Copying development environment file..."
        cp .env.development .env
    else
        echo "⚠️  No environment file found. Creating default..."
        cat > .env << EOF
# Development Environment Configuration
REACT_APP_SUPABASE_URL=https://puppogbxzkppdesjvhev.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cHBvZ2J4emtwcGRlc2p2aGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzA3MTYsImV4cCI6MjA2NzA0NjcxNn0.5WGs3Bdlgm3N9kY5j9csVD3r5bNDKpOhYWjja4ET4J8
REACT_APP_ENV=development
EOF
    fi
fi

# Check dependencies
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "🔧 Installing dependencies..."
    npm install
fi

# Show environment info
echo ""
echo "🌍 Environment Information:"
echo "   Environment: Development"
echo "   Database: Supabase Development Instance"
echo "   Local URL: http://localhost:3000"
echo "   Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo ""

# Start development server
echo "🚀 Starting development server..."
echo "   Press Ctrl+C to stop the server"
echo ""

# Start with proper error handling
export BROWSER=none
npm start || {
    echo ""
    echo "❌ Failed to start development server"
    echo "💡 Try running: npm run kill:port && npm run dev:start"
    exit 1
}