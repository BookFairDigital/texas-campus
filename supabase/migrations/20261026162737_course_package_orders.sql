create table public.course_package_orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  package_slug text not null check (package_slug in ('digital-accounting','ai-accounting','complete-bundle')),
  package_name text not null check (length(trim(package_name)) between 1 and 160),
  course_ids uuid[] not null check (cardinality(course_ids) > 0),
  amount numeric not null check (amount > 0),
  currency text not null default 'LKR' check (currency = 'LKR'),
  payment_reference text not null check (length(trim(payment_reference)) between 2 and 120),
  payment_status text not null default 'pending' check (payment_status in ('pending','approved','rejected')),
  course_access boolean not null default false,
  created_at timestamptz not null default now(),
  admin_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  constraint package_order_access_matches_approval check ((payment_status = 'approved') = course_access)
);
create index course_package_orders_student_created_idx on public.course_package_orders (student_id, created_at desc);
create index course_package_orders_status_created_idx on public.course_package_orders (payment_status, created_at desc);
alter table public.course_package_orders enable row level security;
revoke all on public.course_package_orders from anon, authenticated;
grant select on public.course_package_orders to authenticated;
grant all on public.course_package_orders to service_role;
create policy "Students read own package orders"
  on public.course_package_orders for select to authenticated
  using ((select auth.uid()) = student_id);
