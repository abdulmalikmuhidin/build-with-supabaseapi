create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

drop policy if exists "Anyone can read todos" on public.todos;
drop policy if exists "Anyone can create todos" on public.todos;
drop policy if exists "Anyone can update todos" on public.todos;
drop policy if exists "Anyone can delete todos" on public.todos;

create policy "Anyone can read todos"
  on public.todos for select to anon, authenticated
  using (true);

create policy "Anyone can create todos"
  on public.todos for insert to anon, authenticated
  with check (true);

create policy "Anyone can update todos"
  on public.todos for update to anon, authenticated
  using (true)
  with check (true);

create policy "Anyone can delete todos"
  on public.todos for delete to anon, authenticated
  using (true);

grant select, insert, update, delete on public.todos to anon, authenticated;
