# Daymark To-dos

A lightweight React + TypeScript todo app backed by Supabase.

## Get started

1. Install dependencies with `npm install`.
2. Create a Supabase project.
3. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql).
4. Copy `.env.example` to `.env.local` and fill in the project URL and anon key from **Project Settings → API**.
5. Start the app with `npm run dev`.

The app supports creating, completing, deleting, and filtering tasks. Tasks are stored in the Supabase `public.todos` table.

## Data access note

This starter deliberately uses an open, shared todo list: anyone with the app can read and modify its tasks. The SQL enables Row Level Security but allows anonymous access so the app works without an authentication flow. Do not use this policy for private or personal data. Add Supabase Auth and user-scoped RLS policies before deploying a private todo app.
