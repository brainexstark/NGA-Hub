'use client';

/**
 * MultilingualEngine
 * ------------------
 * Additive section for the Learning Hub.
 * - Language selector (from public.languages)
 * - Syllabus picker (from public.syllabus_definitions)
 * - Concept browser → content translations in chosen language
 * - Nearest school finder via find_nearest_schools() RPC
 *
 * Does NOT modify any existing Learning Hub code.
 */

import * as React from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import {
  Globe,
  BookOpen,
  MapPin,
  PlayCircle,
  Loader2,
  Navigation,
  School,
  ChevronDown,
  Languages,
  Layers,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import type {
  Language,
  SyllabusDefinition,
  UniversalConcept,
  ContentTranslation,
  NearestSchool,
} from '../lib/database.types';

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <h3 className="font-headline text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary" />
      {label}
    </h3>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all',
        active
          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
          : 'bg-white/5 text-white/60 border-white/10 hover:border-primary/40 hover:text-white'
      )}
    >
      {children}
    </button>
  );
}

// ─── Nearest Schools Panel ────────────────────────────────────────────────────

function NearestSchoolsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [schools, setSchools] = React.useState<NearestSchool[]>([]);
  const [located, setLocated] = React.useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', description: 'Your browser does not support GPS.' });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const { data, error } = await supabase.rpc('find_nearest_schools', {
            user_lat: latitude,
            user_long: longitude,
            result_limit: 5,
          });
          if (error) throw error;
          setSchools((data as NearestSchool[]) || []);
          setLocated(true);
        } catch (err: any) {
          toast({ title: 'School lookup failed', description: err?.message || 'Could not fetch nearest schools.' });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        toast({ title: 'Location denied', description: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      <SectionHeading icon={MapPin} label="Nearest Schools" />
      <p className="text-[11px] text-white/40 font-medium">
        Uses PostGIS KNN to find the closest schools to your GPS location.
      </p>

      {!located && (
        <Button
          onClick={handleLocate}
          disabled={loading}
          className="h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Locating...' : 'Find Nearest Schools'}
        </Button>
      )}

      {located && schools.length === 0 && (
        <p className="text-xs text-white/40 italic">No schools found near your location yet.</p>
      )}

      <div className="space-y-3">
        {schools.map((s, i) => (
          <Card
            key={s.school_id}
            className="border border-white/5 bg-black/20 rounded-2xl p-4 flex items-start gap-4"
          >
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-sm">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-white truncate">{s.school_name}</p>
              {s.address && (
                <p className="text-[10px] text-white/40 truncate mt-0.5">{s.address}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {s.syllabus_name && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {s.syllabus_name}
                  </span>
                )}
                {s.country && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                    {s.country}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-sm text-white tabular-nums">
                {s.distance_meters < 1000
                  ? `${Math.round(s.distance_meters)}m`
                  : `${(s.distance_meters / 1000).toFixed(1)}km`}
              </p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest">away</p>
            </div>
          </Card>
        ))}
      </div>

      {located && (
        <button
          onClick={() => { setLocated(false); setSchools([]); handleLocate(); }}
          className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
        >
          Refresh Location
        </button>
      )}
    </div>
  );
}

// ─── Content Browser ──────────────────────────────────────────────────────────

function ContentBrowser({
  languageCode,
  syllabusId,
}: {
  languageCode: string;
  syllabusId: string | null;
}) {
  const [concepts, setConcepts] = React.useState<UniversalConcept[]>([]);
  const [activeConcept, setActiveConcept] = React.useState<string | null>(null);
  const [translations, setTranslations] = React.useState<ContentTranslation[]>([]);
  const [loadingConcepts, setLoadingConcepts] = React.useState(false);
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null);

  // Load concepts for the selected syllabus
  React.useEffect(() => {
    if (!syllabusId) return;
    setLoadingConcepts(true);
    setActiveConcept(null);
    setTranslations([]);

    supabase
      .from('syllabus_topics_mapping')
      .select('concept_id, topic_name, universal_concepts(id, name, subject_area)')
      .eq('syllabus_id', syllabusId)
      .limit(20)
      .then(({ data }) => {
        if (data) {
          const unique = new Map<string, UniversalConcept>();
          data.forEach((row: any) => {
            const c = row.universal_concepts;
            if (c && !unique.has(c.id)) unique.set(c.id, c);
          });
          setConcepts(Array.from(unique.values()));
        }
        setLoadingConcepts(false);
      });
  }, [syllabusId]);

  // Load translations when concept + language selected
  React.useEffect(() => {
    if (!activeConcept || !languageCode) return;
    setLoadingContent(true);
    setTranslations([]);

    supabase
      .from('content_translations')
      .select('*, learning_content!inner(concept_id)')
      .eq('language_code', languageCode)
      .eq('learning_content.concept_id', activeConcept)
      .limit(10)
      .then(({ data }) => {
        if (data) setTranslations(data as ContentTranslation[]);
        setLoadingContent(false);
      });
  }, [activeConcept, languageCode]);

  if (!syllabusId) {
    return (
      <p className="text-xs text-white/30 italic">Select a syllabus above to browse content.</p>
    );
  }

  return (
    <div className="space-y-4">
      {loadingConcepts ? (
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading concepts...
        </div>
      ) : concepts.length === 0 ? (
        <p className="text-xs text-white/30 italic">No concepts mapped for this syllabus yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {concepts.map((c) => (
            <Pill
              key={c.id}
              active={activeConcept === c.id}
              onClick={() => setActiveConcept(c.id)}
            >
              {c.name}
            </Pill>
          ))}
        </div>
      )}

      {activeConcept && (
        <div className="space-y-3 mt-2">
          {loadingContent ? (
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading content...
            </div>
          ) : translations.length === 0 ? (
            <p className="text-xs text-white/30 italic">
              No content available in this language for the selected concept yet.
            </p>
          ) : (
            translations.map((t) => (
              <Card
                key={t.id}
                className="border border-white/5 bg-black/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all group"
                onClick={() => setPlayingUrl(t.asset_url)}
              >
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-white truncate">{t.title}</p>
                  {t.metadata?.duration_seconds && (
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {Math.round((t.metadata.duration_seconds as number) / 60)} min
                    </p>
                  )}
                  {Array.isArray(t.metadata?.subtitles) && (t.metadata.subtitles as any[]).length > 0 && (
                    <p className="text-[9px] text-primary/60 mt-0.5 uppercase tracking-widest font-black">
                      {(t.metadata.subtitles as any[]).length} subtitle track(s)
                    </p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Inline player */}
      {playingUrl && (
        <div className="mt-4 rounded-2xl overflow-hidden border border-primary/20 bg-black aspect-video relative">
          <button
            onClick={() => setPlayingUrl(null)}
            className="absolute top-3 right-3 z-10 bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 hover:bg-black/80 transition-all"
          >
            Close
          </button>
          <iframe
            src={playingUrl}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function MultilingualEngine() {
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [syllabi, setSyllabi] = React.useState<SyllabusDefinition[]>([]);
  const [selectedLang, setSelectedLang] = React.useState<string>('en');
  const [selectedSyllabus, setSelectedSyllabus] = React.useState<string | null>(null);
  const [loadingLangs, setLoadingLangs] = React.useState(true);
  const [loadingSyllabi, setLoadingSyllabi] = React.useState(true);
  const [showLangPicker, setShowLangPicker] = React.useState(false);

  // Load languages
  React.useEffect(() => {
    supabase
      .from('languages')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setLanguages(data as Language[]);
        setLoadingLangs(false);
      });
  }, []);

  // Load syllabi
  React.useEffect(() => {
    supabase
      .from('syllabus_definitions')
      .select('*')
      .order('country')
      .then(({ data }) => {
        if (data) setSyllabi(data as SyllabusDefinition[]);
        setLoadingSyllabi(false);
      });
  }, []);

  const activeLang = languages.find((l) => l.code === selectedLang);

  return (
    <section className="space-y-10 border-t border-white/5 pt-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Languages className="h-6 w-6 text-primary" />
            Multilingual Education Engine
          </h2>
          <p className="text-[11px] text-white/40 font-medium uppercase tracking-widest">
            Hyper-localized syllabi · PostGIS school finder · Multi-language content
          </p>
        </div>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker((p) => !p)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-white font-black text-xs uppercase tracking-widest hover:bg-primary/20 transition-all"
          >
            <Globe className="h-4 w-4 text-primary" />
            {loadingLangs ? '...' : activeLang ? `${activeLang.native_name} (${activeLang.code})` : selectedLang}
            <ChevronDown className="h-3 w-3 text-white/40" />
          </button>

          {showLangPicker && (
            <div className="absolute right-0 top-12 z-50 w-56 bg-slate-900/98 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-2 max-h-64 overflow-y-auto no-scrollbar divide-y divide-white/5">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setSelectedLang(lang.code); setShowLangPicker(false); }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left',
                      selectedLang === lang.code && 'bg-primary/10'
                    )}
                  >
                    <span className="font-black text-xs text-white">{lang.native_name}</span>
                    <span className="text-[9px] text-white/30 uppercase font-black">{lang.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Syllabus + Content */}
        <div className="space-y-8">
          {/* Syllabus picker */}
          <div className="space-y-4">
            <SectionHeading icon={Layers} label="Regional Syllabus" />
            {loadingSyllabi ? (
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading syllabi...
              </div>
            ) : syllabi.length === 0 ? (
              <p className="text-xs text-white/30 italic">
                No syllabi loaded yet. Run the migration SQL in Supabase to seed data.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {syllabi.map((s) => (
                  <Pill
                    key={s.id}
                    active={selectedSyllabus === s.id}
                    onClick={() => setSelectedSyllabus(s.id)}
                  >
                    {s.name} · {s.country}
                  </Pill>
                ))}
              </div>
            )}
          </div>

          {/* Content browser */}
          <div className="space-y-4">
            <SectionHeading icon={BookOpen} label="Learning Content" />
            <ContentBrowser languageCode={selectedLang} syllabusId={selectedSyllabus} />
          </div>
        </div>

        {/* Right: Nearest schools */}
        <div>
          <NearestSchoolsPanel />
        </div>
      </div>
    </section>
  );
}
