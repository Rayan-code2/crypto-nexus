
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE (Improved constraints)
create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  wallet_address text,
  sponsor_id uuid references public.users(id),
  matrix_parent_id uuid references public.users(id),
  matrix_position text check (matrix_position in ('left', 'right')),
  level integer default 1,
  -- Check constraint modified to be case-insensitive using lower()
  role text default 'user' check (lower(role) in ('user', 'admin')),
  is_blocked boolean default false,
  created_at timestamp with time zone default now()
);

-- 2. WALLETS TABLE
create table if not exists public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  balance decimal(16, 2) default 0.00,
  total_earned decimal(16, 2) default 0.00,
  total_withdrawn decimal(16, 2) default 0.00
);

-- 3. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) not null,
  type text not null check (type in ('direct', 'level', 'pool', 'roi', 'task', 'exchange')),
  amount decimal(16, 2) not null,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default now()
);

-- 4. AUTOMATIC LOWERCASE TRIGGER
-- This ensures that even if you type "ADMIN" in Supabase, it becomes "admin" automatically
create or replace function public.ensure_lowercase_role()
returns trigger as $$
begin
  new.role := lower(new.role);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_role_change on public.users;
create trigger on_user_role_change
  before insert or update of role on public.users
  for each row execute procedure public.ensure_lowercase_role();

-- 5. RECURSION FIX: Security Definer Function (Case Insensitive)
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users 
    where id = user_id and lower(role) = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 6. RLS POLICIES
alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "user_read_own" on public.users;
drop policy if exists "admin_read_all" on public.users;
drop policy if exists "wallet_read_own" on public.wallets;
drop policy if exists "transaction_read_own" on public.transactions;

create policy "user_read_own" on public.users
  for select using (auth.uid() = id);

create policy "admin_read_all" on public.users
  for all using (is_admin(auth.uid()));

create policy "wallet_read_own" on public.wallets
  for select using (auth.uid() = user_id);

create policy "transaction_read_own" on public.transactions
  for select using (auth.uid() = user_id);

-- 7. TRIGGER FOR AUTOMATIC PROFILE
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'user');

  insert into public.wallets (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
