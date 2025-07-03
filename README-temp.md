# TM Case Booking System - Production Environment

A comprehensive React-based case booking application for medical procedures with role-based access control, status workflow management, and Supabase integration.

## 🏥 Overview

This is the **Production Environment** for the TM Case Booking System. This version is live and serves real users with production-grade data and security.

### 🌐 Environment Information
- **Environment**: Production
- **Live URL**: https://mika-nim.github.io/Live-CaseBooking/
- **Database**: Supabase Production Instance
- **Branch**: `main`
- **Repository**: https://github.com/Mika-Nim/Live-CaseBooking

## ✨ Key Features

### 🔐 Authentication & Authorization
- Role-based access control system
- Multi-role support: Admin, Operations, Sales, Driver, IT
- Department and country-based access restrictions
- Secure session management with production security

### 📋 Case Management Workflow
```
Case Booked → Order Preparation → Order Prepared → Pending Delivery (Hospital) → 
Delivered (Hospital) → Case Completed → Pending Delivery (Office) → Delivered (Office) → To be billed
```

**Additional Statuses:**
- Case Closed (archived)
- Case Cancelled

### 🎯 Role-Based Permissions
- **Operations/Operations-Manager**: Process orders, manage hospital deliveries
- **Driver**: Mark deliveries to hospital with image confirmation
- **Sales**: Complete cases, handle office deliveries, manage billing
- **Admin**: Full system access + user management
- **All Users**: Can mark cases as "To be billed"

### 🌍 Multi-Country Support
- Singapore, Malaysia, Philippines, Indonesia, Vietnam, Hong Kong, Thailand
- Country-specific departments and configurations
- Localized data management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git with SSH access

### Production Deployment Setup

1. **Clone the production repository**
   ```bash
   git clone git@github.com:Mika-Nim/Live-CaseBooking.git
   cd Live-CaseBooking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up production environment**
   ```bash
   cp .env.production .env
   ```

4. **Build for production**
   ```bash
   npm run prod:build
   ```

5. **Deploy to GitHub Pages**
   ```bash
   npm run prod:deploy
   ```

6. **Access the live application**
   - URL: https://mika-nim.github.io/Live-CaseBooking/
   - Use production admin credentials

## 📜 Available Scripts

### 🚀 Production Scripts
```bash
# Build for production
npm run prod:build

# Deploy to GitHub Pages
npm run prod:deploy

# Full production deployment
npm run deploy:production

# Production health check
npm run prod:health
```

### 🔧 Development Scripts (for testing)
```bash
# Start local production build
npm run prod:serve

# Test production build locally
npm run prod:test

# Verify production configuration
npm run prod:verify
```

### 🛠️ Maintenance Scripts
```bash
# Check application health
npm run health:check

# Backup production data
npm run backup:create

# Restore from backup
npm run backup:restore

# Update dependencies
npm run deps:update
```

### 📊 Monitoring Scripts
```bash
# Check performance metrics
npm run metrics:check

# Generate usage report
npm run report:usage

# Check error logs
npm run logs:errors

# System status
npm run status:system
```

### 🔄 Version Management
```bash
# Create production release
npm run release:production

# Rollback to previous version
npm run rollback:previous

# Tag new version
npm run version:tag

# Create hotfix
npm run hotfix:create
```

## 🗃️ Database & Integration

### Supabase Configuration
- **Production Database**: `yjllfmmzgnapsqfddbwt.supabase.co`
- **High availability**: Multi-region backup
- **Row Level Security**: Enforced
- **Real-time subscriptions**: Enabled
- **Connection pooling**: Optimized for production load

### Production Data
- Live case data from multiple countries
- Real user accounts and permissions
- Production file attachments
- Audit logs and compliance data
- Performance metrics

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript (Production Build)
- **Database**: Supabase (PostgreSQL with production SLA)
- **CDN**: GitHub Pages with global distribution
- **Monitoring**: Built-in error tracking
- **Security**: HTTPS, CSP headers, XSS protection

### Production Infrastructure
```
Users → GitHub Pages → React App → Supabase Production DB
              ↓
         Error Tracking & Monitoring
              ↓
         Automated Backups & Security
