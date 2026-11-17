# VANTORA — virtual asset simulation (demo credits only, no real money)

## 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor → paste and run `supabase/schema.sql`.
3. Project Settings → API: copy the Project URL and the anon public key.
4. Authentication → Providers → Email. For instant demo logins, turn off "Confirm email".
5. Sign up in the app, then make yourself admin in the SQL Editor:
   `update public.profiles set is_admin = true where email = 'you@example.com';`
   (Users who existed before running the schema need a profiles row: `insert into public.profiles (id,email) select id,email from auth.users on conflict do nothing;`)

## 2. Run locally
    cp .env.local.example .env.local   # fill in the two values
    npm install && npm run dev

## 3. Deploy to Vercel
1. Push this folder to GitHub.
2. vercel.com → Add New Project → import the repo (framework: Next.js is auto-detected).
3. Add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. In Supabase → Authentication → URL Configuration, set Site URL to your Vercel URL.

## Security notes
- Admin access is enforced by Row Level Security (`is_admin()`), not just the UI. Users cannot edit balances or is_admin.
- Allocations run through the `allocate` SQL function, which checks balance atomically.
- The simulation clock (1 minute = 1 day) is computed in the browser from holding timestamps; nothing is paid out.
