# TM Case Booking System - Development Environment

A comprehensive React-based case booking application for medical procedures with role-based access control, status workflow management, and Supabase integration.

## 🏥 Overview

This is the **Development Environment** for the TM Case Booking System. It uses a separate Supabase database from the production environment to ensure safe testing and development.

### 🌐 Environment Information
- **Environment**: Development
- **Database**: Supabase Development Instance
- **Branch**: `development`
- **Local URL**: http://localhost:3000
- **Repository**: https://github.com/Mika-Nim/TM-Case-Booking

## ✨ Key Features

### 🔐 Authentication & Authorization
- Role-based access control system
- Multi-role support: Admin, Operations, Sales, Driver, IT
- Department and country-based access restrictions
- Secure session management

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
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mika-Nim/TM-Case-Booking.git
   cd TM-Case-Booking
   ```

2. **Switch to development branch**
   ```bash
   git checkout development
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.development .env
   ```

5. **Start development server**
   ```bash
   npm run dev:start
   # OR traditional way:
   npm start
   ```

6. **Access the application**
   - Open: http://localhost:3000
   - Use default admin credentials or create new users

## 📜 Available Scripts

### 🔧 Development Scripts
```bash
# Start development server
npm run dev:start

# Build for development testing
npm run dev:build

# Kill port 3000 (if stuck)
npm run kill:port

# Development with auto-restart
npm run dev:watch
```

### 🚀 Deployment Scripts
```bash
# Deploy to BOTH Development and Production (RECOMMENDED)
npm run deploy:both

# Quick deploy to both (no confirmations)
npm run deploy:quick

# Deploy to production only
npm run git:prod

# Full production deployment workflow
npm run deploy:production

# Build for production
npm run prod:build
```

### 🛠️ Utility Scripts
```bash
# TypeScript type checking
npm run typecheck

# Quick build (first 20 lines of output)
npm run quick-build

# Component analysis
npm run component-summary

# Bundle size analysis
npm run size-analysis

# Code optimization
npm run claude-optimize
```

### 📊 Git Management Scripts
```bash
# Push to development branch
npm run git:dev

# Push to production repository
npm run git:prod

# Create new version tag
npm run version:patch  # 1.2.0 -> 1.2.1
npm run version:minor  # 1.2.0 -> 1.3.0
npm run version:major  # 1.2.0 -> 2.0.0
```

## 🗃️ Database & Integration

### Supabase Configuration
- **Development Database**: `puppogbxzkppdesjvhev.supabase.co`
- **Real-time updates**: Enabled
- **Row Level Security**: Configured
- **Auto-migration**: On application start

### Data Models
- Cases with complete audit trail
- Users with role and department assignments
- Status history tracking
- File attachments support
- Amendment history

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS3 with custom design system
- **State Management**: React Context + Hooks
- **Build Tool**: Create React App
- **Deployment**: GitHub Actions → GitHub Pages

### Project Structure
```
src/
├── components/          # React components
├── services/           # API and database services
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── types/              # TypeScript type definitions
├── constants/          # Application constants
├── styles/             # CSS styles and themes
└── utils/              # Utility functions
```

## 🧪 Testing & Development

### Environment Variables
The application automatically uses development configuration:
- Development Supabase database
- Development OAuth settings
- Debug logging enabled

### Testing Features
- User role simulation
- Case workflow testing
- File upload testing
- Notification system testing
- Multi-country data testing

## 📱 Features in Detail

### Case Management
- Multi-step case creation wizard
- Advanced filtering and search
- Bulk operations support
- Export capabilities
- Amendment tracking

### User Experience
- Responsive design (mobile-first)
- Dark/light mode support
- Sound notifications
- Keyboard shortcuts
- Accessibility compliance

### File Management
- Image upload for delivery confirmation
- Attachment support for case completion
- Secure file storage via Supabase
- File size and type validation

## 🔄 Deployment Pipeline

### Development Workflow (RECOMMENDED)
1. **Develop**: Work on `development` branch with development Supabase database
2. **Test**: Test locally using `npm run dev:start`
3. **Deploy Both**: Use `npm run deploy:both` to deploy to both repositories
4. **Verify**: Test production at https://mika-nim.github.io/Live-CaseBooking/

### Deployment Commands

#### 🎯 Primary Deployment (Use This!)
```bash
npm run deploy:both
```
**What it does:**
- ✅ Commits and pushes to Development repository
- ✅ Builds with Production Supabase configuration
- ✅ Deploys to Production repository (GitHub Pages)
- ✅ Automatically switches environments
- ✅ Restores development environment

#### ⚡ Quick Deployment (For Rapid Iterations)
```bash
npm run deploy:quick
```
**What it does:**
- Same as `deploy:both` but faster (no confirmations)
- Perfect for quick feature testing

### Environment Configurations

| Environment | Repository | Database | Live URL |
|-------------|------------|----------|----------|
| **Development** | TM-Case-Booking | `puppogbxzkppdesjvhev.supabase.co` | localhost:3000 |
| **Production** | Live-CaseBooking | `yjllfmmzgnapsqfddbwt.supabase.co` | https://mika-nim.github.io/Live-CaseBooking/ |

### Automated Environment Switching
The deployment scripts automatically handle:
- ✅ Supabase database URLs
- ✅ Environment variables
- ✅ README files (dev vs prod)
- ✅ Package.json homepage URLs
- ✅ Build configurations

## 🐛 Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
npm run kill:port
```

**Database connection issues:**
```bash
# Check environment variables
cat .env
# Verify Supabase connection
npm run test:db
```

**Build failures:**
```bash
# Clean build
npm run clean && npm install
# Type check
npm run typecheck
```

### Debug Mode
Set environment variable for detailed logging:
```bash
REACT_APP_DEBUG=true npm start
```

## 📞 Support & Documentation

### Resources
- **Technical Documentation**: See `/docs` folder
- **API Documentation**: Supabase Dashboard
- **Component Guide**: `/src/components/README.md`
- **Deployment Guide**: `/.github/workflows/README.md`

### Getting Help
1. Check browser console for errors
2. Verify network connectivity to Supabase
3. Ensure proper environment configuration
4. Review application logs

## 🔐 Security

### Development Security
- Environment variables for sensitive data
- HTTPS enforcement in production
- Row-level security in database
- Input validation and sanitization
- XSS protection

## 📄 License

This project is proprietary software for TM Case Booking System.

---

**Version**: 1.2.1  
**Last Updated**: January 2025  
**Maintainer**: TM Development Team  
**Environment**: Development  