/**
 * NGA Hub — Supabase Database Types
 * Auto-generated from multilingual education engine schema.
 * Reflects all 7 tables in the Global Education & Geospatial Access schema.
 */

// ─── Flexible JSON type for metadata columns ─────────────────────────────────
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/**
 * Subtitle track entry inside content_translations.metadata
 */
export interface SubtitleTrack {
  lang: string;   // ISO language code
  url: string;    // URL to .vtt or .srt file
}

/**
 * Shape of content_translations.metadata jsonb column.
 * Handles subtitle tracks, voice-over URLs, captions, and duration.
 */
export interface ContentMetadata {
  subtitles?: Array<{ lang: string; url: string }>;
  voiceover_url?: string;
  captions_url?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  [key: string]: Json | undefined;
}

// ─── Table row types ──────────────────────────────────────────────────────────

/** public.languages */
export interface Language {
  code: string;         // PK — e.g. 'en', 'sw', 'fr'
  name: string;         // e.g. 'English'
  native_name: string;  // e.g. 'Kiswahili'
}

/** public.universal_concepts */
export interface UniversalConcept {
  id: string;                       // UUID PK
  name: string;
  subject_area: string;             // e.g. 'Mathematics'
  parent_concept_id: string | null; // Recursive FK → self
}

/** public.syllabus_definitions */
export interface SyllabusDefinition {
  id: string;         // UUID PK
  name: string;       // e.g. 'Kenya CBC'
  region: string;     // e.g. 'East Africa'
  country: string;    // e.g. 'Kenya'
  created_at: string; // ISO timestamp
}

/** public.syllabus_topics_mapping */
export interface SyllabusTopicsMapping {
  id: string;          // UUID PK
  syllabus_id: string; // FK → syllabus_definitions.id
  topic_name: string;  // Local topic name in the syllabus
  concept_id: string;  // FK → universal_concepts.id
}

/** public.learning_content */
export type ContentType = 'video' | 'article' | 'quiz' | 'worksheet' | 'audio';

export interface LearningContent {
  id: string;           // UUID PK
  concept_id: string;   // FK → universal_concepts.id
  content_type: ContentType;
  created_at: string;   // ISO timestamp
}

/** public.content_translations */
export interface ContentTranslation {
  id: string;             // UUID PK
  content_id: string;     // FK → learning_content.id
  language_code: string;  // FK → languages.code
  title: string;
  asset_url: string;
  metadata: ContentMetadata; // jsonb — subtitle/voice-over tracks
}

/** public.schools */
export interface School {
  id: string;                  // UUID PK
  name: string;
  syllabus_id: string | null;  // FK → syllabus_definitions.id
  address: string | null;
  location: string | null;     // geography(POINT,4326) — serialized as GeoJSON string from PostgREST
}

/** public.students */
export interface Student {
  id: string;                          // UUID PK
  user_id: string;                     // FK → auth uid (Firebase or Supabase)
  preferred_language_code: string | null; // FK → languages.code
  user_location_point: string | null;  // geography(POINT,4326)
}

// ─── RPC return type ──────────────────────────────────────────────────────────

/** Return row from public.find_nearest_schools() */
export interface NearestSchool {
  school_id: string;
  school_name: string;
  address: string | null;
  syllabus_name: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
}

// ─── Full Database interface (mirrors Supabase generated shape) ───────────────

export interface Database {
  public: {
    Tables: {
      languages: {
        Row: Language;
        Insert: Omit<Language, never>;
        Update: Partial<Language>;
      };
      universal_concepts: {
        Row: UniversalConcept;
        Insert: Omit<UniversalConcept, 'id'> & { id?: string };
        Update: Partial<UniversalConcept>;
      };
      syllabus_definitions: {
        Row: SyllabusDefinition;
        Insert: Omit<SyllabusDefinition, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<SyllabusDefinition>;
      };
      syllabus_topics_mapping: {
        Row: SyllabusTopicsMapping;
        Insert: Omit<SyllabusTopicsMapping, 'id'> & { id?: string };
        Update: Partial<SyllabusTopicsMapping>;
      };
      learning_content: {
        Row: LearningContent;
        Insert: Omit<LearningContent, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<LearningContent>;
      };
      content_translations: {
        Row: ContentTranslation;
        Insert: Omit<ContentTranslation, 'id'> & { id?: string };
        Update: Partial<ContentTranslation>;
      };
      schools: {
        Row: School;
        Insert: Omit<School, 'id'> & { id?: string };
        Update: Partial<School>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id'> & { id?: string };
        Update: Partial<Student>;
      };
    };
    Functions: {
      find_nearest_schools: {
        Args: { user_lat: number; user_long: number; result_limit?: number };
        Returns: NearestSchool[];
      };
    };
  };
}
