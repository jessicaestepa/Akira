# Aqüira

A curated marketplace for acquiring private companies in Latin America.

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **i18n:** Route-based locales (en, es, pt)

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project

### 1. Clone the repository

```bash
git clone https://github.com/jessicaestepa/Aqüira.git
cd Aqüira
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials and an admin password:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
```

### 4. Set up the database

Run the SQL migration files in your Supabase SQL editor in order:

1. `supabase/migrations/001_initial_schema.sql` — creates tables and indexes
2. `supabase/migrations/002_seed_deals.sql` — inserts sample deals

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Public pages (en/es/pt)
│   │   ├── page.tsx       # Home
│   │   ├── sell/          # Seller form
│   │   ├── buyers/        # Buyer form
│   │   ├── deals/         # Public deals
│   │   ├── thank-you/     # Confirmation
│   │   └── privacy/       # Privacy policy
│   ├── admin/             # Admin dashboard
│   │   ├── sellers/       # Seller submissions
│   │   ├── buyers/        # Buyer submissions
│   │   └── deals/         # Deal management
│   └── api/admin/login/   # Admin auth endpoint
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Navbar, Footer
│   ├── forms/             # Seller & Buyer forms
│   ├── deals/             # Deal card
│   └── admin/             # Status badges
├── lib/
│   ├── supabase/          # Client & types
│   ├── i18n/              # Config & dictionaries
│   ├── schemas/           # Zod validation
│   └── actions/           # Server actions
```

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Deploy

## Admin Access

Navigate to `/admin` and enter the password set in `ADMIN_PASSWORD`.

## Localization

The app supports three locales via route prefixes:

- `/en` — English
- `/es` — Spanish
- `/pt` — Portuguese

Translation files are in `src/lib/i18n/dictionaries/`.
