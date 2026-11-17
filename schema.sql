create table public.profiles (id uuid primary key references auth.users on delete cascade, email text, balance numeric(14,2) not null default 10000, is_admin boolean not null default false, created_at timestamptz default now());
create table public.holdings (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, category text, name text, amount numeric(14,2) not null, daily_yield numeric(6,3) not null, created_at timestamptz default now());
alter table public.profiles enable row level security; alter table public.holdings enable row level security;

create function public.is_admin() returns boolean language sql security definer stable set search_path=public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

create policy "read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "admin updates" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "read own holdings" on public.holdings for select using (user_id = auth.uid() or public.is_admin());
-- No insert/update policies for users: all changes go through functions below.

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as
$$ begin insert into public.profiles (id, email) values (new.id, new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.allocate(p_category text, p_name text, p_amount numeric, p_yield numeric) returns void
language plpgsql security definer set search_path=public as $$
begin
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  if p_yield < 0 or p_yield > 1 then raise exception 'Invalid yield'; end if;
  update public.profiles set balance = balance - p_amount where id = auth.uid() and balance >= p_amount;
  if not found then raise exception 'Not enough available credits'; end if;
  insert into public.holdings (user_id, category, name, amount, daily_yield) values (auth.uid(), p_category, p_name, p_amount, p_yield);
end $$;
