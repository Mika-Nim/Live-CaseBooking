#!/bin/bash

# Script to copy environment setup files to production repository
# Usage: ./scripts/copy-to-production.sh /path/to/Live-CaseBooking

PRODUCTION_PATH=$1

if [ -z "$PRODUCTION_PATH" ]; then
    echo "❌ Please provide the path to your Live-CaseBooking repository"
    echo "Usage: ./scripts/copy-to-production.sh /path/to/Live-CaseBooking"
    exit 1
fi

if [ ! -d "$PRODUCTION_PATH" ]; then
    echo "❌ Directory does not exist: $PRODUCTION_PATH"
    exit 1
fi

echo "🚀 Copying environment setup files to production repository..."

# Create scripts directory if it doesn't exist
mkdir -p "$PRODUCTION_PATH/scripts"

# Copy environment files
cp .env.production "$PRODUCTION_PATH/"
cp scripts/setup-environment.sh "$PRODUCTION_PATH/scripts/"
cp DEVELOPMENT_SETUP.md "$PRODUCTION_PATH/"
cp SUPABASE_BRANCHING_GUIDE.md "$PRODUCTION_PATH/"

# Make setup script executable
chmod +x "$PRODUCTION_PATH/scripts/setup-environment.sh"

echo "✅ Files copied successfully!"
echo ""
echo "📋 Next steps:"
echo "1. cd $PRODUCTION_PATH"
echo "2. ./scripts/setup-environment.sh production"
echo "3. git add . && git commit -m 'Add environment setup'"
echo "4. git push origin main"

echo ""
echo "🔧 Files copied:"
echo "  - .env.production"
echo "  - scripts/setup-environment.sh"
echo "  - DEVELOPMENT_SETUP.md"
echo "  - SUPABASE_BRANCHING_GUIDE.md"