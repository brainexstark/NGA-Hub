'use client';

import { useState, useRef, useEffect } from 'react';
import { generateLessonPlan } from '../../../ai/flows/generate-lesson-plan';
import { generateLessonAudio } from '../../../ai/flows/generate-lesson-audio';
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Loader2, Sparkles, Volume2, BookOpen, Clock, Zap, History } from "lucide-react";
import { useToast } from '../../../hooks/use-toast';
import { containsInappropriateWords } from '../../../lib/inappropriate-words';
import { supabase } from '../../../lib/supabase';
import { useUser } from '../../../firebase';

interface SavedLesson {
  id: string;
  topic: string;
  age_group: string;
  lesson_plan: string;
  created_at: string;
}

export default function LiveLessonPage() {
  const { user } = useUser();
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState<'under 10' | '10-16' | '16+'>('10-16');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState('');
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Load lesson history from Supabase
  useEffect(() => {
    if (!supabase || !user) return;
    setLoadingHistory(true);
    supabase.from('lessons').select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setSavedLessons(data);
        setLoadingHistory(false);
      });
  }, [user]);

  const handleGenerate = async () => {
    if (!topic) {
      toast({ variant: 'destructive', title: 'Topic required', description: 'Enter a topic first.' });
      return;
    }
    if (containsInappropriateWords(topic)) {
      toast({ variant: 'destructive', title: 'Inappropriate Topic', description: 'Choose a different topic.' });
      return;
    }

    setIsLoading(true);
    setLessonPlan('');
    setAudioDataUri('');

    try {
      const result = await generateLessonPlan({ topic, ageGroup });
      setLessonPlan(result.lessonPlan);

      // Save to Supabase
      if (supabase && user) {
        await supabase.from('lessons').insert({
          user_id: user.uid,
          topic,
          age_group: ageGroup,
          lesson_plan: result.lessonPlan,
        }).then(({ data }) => {
          if (data) setSavedLessons(prev => [data[0], ...prev]);
        });
        // Refresh history
        const { data } = await supabase.from('lessons').select('*')
          .eq('user_id', user.uid).order('created_at', { ascending: false }).limit(10);
        if (data) setSavedLessons(data);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Generation Failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!lessonPlan) return;
    setIsGeneratingAudio(true);
    setAudioDataUri('');
    try {
      const result = await generateLessonAudio({ lessonText: lessonPlan });
      setAudioDataUri(result.audioDataUri);
    } catch {
      toast({ variant: 'destructive', title: 'Audio Failed' });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  useEffect(() => {
    if (audioDataUri && audioRef.current) audioRef.current.play();
  }, [audioDataUri]);

  return (
    <div className="container mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
          <Sparkles className="h-4 w-4" /> AI Lesson Generator
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Live Lesson</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
          Generate instant AI-powered lessons. All sessions saved to your Supabase history.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Lesson Config
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Topic</Label>
                <Input
                  placeholder="e.g., The Solar System"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Age Group</Label>
                <Select value={ageGroup} onValueChange={(v: any) => setAgeGroup(v)}>
                  <SelectTrigger className="h-12 bg-black/20 rounded-2xl border-white/5 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                    <SelectItem value="under 10" className="font-bold">Under 10</SelectItem>
                    <SelectItem value="10-16" className="font-bold">10–16</SelectItem>
                    <SelectItem value="16+" className="font-bold">16+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerate} disabled={isLoading || !topic.trim()} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Generate Lesson
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="border-2 border-white/5 bg-card/40 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-4 border-b border-white/5">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <History className="h-4 w-4" /> Recent Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {loadingHistory && <Loader2 className="h-4 w-4 animate-spin mx-auto opacity-40 my-4" />}
              {!loadingHistory && savedLessons.length === 0 && (
                <p className="text-[10px] text-center opacity-30 font-black uppercase py-4">No lessons yet</p>
              )}
              {savedLessons.map(l => (
                <button key={l.id} onClick={() => { setTopic(l.topic); setLessonPlan(l.lesson_plan); }}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 space-y-1">
                  <p className="font-black text-xs uppercase tracking-tight truncate">{l.topic}</p>
                  <div className="flex items-center gap-2 text-[9px] opacity-40 font-bold uppercase">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(l.created_at).toLocaleDateString()} · {l.age_group}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Lesson output */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[500px]">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest">
                {isLoading ? 'Generating...' : lessonPlan ? topic : 'Lesson Output'}
              </CardTitle>
              <CardDescription className="italic text-xs">
                {isLoading ? 'AI instructor is preparing your lesson...' : 'Powered by Genkit AI · Saved to Supabase'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-xs font-black uppercase tracking-widest opacity-40 animate-pulse">Synchronizing lesson node...</p>
                </div>
              )}
              {lessonPlan && !isLoading && (
                <>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-[1.5rem] border border-white/5 bg-black/20 p-6 text-sm leading-relaxed">
                    {lessonPlan}
                  </div>
                  <Button onClick={handlePlayAudio} disabled={isGeneratingAudio} className="w-full h-12 rounded-2xl font-black uppercase text-xs">
                    {isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                    Play Lesson Audio
                  </Button>
                  {audioDataUri && <audio ref={audioRef} src={audioDataUri} className="hidden" controls />}
                </>
              )}
              {!isLoading && !lessonPlan && (
                <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-30">
                  <Sparkles className="h-12 w-12" />
                  <p className="font-medium italic text-sm">Enter a topic and hit Generate.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
