'use client';

/**
 * MultilingualEngine — REALTIME
 * ─────────────────────────────
 * Every data source uses Supabase Postgres Changes subscriptions.
 * New languages, syllabi, concepts, translations, and schools
 * appear instantly without any page refresh.
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
  ChevronDown,
  Languages,
  Layers,
  Wifi,
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

// ─── Live indicator dot ───────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
      Live
    </span>
  );
}

function SectionHeading({ icon: Icon, label, live = false }: { icon: React.ElementType; label: string; live?: boolean }) {
  return (
    <h3 className="font-headline text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary" />
      {label}
      {live && <LiveDot />}
    </h3>
  );
}

function Pill({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
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

// ─── Hook: realtime languages ─────────────────────────────────────────────────
function useRealtimeLanguages() {
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Initial fetch
    supabase.from('languages').select('*').order('name').then(({ data }) => {
      if (data) setLanguages(data as Language[]);
      setLoading(false);
    });

    // Realtime: new language added
    const ch = supabase.channel('rt-languages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'languages' },
        (payload) => setLanguages(prev => [...prev, payload.new as Language].sort((a, b) => a.name.localeCompare(b.name))))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'languages' },
        (payload) => setLanguages(prev => prev.map(l => l.code === (payload.new as Language).code ? payload.new as Language : l)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'languages' },
        (payload) => setLanguages(prev => prev.filter(l => l.code !== (payload.old as Language).code)))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  return { languages, loading };
}

// ─── Hook: realtime syllabi ───────────────────────────────────────────────────
function useRealtimeSyllabi() {
  const [syllabi, setSyllabi] = React.useState<SyllabusDefinition[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.from('syllabus_definitions').select('*').order('country').then(({ data }) => {
      if (data) setSyllabi(data as SyllabusDefinition[]);
      setLoading(false);
    });

    const ch = supabase.channel('rt-syllabi')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'syllabus_definitions' },
        (payload) => setSyllabi(prev => [...prev, payload.new as SyllabusDefinition]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'syllabus_definitions' },
        (payload) => setSyllabi(prev => prev.map(s => s.id === (payload.new as SyllabusDefinition).id ? payload.new as SyllabusDefinition : s)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'syllabus_definitions' },
        (payload) => setSyllabi(prev => prev.filter(s => s.id !== (payload.old as SyllabusDefinition).id)))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  return { syllabi, loading };
}

// ─── Hook: realtime concepts for a syllabus ───────────────────────────────────
function useRealtimeConcepts(syllabusId: string | null) {
  const [concepts, setConcepts] = React.useState<UniversalConcept[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!syllabusId) { setConcepts([]); return; }
    setLoading(true);
    setConcepts([]);

    supabase
      .from('syllabus_topics_mapping')
      .select('concept_id, topic_name, universal_concepts(id, name, subject_area)')
      .eq('syllabus_id', syllabusId)
      .limit(30)
      .then(({ data }) => {
        if (data) {
          const unique = new Map<string, UniversalConcept>();
          data.forEach((row: any) => {
            const c = row.universal_concepts;
            if (c && !unique.has(c.id)) unique.set(c.id, c);
          });
          setConcepts(Array.from(unique.values()));
        }
        setLoading(false);
      });

    // When a new topic mapping is added for this syllabus, fetch the concept and append
    const ch = supabase.channel(`rt-concepts-${syllabusId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'syllabus_topics_mapping',
        filter: `syllabus_id=eq.${syllabusId}`,
      }, async (payload: any) => {
        const conceptId = payload.new?.concept_id;
        if (!conceptId) return;
        const { data } = await supabase.from('universal_concepts').select('*').eq('id', conceptId).single();
        if (data) setConcepts(prev => prev.some(c => c.id === data.id) ? prev : [...prev, data as UniversalConcept]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'universal_concepts' },
        (payload) => {
          // Only add if it's already mapped to this syllabus (optimistic — will appear on next concept load)
          const c = payload.new as UniversalConcept;
          setConcepts(prev => prev.some(x => x.id === c.id) ? prev : prev);
        })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [syllabusId]);

  return { concepts, loading };
}

// ─── Hook: realtime translations for a concept + language ─────────────────────
function useRealtimeTranslations(conceptId: string | null, languageCode: string) {
  const [translations, setTranslations] = React.useState<ContentTranslation[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!conceptId || !languageCode) { setTranslations([]); return; }
    setLoading(true);
    setTranslations([]);

    supabase
      .from('content_translations')
      .select('*, learning_content!inner(concept_id)')
      .eq('language_code', languageCode)
      .eq('learning_content.concept_id', conceptId)
      .limit(10)
      .then(({ data }) => {
        if (data) setTranslations(data as ContentTranslation[]);
        setLoading(false);
      });

    // New translation added for this language — check if it belongs to our concept
    const ch = supabase.channel(`rt-translations-${conceptId}-${languageCode}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'content_translations',
        filter: `language_code=eq.${languageCode}`,
      }, async (payload: any) => {
        const contentId = payload.new?.content_id;
        if (!contentId) return;
        // Verify this content belongs to the active concept
        const { data: lc } = await supabase
          .from('learning_content').select('concept_id').eq('id', contentId).single();
        if (lc?.concept_id === conceptId) {
          setTranslations(prev => [payload.new as ContentTranslation, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'content_translations',
        filter: `language_code=eq.${languageCode}`,
      }, (payload) => {
        setTranslations(prev => prev.map(t => t.id === (payload.new as ContentTranslation).id ? payload.new as ContentTranslation : t));
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'content_translations',
      }, (payload) => {
        setTranslations(prev => prev.filter(t => t.id !== (payload.old as ContentTranslation).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [conceptId, languageCode]);

  return { translations, loading };
}

// ─── Nearest Schools Panel (realtime school list + GPS lookup) ────────────────
function NearestSchoolsPanel() {
  const { toast } = useToast();
  const [locating, setLocating] = React.useState(false);
  const [schools, setSchools] = React.useState<NearestSchool[]>([]);
  const [located, setLocated] = React.useState(false);
  const [userCoords, setUserCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  // Realtime: when a new school is added to the DB, re-run the nearest query if we have coords
  React.useEffect(() => {
    const ch = supabase.channel('rt-schools-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'schools' }, async () => {
        if (!userCoords) return;
        const { data } = await supabase.rpc('find_nearest_schools', {
          user_lat: userCoords.lat, user_long: userCoords.lng, result_limit: 5,
        });
        if (data) setSchools(data as NearestSchool[]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'schools' }, async () => {
        if (!userCoords) return;
        const { data } = await supabase.rpc('find_nearest_schools', {
          user_lat: userCoords.lat, user_long: userCoords.lng, result_limit: 5,
        });
        if (data) setSchools(data as NearestSchool[]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userCoords]);

  const runLookup = async (lat: number, lng: number) => {
    const { data, error } = await supabase.rpc('find_nearest_schools', {
      user_lat: lat, user_long: lng, result_limit: 5,
    });
    if (error) throw error;
    setSchools((data as NearestSchool[]) || []);
    setUserCoords({ lat, lng });
    setLocated(true);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await runLookup(pos.coords.latitude, pos.coords.longitude);
        } catch (err: any) {
          toast({ title: 'School lookup failed', description: err?.message });
        } finally {
          setLocating(false);
        }
      },
      (err) => { setLocating(false); toast({ title: 'Location denied', description: err.message }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      <SectionHeading icon={MapPin} label="Nearest Schools" live={located} />
      <p className="text-[11px] text-white/40 font-medium">
        PostGIS KNN lookup · updates live when new schools are added.
      </p>

      {!located && (
        <Button onClick={handleLocate} disabled={locating}
          className="h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">
          {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
          {locating ? 'Locating...' : 'Find Nearest Schools'}
        </Button>
      )}

      {located && schools.length === 0 && (
        <p className="text-xs text-white/40 italic">No schools found near your location yet.</p>
      )}

      <div className="space-y-3">
        {schools.map((s, i) => (
          <Card key={s.school_id} className="border border-white/5 bg-black/20 rounded-2xl p-4 flex items-start gap-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-sm">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-white truncate">{s.school_name}</p>
              {s.address && <p className="text-[10px] text-white/40 truncate mt-0.5">{s.address}</p>}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {s.syllabus_name && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {s.syllabus_name}
                  </span>
                )}
                {s.country && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{s.country}</span>
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
          onClick={() => { setLocated(false); setSchools([]); setUserCoords(null); handleLocate(); }}
          className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
        >
          Refresh Location
        </button>
      )}
    </div>
  );
}

// ─── Content Browser (realtime concepts + translations) ───────────────────────
function ContentBrowser({ languageCode, syllabusId }: { languageCode: string; syllabusId: string | null }) {
  const [activeConcept, setActiveConcept] = React.useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null);

  const { concepts, loading: loadingConcepts } = useRealtimeConcepts(syllabusId);
  const { translations, loading: loadingContent } = useRealtimeTranslations(activeConcept, languageCode);

  // Reset active concept when syllabus changes
  React.useEffect(() => { setActiveConcept(null); setPlayingUrl(null); }, [syllabusId]);
  // Reset player when language changes
  React.useEffect(() => { setPlayingUrl(null); }, [languageCode]);

  if (!syllabusId) {
    return <p className="text-xs text-white/30 italic">Select a syllabus above to browse content.</p>;
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
            <Pill key={c.id} active={activeConcept === c.id} onClick={() => setActiveConcept(c.id)}>
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
              No content in this language for the selected concept yet.
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
  const { languages, loading: loadingLangs } = useRealtimeLanguages();
  const { syllabi, loading: loadingSyllabi } = useRealtimeSyllabi();
  const [selectedLang, setSelectedLang] = React.useState<string>('en');
  const [selectedSyllabus, setSelectedSyllabus] = React.useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = React.useState(false);

  const activeLang = languages.find((l) => l.code === selectedLang);

  return (
    <section className="space-y-10 border-t border-white/5 pt-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Languages className="h-6 w-6 text-primary" />
            Multilingual Education Engine
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-400">
              <Wifi className="h-3 w-3" />
              Realtime
            </span>
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
              <div className="p-1 border-b border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 px-2 py-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  {languages.length} languages · live
                </p>
              </div>
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
          <div className="space-y-4">
            <SectionHeading icon={Layers} label="Regional Syllabus" live />
            {loadingSyllabi ? (
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading syllabi...
              </div>
            ) : syllabi.length === 0 ? (
              <p className="text-xs text-white/30 italic">
                No syllabi yet — run the migration SQL in Supabase to seed data.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {syllabi.map((s) => (
                  <Pill key={s.id} active={selectedSyllabus === s.id} onClick={() => setSelectedSyllabus(s.id)}>
                    {s.name} · {s.country}
                  </Pill>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <SectionHeading icon={BookOpen} label="Learning Content" live={!!selectedSyllabus} />
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
