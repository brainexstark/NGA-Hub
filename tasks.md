# Multilingual Education Engine — Task Checklist

## 1. Database Initialization
- [x] Enable PostGIS extension (`extensions.postgis`)
- [x] Create `public.languages` table (text PK: 'en', 'sw', 'fr', etc.)
- [x] Create `public.universal_concepts` table (recursive `parent_concept_id` FK)
- [x] Create `public.syllabus_definitions` table
- [x] Create `public.syllabus_topics_mapping` junction table
- [x] Create `public.learning_content` table
- [x] Create `public.content_translations` table (jsonb `metadata`)
- [x] Create `public.schools` table (`location geography(POINT,4326)`)
- [x] Create `public.students` table (`user_location_point geography(POINT,4326)`)

## 2. Performance Tuning
- [x] Standard B-tree indexes on all FK columns
- [x] GIST spatial index on `public.schools.location`
- [x] GIST spatial index on `public.students.user_location_point`

## 3. RPC / Stored Procedures
- [x] `public.find_nearest_schools(user_lat, user_long)` — KNN via `<->` operator

## 4. TypeScript Type Sync
- [x] Generate `src/lib/database.types.ts` reflecting all 7 tables
- [x] `metadata` column typed as flexible `Json` interface

## 5. Frontend Integration
- [x] Create `MultilingualEngine` component (`src/components/multilingual-engine.tsx`)
- [x] Add engine as additive section inside Learning Hub (no existing code modified)
- [x] Language selector, syllabus picker, nearest school finder, content browser
