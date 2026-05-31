-- ============================================================
-- NGA Hub — Multilingual Education Engine Migration
-- Production-ready schema with PostGIS geospatial support
-- ============================================================

-- 1. Enable PostGIS
create extension if not exists postgis with schema extensions;

-- ============================================================
-- CORE LOOKUP & CONFIG
-- ============================================================

create table if not exists public.languages (
  code        text primary key,          -- e.g. 'en', 'sw', 'fr', 'ar'
  name        text not null,             -- e.g. 'English'
  native_name text not null              -- e.g. 'Kiswahili'
);

comment on table public.languages is 'ISO language codes and display names for the multilingual engine.';

-- Seed common languages
insert into public.languages (code, name, native_name) values
  ('en', 'English',    'English'),
  ('sw', 'Swahili',    'Kiswahili'),
  ('fr', 'French',     'Français'),
  ('ar', 'Arabic',     'العربية'),
  ('pt', 'Portuguese', 'Português'),
  ('ha', 'Hausa',      'Hausa'),
  ('yo', 'Yoruba',     'Yorùbá'),
  ('zu', 'Zulu',       'isiZulu'),
  ('am', 'Amharic',    'አማርኛ'),
  ('es', 'Spanish',    'Español')
on conflict (code) do nothing;

-- ============================================================
-- UNIVERSAL KNOWLEDGE BASE
-- ============================================================

create table if not exists public.universal_concepts (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  subject_area      text not null,       -- e.g. 'Mathematics', 'Science'
  parent_concept_id uuid references public.universal_concepts(id) on delete set null
  -- Recursive self-reference for concept hierarchy
);

comment on table public.universal_concepts is 'Universal curriculum concepts, language-agnostic. Supports recursive parent-child hierarchy.';
comment on column public.universal_concepts.parent_concept_id is 'Recursive FK — allows concept trees (e.g. Algebra → Quadratics).';

create index if not exists idx_universal_concepts_parent on public.universal_concepts(parent_concept_id);
create index if not exists idx_universal_concepts_subject on public.universal_concepts(subject_area);

-- ============================================================
-- SYLLABUS DEFINITIONS
-- ============================================================

create table if not exists public.syllabus_definitions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,             -- e.g. 'Kenya CBC', 'Nigeria NERDC'
  region     text not null,             -- e.g. 'East Africa'
  country    text not null,             -- e.g. 'Kenya'
  created_at timestamptz not null default now()
);

comment on table public.syllabus_definitions is 'Hyper-localized regional syllabi mapped to universal concepts.';

create index if not exists idx_syllabus_definitions_country on public.syllabus_definitions(country);

-- ============================================================
-- SYLLABUS & CONTENT JUNCTIONS
-- ============================================================

create table if not exists public.syllabus_topics_mapping (
  id           uuid primary key default gen_random_uuid(),
  syllabus_id  uuid not null references public.syllabus_definitions(id) on delete cascade,
  topic_name   text not null,           -- local topic name in the syllabus
  concept_id   uuid not null references public.universal_concepts(id) on delete cascade
);

comment on table public.syllabus_topics_mapping is 'Maps regional syllabus topics to universal concepts.';

create index if not exists idx_stm_syllabus_id  on public.syllabus_topics_mapping(syllabus_id);
create index if not exists idx_stm_concept_id   on public.syllabus_topics_mapping(concept_id);

-- ============================================================
-- LEARNING CONTENT
-- ============================================================

create table if not exists public.learning_content (
  id           uuid primary key default gen_random_uuid(),
  concept_id   uuid not null references public.universal_concepts(id) on delete cascade,
  content_type text not null check (content_type in ('video','article','quiz','worksheet','audio')),
  created_at   timestamptz not null default now()
);

comment on table public.learning_content is 'Language-agnostic learning assets linked to universal concepts.';

create index if not exists idx_learning_content_concept on public.learning_content(concept_id);
create index if not exists idx_learning_content_type    on public.learning_content(content_type);

-- ============================================================
-- CONTENT TRANSLATIONS
-- ============================================================

create table if not exists public.content_translations (
  id            uuid primary key default gen_random_uuid(),
  content_id    uuid not null references public.learning_content(id) on delete cascade,
  language_code text not null references public.languages(code) on delete cascade,
  title         text not null,
  asset_url     text not null,
  -- Flexible jsonb for subtitle tracks, voice-over metadata, captions, etc.
  metadata      jsonb not null default '{}'::jsonb,
  unique (content_id, language_code)
);

