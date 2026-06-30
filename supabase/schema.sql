-- Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- 1. Create Dokkan Characters Table
create table if not exists public.dokkan_characters (
    id integer primary key,
    name text not null,
    subname text,
    rarity integer,
    element integer,
    character_id integer,
    card_unique_info_id integer,
    leader_skill text,
    passive_skill_name text,
    passive_skill_description text,
    active_skill_name text,
    active_skill_effect text,
    active_skill_condition text,
    category_ids integer[] default '{}'::integer[],
    link_ids integer[] default '{}'::integer[],
    max_hp integer,
    max_atk integer,
    max_def integer,
    base_hp integer,
    base_atk integer,
    base_def integer,
    rainbow_hp integer,
    rainbow_atk integer,
    rainbow_def integer,
    tag text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for dokkan_characters
alter table public.dokkan_characters enable row level security;

-- Create policy to allow read access to everyone (public)
create policy "Allow public read access to characters" on public.dokkan_characters
    for select using (true);

-- 2. Create User Box Table
create table if not exists public.dokkan_user_box (
    user_id uuid references auth.users(id) on delete cascade not null,
    card_id integer references public.dokkan_characters(id) on delete cascade not null,
    level integer default 1,
    sa_level integer default 1,
    potential_percentage integer default 0,
    my_rating integer check (my_rating >= 1 and my_rating <= 10),
    my_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, card_id)
);

-- Enable RLS for dokkan_user_box
alter table public.dokkan_user_box enable row level security;

-- Create policies for user box
create policy "Allow users to view their own box" on public.dokkan_user_box
    for select using (auth.uid() = user_id);

create policy "Allow users to insert into their own box" on public.dokkan_user_box
    for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own box" on public.dokkan_user_box
    for update using (auth.uid() = user_id);

create policy "Allow users to delete from their own box" on public.dokkan_user_box
    for delete using (auth.uid() = user_id);

-- 3. Create User Teams Table
create table if not exists public.dokkan_user_teams (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    leader_id integer references public.dokkan_characters(id),
    sub_1_id integer references public.dokkan_characters(id),
    sub_2_id integer references public.dokkan_characters(id),
    sub_3_id integer references public.dokkan_characters(id),
    sub_4_id integer references public.dokkan_characters(id),
    sub_5_id integer references public.dokkan_characters(id),
    friend_leader_id integer references public.dokkan_characters(id),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for dokkan_user_teams
alter table public.dokkan_user_teams enable row level security;

-- Create policies for user teams
create policy "Allow users to view their own teams" on public.dokkan_user_teams
    for select using (auth.uid() = user_id);

create policy "Allow users to insert their own teams" on public.dokkan_user_teams
    for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own teams" on public.dokkan_user_teams
    for update using (auth.uid() = user_id);

create policy "Allow users to delete their own teams" on public.dokkan_user_teams
    for delete using (auth.uid() = user_id);
