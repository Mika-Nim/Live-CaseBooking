#!/bin/bash

# Kill Port 3000 Script
# Kills any process running on port 3000

echo "🔫 Killing processes on port 3000..."

# Method 1: Using kill-port if available
if command -v npx >/dev/null 2>&1; then
    echo "📦 Using npx kill-port..."
    npx kill-port 3000 2>/dev/null && echo "✅ Port 3000 freed using npx kill-port"
fi

# Method 2: Using lsof and kill
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "🔍 Finding processes on port 3000..."
    PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "💀 Killing processes: $PIDS"
        echo "$PIDS" | xargs kill -9 2>/dev/null
        sleep 2
        
        # Verify port is free
        if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "✅ Port 3000 successfully freed"
        else
            echo "⚠️  Port 3000 may still be in use"
        fi
    fi
else
    echo "✅ Port 3000 is already free"
fi

# Method 3: Using netstat and kill (fallback)
if command -v netstat >/dev/null 2>&1; then
    PID=$(netstat -tulpn 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d/ -f1 | head -1)
    if [ -n "$PID" ] && [ "$PID" != "-" ]; then
        echo "🎯 Found PID $PID using netstat, killing..."
        kill -9 "$PID" 2>/dev/null && echo "✅ Process $PID killed"
    fi
fi

# Final check
sleep 1
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 3000 is still in use. You may need to:"
    echo "   1. Check for background Node.js processes"
    echo "   2. Restart your terminal"
    echo "   3. Reboot your system"
    exit 1
else
    echo "🎉 Port 3000 is now available!"
fi