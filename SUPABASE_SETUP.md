# NearBin Supabase setup

The app uses Supabase for Google identity and protected Karma balances. The public URL and anon key are read from the ignored local `.env` file. Never place a `sb_secret_` or service-role key in the app, Hostinger files, or this repository.

## One-time dashboard setup

1. In **Supabase Dashboard → SQL Editor**, run [`supabase/migrations/20260907_nearbin_karma.sql`](supabase/migrations/20260907_nearbin_karma.sql).
2. In **Authentication → URL Configuration**, set the Site URL to `https://nearbin.agriheal.in` and add `https://nearbin.agriheal.in` and `https://nearbin.agriheal.in/` as Redirect URLs.
3. In **Authentication → Providers → Google**, enable Google and enter the OAuth client ID and client secret created in Google Cloud. In Google Cloud, use this authorised redirect URI:
   `https://<input text>.supabase.co/auth/v1/callback`
4. Build and upload the new Hostinger ZIP. A Google sign-in will create a zero-Karma profile. The citizen must tap **Claim** to receive the one-time 500 welcome points.

## Rewarded ads, before launch

The PWA intentionally does not award ad Karma. For Android, use a native rewarded-ad SDK and Google AdMob Server-Side Verification (SSV). The SSV handler must be a Supabase Edge Function holding the secret/service-role key in Supabase's own secret settings. It must reject duplicate AdMob transaction IDs before inserting the `rewarded_ad` karma transaction.

Use test unit during development: `input text`. Replace it only with a production **Rewarded** Ad Unit ID after Android testing is complete.
