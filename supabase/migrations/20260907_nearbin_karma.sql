-- Run once in Supabase Dashboard > SQL Editor. This is the secure source of
-- truth for NearBin balances, welcome claims, referrals and audit history.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  ward text default 'Municipal Ward - Geotagged Zone',
  role text not null default 'citizen' check (role in ('citizen', 'worker', 'scrap_picker')),
  karma_points integer not null default 0 check (karma_points >= 0),
  verified_reports integer not null default 0,
  welcome_claimed_at timestamptz,
  referral_code text not null unique,
  referred_by uuid references public.profiles(id),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.karma_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  reason text not null check (reason in ('welcome_bonus', 'referral_inviter', 'referral_new_user', 'rewarded_ad')),
  external_reference text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.karma_transactions enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile" on public.profiles for select to authenticated using (auth.uid() = id);
-- Do not grant direct updates: without column-level protection, a client could
-- attempt to change karma_points. Profile edits should go through a narrow RPC.
drop policy if exists "Users can update basic profile details" on public.profiles;
drop policy if exists "Users can read their karma history" on public.karma_transactions;
create policy "Users can read their karma history" on public.karma_transactions for select to authenticated using (auth.uid() = user_id);

create or replace function public.bootstrap_profile(profile_name text default null, profile_avatar_url text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.profiles (id, full_name, avatar_url, referral_code)
  values (auth.uid(), profile_name, profile_avatar_url, upper(substr(replace(auth.uid()::text, '-', ''), 1, 8)))
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
end;
$$;

create or replace function public.claim_welcome_bonus()
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.profiles
  set karma_points = karma_points + 500, welcome_claimed_at = now(), updated_at = now()
  where id = auth.uid() and welcome_claimed_at is null
  returning karma_points into new_balance;
  if new_balance is null then raise exception 'Welcome bonus was already claimed'; end if;
  insert into public.karma_transactions (user_id, points, reason)
  values (auth.uid(), 500, 'welcome_bonus');
  return new_balance;
end;
$$;

-- Referral rewards are intentionally zero until Earth Relief sets its programme policy.
-- It records the referral safely without inventing a monetary reward amount.
create or replace function public.apply_referral(inviter_code text)
returns text language plpgsql security definer set search_path = public as $$
declare inviter_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select id into inviter_id from public.profiles where referral_code = upper(inviter_code);
  if inviter_id is null then raise exception 'Referral code was not found'; end if;
  if inviter_id = auth.uid() then raise exception 'You cannot use your own referral link'; end if;
  update public.profiles set referred_by = inviter_id, updated_at = now()
  where id = auth.uid() and referred_by is null;
  if not found then raise exception 'A referral has already been applied to this account'; end if;
  return 'Referral applied successfully';
end;
$$;

create or replace function public.update_my_profile(profile_name text, profile_phone text, profile_ward text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.profiles set
    full_name = nullif(trim(profile_name), ''),
    phone = nullif(trim(profile_phone), ''),
    ward = nullif(trim(profile_ward), ''),
    updated_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.bootstrap_profile(text, text) from public;
revoke all on function public.claim_welcome_bonus() from public;
revoke all on function public.apply_referral(text) from public;
revoke all on function public.update_my_profile(text, text, text) from public;
grant execute on function public.bootstrap_profile(text, text) to authenticated;
grant execute on function public.claim_welcome_bonus() to authenticated;
grant execute on function public.apply_referral(text) to authenticated;
grant execute on function public.update_my_profile(text, text, text) to authenticated;

-- Rewarded-ad credits are NOT client writable. An Edge Function receiving
-- Google AdMob server-side verification must insert an idempotent transaction
-- and update the balance using a Supabase secret/service-role key.
