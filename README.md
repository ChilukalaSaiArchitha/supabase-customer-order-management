# OrderDesk — Supabase Customer Order Management

A small React + Vite application demonstrating:
- Supabase email/password authentication (sign up, log in, log out)
- PostgreSQL CRUD operations (create, read, update, delete orders)
- Customer order management and status tracking
- Row Level Security (RLS), so each signed-in user can access only their own orders

## Setup

1. Create a project at https://supabase.com.
2. In Supabase, open **SQL Editor**, paste `supabase-schema.sql`, and run it.
3. In Supabase **Project Settings → API**, copy the Project URL and anon/publishable key.
4. Copy `.env.example` to `.env` and fill in your values:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```
5. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```
6. Open the local URL printed by Vite and create an account.

## Supabase Auth setting

For a quick demo, you can disable email confirmation under **Authentication → Providers → Email**. Otherwise, users must confirm their email before logging in. For production, keep confirmation enabled and configure your SMTP/email settings.

## Database

`orders` columns:
- `id`: generated primary key
- `user_id`: authenticated owner (`auth.users.id`)
- `customer_name`, `product_name`
- `quantity`, `total_amount`
- `status`: Pending, Processing, Shipped, Delivered, Cancelled
- `created_at`: creation timestamp

RLS policies protect SELECT, INSERT, UPDATE, and DELETE using `auth.uid() = user_id`.

## Notes

- Never put a Supabase `service_role` key in frontend code. Use only the anon/publishable key in this Vite app.
- The frontend validates basic required fields; database constraints and RLS provide additional protection.
- This is a learning/demo app, not a complete production commerce system (no payment processing, inventory, tax, or shipping integrations).