comment on table public.content_translations is 'Per-language translations of learning assets. metadata holds subtitle/voice-over track info.';
comment on column public.content_translations.metadata is 'jsonb: { subtitles: [{lang, url}], voiceover_url, captions_url, duration_seconds, ... }';

create index if not exists idx_ct_content_id    on public.content_translations(content_id);
create index if not exists idx_ct_language_code on public.content_translations(language_code);

-- ============================================================
-- USER LOCATION & ACCESS — SCHOOLS
-- ============================================================

create table if not exists public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  syllabus_id uuid references public.syllabus_definitions(id) on delete set null,
  address     text,
  -- PostGIS geography point: SRID 4326 (WGS84 lat/long)
  location    extensions.geography(POINT, 4326)
);

comment on table public.schools is 'Schools with geospatial coordinates for KNN nearest-school queries.';

create index if not exists idx_schools_syllabus_id on public.schools(syllabus_id);
-- GIST spatial index — required for fast <-> KNN distance queries
create index if not exists idx_schools_location_gist on public.schools using gist(location);

-- ============================================================
-- USER LOCATION & ACCESS — STUDENTS
-- ============================================================

create table if not exists public.students (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 text not null unique,  -- FK to Firebase/Supabase auth uid
  preferred_language_code text references public.languages(code) on delete set null,
  -- Student's current GPS coordinate
  user_location_point     extensions.geography(POINT, 4326)
);

comment on table public.students is 'Student profiles with language preference and GPS location for nearest-school lookup.';

create index if not exists idx_students_user_id       on public.students(user_id);
create index if not exists idx_students_language_code on public.students(preferred_language_code);
-- GIST spatial index on student location
create index if not exists idx_students_location_gist on public.students using gist(user_location_point);

-- ============================================================
-- RPC: find_nearest_schools
-- Returns the N nearest schools to a given lat/long coordinate
-- Uses PostGIS KNN <-> operator for optimal index performance
-- ============================================================

create or replace function public.find_nearest_schools(
  user_lat  float,
  user_long float,
  result_limit int default 5
)
returns table (
  school_id       uuid,
  school_name     text,
  address         text,
  syllabus_name   text,
  country         text,
  latitude        float,
  longitude       float,
  distance_meters float
)
language sql
stable
as $$
  select
    s.id                                                          as school_id,
    s.name                                                        as school_name,
    s.address,
    sd.name                                                       as syllabus_name,
    sd.country,
    st_y(s.location::geometry)                                   as latitude,
    st_x(s.location::geometry)                                   as longitude,
    st_distance(
      s.location,
      st_point(user_long, user_lat)::extensions.geography
    )                                                             as distance_meters
  from public.schools s
  left join public.syllabus_definitions sd on sd.id = s.syllabus_id
  where s.location is not null
  order by s.location <-> st_point(user_long, user_lat)::extensions.geography
  limit result_limit;
$$;

comment on function public.find_nearest_schools is
  'KNN nearest-school lookup using PostGIS <-> operator. Returns school name, syllabus, coordinates, and distance in metres.';

-- ============================================================
-- RLS: Enable row-level security (open read for now)
-- ============================================================

alter table public.languages              enable row level security;
alter table public.universal_concepts     enable row level security;
alter table public.syllabus_definitions   enable row level security;
alter table public.syllabus_topics_mapping enable row level security;
alter table public.learning_content       enable row level security;
alter table public.content_translations   enable row level security;
alter table public.schools                enable row level security;
alter table public.students               enable row level security;

-- Public read access for lookup tables
create policy "public read languages"           on public.languages              for select using (true);
create policy "public read concepts"            on public.universal_concepts     for select using (true);
create policy "public read syllabi"             on public.syllabus_definitions   for select using (true);
create policy "public read topic mappings"      on public.syllabus_topics_mapping for select using (true);
create policy "public read content"             on public.learning_content       for select using (true);
create policy "public read translations"        on public.content_translations   for select using (true);
create policy "public read schools"             on public.schools                for select using (true);
-- Students: each user reads only their own row
create policy "students own row"                on public.students               for select using (user_id = auth.uid()::text);
create policy "students insert own row"         on public.students               for insert with check (user_id = auth.uid()::text);
create policy "students update own row"         on public.students               for update using (user_id = auth.uid()::text);
