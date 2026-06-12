-- FluentForge · Migration 001 · Initial schema
-- Tables: profiles, words, user_word_progress

-- Profiles: extends auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  display_name text,
  xp integer not null default 0,
  level integer not null default 1,
  streak_count integer not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Words: the word bank
create table public.words (
  id bigint generated always as identity primary key,
  word text not null,
  definition text not null,
  part_of_speech text,
  frequency_rank integer,
  example_sentence text,
  image_url text,
  audio_url text,
  phonetic text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

-- User word progress: SRS state per user per word
create table public.user_word_progress (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  word_id bigint references public.words(id) on delete cascade not null,
  status text not null default 'new'
    check (status in ('new', 'learning', 'review', 'mastered')),
  interval_days integer not null default 1,
  ease_factor numeric(4,2) not null default 2.50,
  due_date date not null default current_date,
  reps integer not null default 0,
  lapses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, word_id)
);

-- Indexes
create index on public.user_word_progress(user_id, due_date);
create index on public.user_word_progress(user_id, status);
create index on public.words(frequency_rank);

-- RLS
alter table public.profiles enable row level security;
alter table public.words enable row level security;
alter table public.user_word_progress enable row level security;

-- RLS: profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- RLS: words (read-only for all authenticated users)
create policy "Authenticated users can read words"
  on public.words for select to authenticated using (true);

-- RLS: user_word_progress
create policy "Users can view own progress"
  on public.user_word_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress"
  on public.user_word_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress"
  on public.user_word_progress for update using (auth.uid() = user_id);

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_user_word_progress_updated_at
  before update on public.user_word_progress
  for each row execute procedure public.set_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
