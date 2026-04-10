# PROPLEDGER - Next.js

> CDA-Compliant Blockchain Real Estate Investment Platform

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your database credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

All detailed documentation is in the [`readme/`](./readme/) folder:

- **[README.md](./readme/README.md)** - Complete setup guide and documentation
- **[QUICKSTART.md](./readme/QUICKSTART.md)** - 5-minute quick start guide
- **[MIGRATION_SUMMARY.md](./readme/MIGRATION_SUMMARY.md)** - Backend migration details
- **[FRONTEND_MIGRATION_COMPLETE.md](./readme/FRONTEND_MIGRATION_COMPLETE.md)** - Frontend migration details
- **[PROPERTY_PAGES_GUIDE.md](./PROPERTY_PAGES_GUIDE.md)** - Properties, Crowdfunding & Investments listing pages
- **[DETAIL_PAGES_GUIDE.md](./DETAIL_PAGES_GUIDE.md)** - Property detail pages with ownership options

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Deployment**: Vercel

## 📁 Project Structure

```
propledger-nextjs/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   ├── (pages)/           # Frontend pages
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utilities (db, auth)
├── readme/                # Documentation
└── database-schema.sql    # PostgreSQL schema
```

## 🎯 What's Working

✅ **Backend**: All API routes functional  
✅ **Frontend**: Core pages (Home, Login, Signup, Dashboard)  
✅ **Listing Pages**: Properties, Crowdfunding, Investments with search & filters  
✅ **Detail Pages**: Full property details with ownership options (Full/Fractional)  
✅ **Authentication**: Full auth system with JWT  
✅ **Database**: PostgreSQL schema ready  
✅ **Components**: Navbar, LoadingScreen, PropertyCard  

## ⏳ In Progress

- Checkout/Payment page
- Messaging system UI
- Token purchase flow
- Agent dashboard

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or push to GitHub and import in [Vercel Dashboard](https://vercel.com)

## 📞 Support

For detailed setup instructions, troubleshooting, and guides, see the [documentation folder](./readme/).

---

**Status**: Backend 100% Complete | Frontend Core 75% Complete  
**Last Updated**: November 3, 2025
