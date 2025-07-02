# Supabase Branching Setup Guide

## Overview

You now have the foundation set up for proper development and production environments. Here's what you need to do next to complete the setup.

## Current Status ✅

- ✅ Development repository (`TM-Case-Booking`) configured with Supabase structure
- ✅ Environment configuration files created
- ✅ Migration files prepared
- ✅ Development branch created and pushed
- ✅ Documentation completed

## Next Steps - Manual Setup Required

### Step 1: Enable GitHub Integration in Supabase

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/yjllfmmzgnapsqfddbwt
   - Navigate to **Settings** → **Integrations**

2. **Install GitHub Integration:**
   - Click **"Install GitHub Integration"**
   - Authorize Supabase to access your GitHub repositories
   - Select the repositories: `Mika-Nim/Live-CaseBooking` and `Mika-Nim/TM-Case-Booking`

### Step 2: Configure Production Branch

1. **Set up Main Branch Connection:**
   - In Supabase Dashboard → **Branches**
   - Click **"Connect repository"**
   - Select repository: `Mika-Nim/Live-CaseBooking`
   - Set branch: `main`
   - This connects your production database to the Live-CaseBooking repository

### Step 3: Create Development Branch

1. **Create Preview Branch:**
   - In Supabase Dashboard → **Branches**
   - Click **"Create preview branch"**
   - Select repository: `Mika-Nim/TM-Case-Booking`
   - Select branch: `development`
   - Enter branch name: `dev-testing`
   - Click **"Create branch"**

2. **Wait for Branch Creation:**
   - This process takes 2-3 minutes
   - You'll get a new project URL and API keys for the development branch
   - Example: `https://your-project-ref-dev-testing.supabase.co`

### Step 4: Update Development Environment

1. **Copy New Credentials:**
   - Once the development branch is created, note down:
     - Development project URL
     - Development anon key
     - Development service role key (if needed)

2. **Update Environment File:**
   ```bash
   # In TM-Case-Booking repository
   nano .env.development
   ```
   
   Update with actual values:
   ```env
   REACT_APP_SUPABASE_URL=https://your-actual-dev-branch-url.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-actual-dev-anon-key
   ```

### Step 5: Setup Production Repository

1. **Clone Production Repository:**
   ```bash
   git clone https://github.com/Mika-Nim/Live-CaseBooking.git
   cd Live-CaseBooking
   ```

2. **Copy Environment Files:**
   You'll need to copy these files from TM-Case-Booking to Live-CaseBooking:
   - `.env.production`
   - `scripts/setup-environment.sh`
   - `DEVELOPMENT_SETUP.md`

3. **Set Production Environment:**
   ```bash
   ./scripts/setup-environment.sh production
   ```

### Step 6: Initialize Database Schema

The development branch will automatically run your migrations, but you may need to run the schema manually in production:

1. **In Supabase Dashboard (Main Branch):**
   - Go to **SQL Editor**
   - Run the contents of `database-schema.sql`
   - Run the contents of `database-seed.sql`

## Testing the Setup

### Development Testing

1. **Start Development Environment:**
   ```bash
   # In TM-Case-Booking directory
   ./scripts/setup-environment.sh development
   npm start
   ```

2. **Verify Connection:**
   - Application should connect to development Supabase branch
   - Check browser console for connection confirmation
   - Test basic functionality

### Production Testing

1. **Build and Deploy:**
   ```bash
   # In Live-CaseBooking directory
   ./scripts/setup-environment.sh production
   npm run build
   npm run deploy
   ```

2. **Verify Production:**
   - Visit: https://mika-nim.github.io/Live-CaseBooking/
   - Should connect to main Supabase branch
   - Test functionality with production data

## Laptop Migration Workflow

### For Development Work (Any Laptop)

```bash
# Clone development repository
git clone https://github.com/Mika-Nim/TM-Case-Booking.git
cd TM-Case-Booking

# Setup development environment
./scripts/setup-environment.sh development

# Install and start
npm install
npm start
```

### For Production Access (Any Laptop)

```bash
# Clone production repository
git clone https://github.com/Mika-Nim/Live-CaseBooking.git
cd Live-CaseBooking

# Setup production environment
./scripts/setup-environment.sh production

# Install and deploy
npm install
npm run build
npm run deploy
```

## Environment Summary

| Environment | Repository | Supabase Branch | Usage |
|-------------|------------|-----------------|-------|
| **Development** | `TM-Case-Booking` | `dev-testing` | Feature development, testing |
| **Production** | `Live-CaseBooking` | `main` | Live application |

## Cost Management

- **Development Branch**: $0.01344/hour (auto-pauses after 5min inactivity)
- **Production Branch**: Regular project pricing (always active)
- **Total Additional Cost**: ~$10/month for active development

## Troubleshooting

### Common Issues

1. **Branch Not Creating:**
   - Ensure GitHub integration is properly installed
   - Check repository permissions
   - Verify supabase directory exists with migrations

2. **Environment Variables Not Working:**
   - Check file names exactly match (.env.development)
   - Restart development server after changes
   - Verify setup script ran successfully

3. **Database Schema Issues:**
   - Check migration file format
   - Ensure no SQL syntax errors
   - Review Supabase logs in dashboard

## Security Checklist

- [ ] Different OAuth credentials for dev/prod
- [ ] Production API keys secured
- [ ] Development branch auto-pauses to minimize exposure
- [ ] RLS policies tested in both environments

## Next Actions for You

1. **Go to Supabase Dashboard** and follow Steps 1-3 above
2. **Update .env.development** with actual development branch credentials
3. **Copy environment files to Live-CaseBooking repository**
4. **Test both environments** to ensure proper separation

Once completed, you'll have a professional development setup that scales across multiple devices and team members!