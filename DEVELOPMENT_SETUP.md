# Development & Production Environment Setup

This document explains how to set up separate development and production environments for the TM-Case-Booking application.

## Architecture Overview

- **Production**: `Live-CaseBooking` repository → Production Supabase project
- **Development**: `TM-Case-Booking` repository → Development Supabase project

> **Note**: This setup uses separate Supabase projects instead of branching (which requires Pro plan). This approach works perfectly with the free tier.

## Prerequisites

1. Two GitHub repositories set up
2. Supabase account (free tier compatible)
3. Optional: Supabase CLI installed: `npm install -g supabase`

## Setting Up Separate Supabase Projects

### Quick Setup (Recommended)

Run the automated setup script:

```bash
./scripts/setup-dev-project.sh
```

This script will guide you through creating the development project and updating your environment configuration.

### Manual Setup

### Step 1: Create Development Supabase Project

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - Name: `TM-Case-Booking-Dev`
   - Database Password: Use a strong password
   - Region: Same as your production project
   - Plan: Free
4. Click **"Create new project"**

### Step 2: Set Up Development Database

1. In your new development project dashboard:
   - Navigate to **SQL Editor**
   - Copy and run the contents of `database-schema.sql`
   - Copy and run the contents of `database-seed.sql`

### Step 3: Update Environment Configuration

1. In your development project, go to **Settings** → **API**
2. Copy the Project URL and anon key
3. Update `.env.development`:
   ```env
   REACT_APP_SUPABASE_URL=https://your-actual-dev-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-actual-dev-anon-key
   ```

## Repository Setup

### Development Repository (TM-Case-Booking)

```bash
# Clone development repository
git clone https://github.com/Mika-Nim/TM-Case-Booking.git
cd TM-Case-Booking

# Set up development environment
./scripts/setup-environment.sh development

# Install dependencies
npm install

# Start development server
npm start
```

### Production Repository (Live-CaseBooking)

```bash
# Clone production repository
git clone https://github.com/Mika-Nim/Live-CaseBooking.git
cd Live-CaseBooking

# Set up production environment
./scripts/setup-environment.sh production

# Install dependencies
npm install

# Build and deploy
npm run build
npm run deploy
```

## Environment Management

### Switching Environments

Use the setup script to quickly switch between environments:

```bash
# Switch to development
./scripts/setup-environment.sh development

# Switch to production
./scripts/setup-environment.sh production
```

### Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `REACT_APP_SUPABASE_URL` | Dev project URL | Production project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Dev project key | Production project key |
| `REACT_APP_ENV` | development | production |

## Database Management

### Development Database

- Separate Supabase project for development
- Includes all schema and seed data
- Safe for testing and experimentation
- Free tier limits apply

### Production Database

- Main Supabase project for production
- Contains live user data
- Protected by RLS policies
- Free tier limits apply

## Workflow

### Development Workflow

1. Work in `TM-Case-Booking` repository
2. Use development Supabase branch
3. Test new features safely
4. Commit changes to development branch

### Production Deployment

1. Merge tested changes to main branch in `Live-CaseBooking`
2. Deploy to GitHub Pages
3. Changes automatically reflected in production database

## Migration Between Laptops

### For Development Work

1. Clone `TM-Case-Booking` repository
2. Run setup script: `./scripts/setup-environment.sh development`
3. Update `.env.development` with development branch credentials
4. Start coding immediately

### For Production Access

1. Clone `Live-CaseBooking` repository
2. Run setup script: `./scripts/setup-environment.sh production`
3. Ready for production deployment

## Supabase Branch Management

### Development Branch Features

- **Cost**: $0.01344 per hour (only when active)
- **Auto-pause**: After 5 minutes of inactivity
- **Migrations**: Automatically applied from your repository
- **Seed data**: Loaded on branch creation
- **Real-time**: Full Supabase features available

### Monitoring Costs

- Check branch usage in Supabase dashboard
- Development branches auto-pause to minimize costs
- Production branch runs continuously

## Security Notes

- Keep production credentials secure
- Never commit real API keys to development branch
- Use different OAuth app credentials for dev/prod
- Test all security features in development first

## Troubleshooting

### Branch Not Creating

- Ensure GitHub integration is properly configured
- Check that your repository has the supabase directory
- Verify migrations are in correct format

### Environment Variables Not Loading

- Check file names (.env.development vs .env.production)
- Ensure setup script has executable permissions
- Restart development server after environment changes

### Database Sync Issues

- Check migration file formats
- Ensure seed data is valid SQL
- Review Supabase logs in dashboard

## Support

For issues related to:
- **Supabase Branching**: Check Supabase documentation
- **Application Code**: Submit issues to respective repository
- **Environment Setup**: Review this documentation first