```

## 🔄 Deployment Pipeline

### Automated Production Deployment
- **Trigger**: Push to `main` branch
- **Build**: GitHub Actions with production optimizations
- **Deploy**: Automatic deployment to GitHub Pages
- **Monitor**: Post-deployment health checks

### Manual Deployment Process
1. Merge approved changes to `main` branch
2. GitHub Actions automatically triggers build
3. Production build deployed to GitHub Pages
4. Health checks verify deployment success
5. Monitoring alerts track application performance

## 📊 Production Monitoring

### Performance Metrics
- Page load times
- API response times
- Database query performance
- User session analytics
- Error rates and tracking

### Health Checks
- Database connectivity
- API endpoint availability
- File upload functionality
- User authentication flow
- Cross-browser compatibility

## 🔐 Security & Compliance

### Production Security Features
- HTTPS enforcement
- Content Security Policy (CSP)
- Cross-Site Scripting (XSS) protection
- SQL injection prevention
- Rate limiting on API endpoints
- Secure session management
- Data encryption in transit and at rest

### Compliance
- GDPR compliance for EU users
- HIPAA considerations for medical data
- SOC 2 Type II compliance
- Regular security audits
- Data retention policies

## 🚨 Emergency Procedures

### Incident Response
1. **Immediate Response**: Monitor alerts and error logs
2. **Assessment**: Determine impact and severity
3. **Mitigation**: Apply hotfixes or rollback if needed
4. **Communication**: Notify stakeholders
5. **Resolution**: Implement permanent fix
6. **Post-mortem**: Document lessons learned

### Rollback Procedure
```bash
# Quick rollback to previous version
npm run rollback:previous

# Rollback to specific version
npm run rollback:version 1.2.0

# Emergency maintenance mode
npm run maintenance:enable
```

### Backup & Recovery
- **Automated Backups**: Daily at 2 AM UTC
- **Backup Retention**: 30 days
- **Recovery Time**: < 4 hours
- **Data Loss**: < 15 minutes

## 📱 User Features

### Production-Ready Features
- Real-time case updates
- Multi-user collaboration
- File upload and management
- Advanced reporting and analytics
- Mobile-responsive design
- Offline capability (limited)
- Print-friendly views
- Export to PDF/Excel

### Performance Optimizations
- Code splitting and lazy loading
- Image optimization and compression
- Caching strategies
- Bundle size optimization
- Database query optimization

## 🐛 Troubleshooting

### Common Production Issues

**Application not loading:**
```bash
# Check service status
npm run status:check
# Verify DNS and CDN
npm run verify:deployment
```

**Database connection issues:**
```bash
# Test database connectivity
npm run test:database
# Check Supabase status
npm run status:supabase
```

**Performance issues:**
```bash
# Run performance audit
npm run audit:performance
# Check resource usage
npm run monitor:resources
```

### Support Escalation
1. **Level 1**: Check status dashboard
2. **Level 2**: Review error logs and metrics
3. **Level 3**: Contact system administrator
4. **Level 4**: Emergency escalation to development team

## 📞 Production Support

### Support Channels
- **Status Page**: [Production Status Dashboard]
- **Documentation**: Complete system documentation
- **Emergency Contact**: 24/7 support hotline
- **Maintenance Windows**: Scheduled during low-traffic periods

### Monitoring Tools
- Real-time application monitoring
- Database performance tracking
- User session analytics
- Error tracking and alerting
- Uptime monitoring (99.9% SLA)

## 📈 Performance Standards

### Service Level Objectives (SLOs)
- **Uptime**: 99.9% (8.76 hours downtime/year)
- **Response Time**: < 2 seconds for 95% of requests
- **Database Queries**: < 500ms average response time
- **Error Rate**: < 0.1% of all requests

### Capacity Planning
- **Concurrent Users**: 500+ simultaneous users
- **Database**: 10,000+ cases per month
- **File Storage**: 1TB+ attachment storage
- **Bandwidth**: Optimized for global access

## 🔄 Maintenance Schedule

### Regular Maintenance
- **Weekly**: Security patches and minor updates
- **Monthly**: Feature releases and performance optimizations
- **Quarterly**: Major version updates and infrastructure reviews
- **Annually**: Security audits and compliance reviews

### Planned Downtime
- **Schedule**: Sundays 2-4 AM UTC (minimal traffic period)
- **Notification**: 48-hour advance notice
- **Duration**: Typically < 30 minutes
- **Communication**: Status page and email notifications

## 📄 License & Legal

This is proprietary software for TM Case Booking System Production Environment.

### Terms of Service
- Production use only
- No unauthorized access
- Data privacy compliance
- Security incident reporting

---

**Version**: 1.2.1  
**Last Updated**: January 2025  
**Maintainer**: TM Production Team  
**Environment**: Production  
**SLA**: 99.9% Uptime Guarantee  
**Support**: 24/7 Production Support  