# Free Tier Development Setup

Since Supabase branching requires a Pro plan, here are practical alternatives for development/production separation on the free tier.

## Option 1: Separate Supabase Projects (Recommended)

### Step 1: Create Development Project

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Create New Project**:
   - Click "New Project"
   - Name: `TM-Case-Booking-Dev`
   - Database Password: (use a strong password)
   - Region: Same as your production project
   - Plan: Free

3. **Note Development Credentials**:
   - Project URL: `https://your-dev-project-ref.supabase.co`
   - Anon Key: `your-dev-anon-key`
   - Service Role Key: `your-dev-service-key`

### Step 2: Set Up Development Database

1. **Run Schema Setup**:
   - Go to SQL Editor in your dev project
   - Copy and run the contents of `database-schema.sql`
   - Copy and run the contents of `database-seed.sql`

2. **Verify Setup**:
   - Check that all tables are created
   - Verify seed data is loaded
   - Test RLS policies

### Step 3: Update Environment Configuration

```bash
# Update .env.development with actual dev project credentials
REACT_APP_SUPABASE_URL=https://your-actual-dev-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-dev-anon-key
```

### Step 4: Production Project

Keep your existing production project:
- URL: `https://yjllfmmzgnapsqfddbwt.supabase.co`
- Use existing credentials in `.env.production`

## Option 2: Local Development with Supabase CLI

### Prerequisites
```bash
# Install Docker (required for local Supabase)
# Install Supabase CLI
npm install -g supabase
```

### Setup Local Development
```bash
# In TM-Case-Booking directory
supabase start

# This will start local Supabase stack:
# - Postgres database
# - Supabase Studio
# - Auth server
# - Storage server
```

### Local Environment Configuration
```env
# .env.local
REACT_APP_SUPABASE_URL=http://localhost:54321
REACT_APP_SUPABASE_ANON_KEY=your-local-anon-key
REACT_APP_ENV=local
```

## Option 3: Shared Project with Data Prefixes

Use the same Supabase project but separate data using prefixes.

### Database Setup
```sql
-- Add environment column to tables
ALTER TABLE cases ADD COLUMN environment VARCHAR(20) DEFAULT 'production';
ALTER TABLE users ADD COLUMN environment VARCHAR(20) DEFAULT 'production';

-- Create RLS policies for environment separation
CREATE POLICY "Environment isolation for cases" ON cases
  FOR ALL USING (environment = current_setting('app.environment', true));
```

### Application Configuration
```typescript
// Set environment context
supabase.rpc('set_config', {
  parameter: 'app.environment',
  value: process.env.REACT_APP_ENV || 'production'
});
```

## Recommended Approach: Separate Projects

For your use case, **Option 1 (Separate Projects)** is recommended because:

- ✅ Complete data isolation
- ✅ No risk of affecting production data
- ✅ Free tier compatible
- ✅ Easy to manage
- ✅ Professional development practices

## Updated Environment Setup

### Development Environment
```bash
# In TM-Case-Booking
./scripts/setup-environment.sh development
npm start
# Uses dev Supabase project
```

### Production Environment
```bash
# In Live-CaseBooking  
./scripts/setup-environment.sh production
npm run build && npm run deploy
# Uses production Supabase project
```

## Cost Considerations

### Free Tier Limits (Per Project)
- **Database**: 500MB storage
- **Auth**: 50,000 monthly active users
- **Storage**: 1GB
- **Edge Functions**: 500K invocations
- **Realtime**: 200 concurrent connections

### Two Projects Impact
- Development project typically uses minimal resources
- Production limits remain the same
- Total cost: $0 (both projects on free tier)

## Migration Workflow

### Setting Up New Laptop for Development
```bash
# Clone development repository
git clone https://github.com/Mika-Nim/TM-Case-Booking.git
cd TM-Case-Booking

# Setup development environment (points to dev Supabase project)
./scripts/setup-environment.sh development

# Install and start
npm install
npm start
```

### Setting Up New Laptop for Production
```bash
# Clone production repository
git clone https://github.com/Mika-Nim/Live-CaseBooking.git
cd Live-CaseBooking

# Setup production environment (points to prod Supabase project)
./scripts/setup-environment.sh production

# Install and deploy
npm install
npm run build
npm run deploy
```

## Database Synchronization

### Keeping Schemas in Sync

1. **Schema Changes in Development**:
   ```bash
   # Test changes in dev project first
   # Document changes in migration files
   ```

2. **Deploy to Production**:
   ```bash
   # Manually run schema changes in production
   # Or use migration scripts
   ```

### Data Migration Script
```bash
# scripts/sync-schema.sh
#!/bin/bash

echo "🔄 Syncing schema from development to production..."

# Export schema from dev
supabase db dump --project-ref your-dev-ref --schema-only > dev-schema.sql

echo "📋 Schema exported. Review dev-schema.sql before applying to production."
echo "⚠️  Manual step: Apply schema changes to production project"
```

## Security Considerations

### Development Project
- Use test data only
- Different OAuth app credentials
- Relaxed RLS policies for testing
- Mock email services

### Production Project
- Real user data
- Production OAuth credentials
- Strict RLS policies
- Production email services

## Monitoring

### Development Project
- Monitor for unusual activity
- Regular cleanup of test data
- Resource usage tracking

### Production Project
- Standard production monitoring
- User activity tracking
- Performance monitoring

## Backup Strategy

### Development
- Not critical (test data)
- Periodic schema backups
- Migration file versioning

### Production
- Regular automated backups
- Point-in-time recovery setup
- Critical data protection

## Next Steps

1. **Create Development Supabase Project**
2. **Update .env.development with new credentials**
3. **Run database schema in dev project**
4. **Test development environment**
5. **Copy setup files to production repository**

This approach gives you the same benefits as branching but works perfectly with the free tier!