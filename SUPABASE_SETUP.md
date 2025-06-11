# Supabase Setup for Persistent Download Tracking

## Overview
This setup replaces the local storage-only approach with a real database backend using Supabase for persistent download tracking across all users.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from the project settings

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Run Database Migrations

In your Supabase project dashboard:

1. Go to **SQL Editor**
2. Run the migration files in order:
   - First: `supabase/migrations/create_usage_stats.sql`
   - Second: `supabase/migrations/create_increment_function.sql`

### 4. Deploy Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the edge function:
   ```bash
   supabase functions deploy increment-downloads
   ```

### 5. Configure Netlify Environment Variables

In your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## How It Works

### Database Schema
- **usage_stats table**: Stores download counters with atomic updates
- **increment_downloads() function**: Safely increments counter and returns new value

### Edge Function
- **increment-downloads**: Handles both GET (fetch stats) and POST (increment) requests
- Provides CORS headers for browser compatibility
- Uses Supabase client for database operations

### Frontend Integration
- **useUsageCounter hook**: Updated to use Supabase backend
- Optimistic updates for better UX
- Fallback to localStorage if Supabase is unavailable
- Real-time stats across all users

### Features
- ✅ **Persistent storage**: Data survives browser sessions and deployments
- ✅ **Real-time updates**: All users see the same counter
- ✅ **Atomic operations**: No race conditions when incrementing
- ✅ **Fallback support**: Works offline with localStorage
- ✅ **Performance**: Edge functions for low latency
- ✅ **Scalable**: Handles high traffic with Supabase infrastructure

## Testing

1. **Local development**: Counter increments and persists in Supabase
2. **Production**: Real download tracking across all users
3. **Offline**: Graceful fallback to localStorage

## Monitoring

Monitor usage in Supabase dashboard:
1. Go to **Table Editor** → **usage_stats**
2. View real-time download counts
3. Check **Functions** → **increment-downloads** for logs

## Security

- Row Level Security (RLS) enabled
- Public read access for stats display
- Public update access only for incrementing
- No sensitive data exposure