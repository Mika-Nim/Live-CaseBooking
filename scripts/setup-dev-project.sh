#!/bin/bash

# Script to help set up the development Supabase project
# This script guides you through the manual steps required

echo "🚀 Setting up Development Supabase Project"
echo "==========================================="
echo ""

echo "📋 Step 1: Create Development Project"
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Organization: Choose your organization"
echo "4. Name: TM-Case-Booking-Dev"
echo "5. Database Password: Use a strong password"
echo "6. Region: Same as your production project"
echo "7. Plan: Free"
echo "8. Click 'Create new project'"
echo ""
read -p "Press Enter when you've created the development project..."

echo ""
echo "📋 Step 2: Set Up Database Schema"
echo "1. Go to your new dev project dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy the contents of 'database-schema.sql' file"
echo "4. Paste and run in SQL Editor"
echo "5. Copy the contents of 'database-seed.sql' file"
echo "6. Paste and run in SQL Editor"
echo ""
read -p "Press Enter when you've set up the database schema..."

echo ""
echo "📋 Step 3: Get Project Credentials"
echo "1. In your dev project dashboard, go to Settings → API"
echo "2. Copy the following values:"
echo "   - Project URL (should look like: https://abcdefgh.supabase.co)"
echo "   - anon/public key"
echo ""

read -p "Enter your development project URL: " DEV_URL
read -p "Enter your development anon key: " DEV_ANON_KEY

echo ""
echo "📋 Step 4: Update Environment File"

# Update .env.development with actual values
sed -i "s|https://your-dev-project-ref.supabase.co|$DEV_URL|g" .env.development
sed -i "s|your-dev-project-anon-key|$DEV_ANON_KEY|g" .env.development

echo "✅ Updated .env.development with your credentials"

echo ""
echo "📋 Step 5: Test Development Environment"
echo "Run the following commands to test:"
echo ""
echo "  ./scripts/setup-environment.sh development"
echo "  npm install"
echo "  npm start"
echo ""

echo "🎉 Development project setup complete!"
echo ""
echo "📝 Summary:"
echo "  - Development Project: $DEV_URL"
echo "  - Environment file: .env.development (updated)"
echo "  - Repository: TM-Case-Booking (development environment)"
echo "  - Production: Live-CaseBooking (production environment)"
echo ""
echo "💡 Next: Copy environment files to production repository:"
echo "  ./scripts/copy-to-production.sh /path/to/Live-CaseBooking"