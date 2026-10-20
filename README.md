# StockPilot IMS — Enterprise Inventory & Retail Management System

A complete full-stack inventory management system built with Next.js, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Features

- **Multi-tenant architecture** with organization and branch isolation
- **Role-based access control** with 8 roles (Super Admin, Owner, Shopkeeper, Inventory Manager, Staff, Procurement, Accountant, Auditor)
- **Product management** with categories, SKUs, barcodes, variants, batches, and expiry tracking
- **Inventory ledger** with stock movements, transfers, counts, adjustments, and reservations
- **Point of Sale (POS)** with cart management, barcode search, multiple payment methods, and invoice generation
- **Procurement** with suppliers, purchase requisitions, purchase orders, and goods receipts
- **Sales & Returns** with refund workflows and payment tracking
- **Finance** with expenses, payments, revenue, COGS, and profit tracking
- **Analytics & Reports** with charts, top products, branch comparisons, and ABC analysis
- **Notifications** with low-stock, expiry, and approval alerts
- **Audit logging** for all sensitive operations
- **Demo data** with realistic Indian retail sample records

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Next.js Server Actions & API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Auth**: NextAuth v5 (Credentials provider, JWT sessions)
- **Validation**: Zod

## Prerequisites

- Node.js 22+
- PostgreSQL 16+
- npm

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Set up database

```bash
# Create database
createdb stockpilot_ims

# Run migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed
```

### 4. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

All demo accounts use the password: `Demo@12345`

| Role | Email |
|------|-------|
| Owner | owner@urbanmart.demo |
| Shopkeeper | shopkeeper@urbanmart.demo |
| Inventory Manager | inventory@urbanmart.demo |
| Staff | staff@urbanmart.demo |
| Procurement | procurement@urbanmart.demo |
| Accountant | accountant@urbanmart.demo |
| Auditor | auditor@urbanmart.demo |
| Super Admin | admin@urbanmart.demo |

Visit [http://localhost:3000/demo-access](http://localhost:3000/demo-access) for one-click login buttons.

## Docker Setup

```bash
docker compose up -d
```

## Environment Variables

See `.env.example` for all configuration options.

## Testing

```bash
npm run build   # Type check and build
npm run lint    # Lint code
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Authenticated app routes
│   ├── (auth)/            # Login and demo access
│   ├── (unauthorized)/    # Unauthorized page
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Utilities, auth, permissions, db
└── types/                 # TypeScript type definitions
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Database migrations
└── seed.ts                # Seed script
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- Server-side authorization for every protected operation
- Organization and branch data isolation
- Rate limiting on authentication endpoints
- Audit logging for sensitive actions
- Secure cookie settings

## Known Limitations

- Email notifications are behind a configurable adapter (not configured in demo)
- Payment processing is simulated in demo mode
- AI forecasting uses transparent baseline methods, not trained models
- Offline PWA strategy is defined but not fully implemented

## License

MIT
