#!/bin/bash

# Health Check Script
# Checks the health of development and production environments

echo "🏥 TM Case Booking - Health Check"
echo "================================="

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    
    echo "🔍 Checking $name..."
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
        if [ "$response" = "200" ]; then
            echo "   ✅ $name is responding (HTTP $response)"
        else
            echo "   ❌ $name returned HTTP $response"
        fi
    else
        echo "   ⚠️  curl not available, skipping URL check"
    fi
}

# Check local development server
echo ""
echo "🔧 Development Environment"
echo "-------------------------"

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Development server is running on port 3000"
    check_url "http://localhost:3000" "Local Development Server"
else
    echo "❌ Development server is not running on port 3000"
    echo "   💡 Start with: npm run dev:start"
fi

# Check development build
if [ -d "build" ]; then
    echo "✅ Development build exists"
    echo "   📊 Build size: $(du -sh build | cut -f1)"
else
    echo "❌ No build found"
    echo "   💡 Run: npm run dev:build or npm run prod:build"
fi

# Check production environment
echo ""
echo "🚀 Production Environment"
echo "------------------------"

check_url "https://mika-nim.github.io/Live-CaseBooking/" "Production Site"

# Check GitHub repository access
echo ""
echo "📦 Repository Access"
echo "------------------"

if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Git repository detected"
    
    # Check remote repositories
    if git remote get-url origin > /dev/null 2>&1; then
        echo "✅ Origin remote configured: $(git remote get-url origin)"
    else
        echo "❌ Origin remote not configured"
    fi
    
    if git remote get-url production > /dev/null 2>&1; then
        echo "✅ Production remote configured: $(git remote get-url production)"
    else
        echo "⚠️  Production remote not configured"
        echo "   💡 Run: npm run git:prod to set up"
    fi
    
    # Check SSH access
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        echo "✅ SSH access to GitHub is working"
    else
        echo "⚠️  SSH access to GitHub may not be working"
        echo "   💡 Check your SSH key configuration"
    fi
else
    echo "❌ Not in a git repository"
fi

# Check dependencies
echo ""
echo "📦 Dependencies"
echo "--------------"

if [ -f "package.json" ]; then
    echo "✅ package.json found"
    
    if [ -d "node_modules" ]; then
        echo "✅ node_modules found"
        
        # Check for critical dependencies
        if [ -d "node_modules/react" ]; then
            echo "✅ React is installed"
        else
            echo "❌ React is not installed"
        fi
        
        if [ -d "node_modules/@supabase/supabase-js" ]; then
            echo "✅ Supabase client is installed"
        else
            echo "❌ Supabase client is not installed"
        fi
    else
        echo "❌ node_modules not found"
        echo "   💡 Run: npm install"
    fi
else
    echo "❌ package.json not found"
fi

# Check environment files
echo ""
echo "🌍 Environment Configuration"
echo "---------------------------"

if [ -f ".env" ]; then
    echo "✅ .env file exists"
    if grep -q "REACT_APP_SUPABASE_URL" .env; then
        echo "✅ Supabase URL configured"
    else
        echo "❌ Supabase URL not configured"
    fi
else
    echo "❌ .env file not found"
    echo "   💡 Copy from .env.development or .env.production"
fi

if [ -f ".env.development" ]; then
    echo "✅ .env.development exists"
else
    echo "⚠️  .env.development not found"
fi

if [ -f ".env.production" ]; then
    echo "✅ .env.production exists"
else
    echo "⚠️  .env.production not found"
fi

# Check TypeScript
echo ""
echo "🔍 TypeScript"
echo "------------"

if npm run typecheck > /dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript errors found"
    echo "   💡 Run: npm run typecheck for details"
fi

# Summary
echo ""
echo "📋 Health Check Summary"
echo "======================"

# Count issues
ISSUES=0

if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    ((ISSUES++))
fi

if [ ! -d "node_modules" ]; then
    ((ISSUES++))
fi

if [ ! -f ".env" ]; then
    ((ISSUES++))
fi

if ! npm run typecheck > /dev/null 2>&1; then
    ((ISSUES++))
fi

if [ $ISSUES -eq 0 ]; then
    echo "🎉 All systems operational!"
    echo "✅ No issues detected"
elif [ $ISSUES -le 2 ]; then
    echo "⚠️  Minor issues detected ($ISSUES issues)"
    echo "💡 System should be mostly functional"
else
    echo "❌ Multiple issues detected ($ISSUES issues)"
    echo "🔧 Recommend addressing issues before proceeding"
fi

echo ""
echo "🕒 Health check completed at $(date '+%Y-%m-%d %H:%M:%S')"