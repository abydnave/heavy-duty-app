-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Workouts table
create table workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  day_id text not null,
  exercises jsonb not null default '[]',
  created_at timestamptz default now() not null
);

-- Check-ins table
create table checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  bodyweight numeric,
  steps integer,
  created_at timestamptz default now() not null
);

-- Row Level Security: users can only see/edit their own data
alter table workouts enable row level security;
alter table checkins enable row level security;

create policy "Users read own workouts"  on workouts for select using (auth.uid() = user_id);
create policy "Users insert own workouts" on workouts for insert with check (auth.uid() = user_id);
create policy "Users delete own workouts" on workouts for delete using (auth.uid() = user_id);

create policy "Users read own checkins"  on checkins for select using (auth.uid() = user_id);
create policy "Users insert own checkins" on checkins for insert with check (auth.uid() = user_id);
create policy "Users delete own checkins" on checkins for delete using (auth.uid() = user_id);

-- Indexes for performance
create index workouts_user_id_idx on workouts(user_id);
create index workouts_day_id_idx on workouts(user_id, day_id);
create index checkins_user_id_idx on checkins(user_id);
