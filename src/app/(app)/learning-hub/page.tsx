'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { 
  Triangle, 
  Microscope, 
  Book, 
  Laptop, 
  Star, 
  Globe, 
  Zap,
  Clock,
  Search,
  PlayCircle,
  Trophy,
  Flame,
  BookOpen,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  Target,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  PartyPopper,
  Award
} from 'lucide-react';
import { cn, getEmbedUrl } from '../../../lib/utils';
import { Dialog, DialogContent, DialogTitle } from "../../../components/ui/dialog";
import { useToast } from '../../../hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '../../../firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../../../lib/types';
import { Input } from '../../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { updateDocumentNonBlocking } from '../../../firebase/non-blocking-updates';
import { useRealtimeFeed } from '../../../hooks/use-realtime-feed';
import { containsInappropriateWords } from '../../../lib/inappropriate-words';

// LOCAL HIGH-PERFORMANCE BADGE REPLACEMENT
const LocalBadge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: string, className?: string }) => {
  const variants: Record<string, string> = {
    default: 'bg-primary/10 text-primary border-primary/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    secondary: 'bg-white/5 text-white/40 border-white/5',
    outline: 'border-white/10 text-white/60'
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors", variants[variant] || variants.default, className)}>
      {children}
    </div>
  );
};

const SUBJECTS = [
  { 
    id: 'math', name: 'Mathematics', icon: Triangle, color: 'bg-blue-600', progress: 72, category: 'STEM',
    lessons: [
        { title: 'Algebra Mastery', url: 'https://www.youtube.com/watch?v=f8beu7En29E' },
        { title: 'Quadratic Equations', url: 'https://www.youtube.com/watch?v=Xpk67Yz2Deo' },
        { title: 'Calculus Intro', url: 'https://www.youtube.com/watch?v=HfACrKJ_Y2w' },
        { title: 'Statistics & Probability', url: 'https://www.youtube.com/watch?v=sxQaBpKfDRk' },
        { title: 'Geometry Fundamentals', url: 'https://www.youtube.com/watch?v=302eJ3TzJQU' },
    ]
  },
  { 
    id: 'science', name: 'Science', icon: Microscope, color: 'bg-emerald-600', progress: 45, category: 'STEM',
    lessons: [
        { title: 'Cell Biology', url: 'https://www.youtube.com/watch?v=8IlzKri08kk' },
        { title: 'Chemical Bonds', url: 'https://www.youtube.com/watch?v=QnC6R6Yx0yE' },
        { title: 'Newtonian Physics', url: 'https://www.youtube.com/watch?v=aircAruvnKk' },
        { title: 'Genetics & DNA', url: 'https://www.youtube.com/watch?v=zwibgNGe4aY' },
        { title: 'Climate & Environment', url: 'https://www.youtube.com/watch?v=G4H1N_yXBiA' },
    ]
  },
  { 
    id: 'english', name: 'English', icon: Book, color: 'bg-orange-600', progress: 88, category: 'LANGUAGE',
    lessons: [
        { title: 'Essay Structure', url: 'https://www.youtube.com/watch?v=HfACrKJ_Y2w' },
        { title: 'Creative Writing', url: 'https://www.youtube.com/watch?v=URUJD5NEXC8' },
        { title: 'Grammar Mastery', url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ' },
        { title: 'Public Speaking', url: 'https://www.youtube.com/watch?v=tShavGuo0_E' },
        { title: 'Literature Analysis', url: 'https://www.youtube.com/watch?v=MSYw502dJNY' },
    ]
  },
  { 
    id: 'ict', name: 'ICT & Coding', icon: Laptop, color: 'bg-purple-600', progress: 60, category: 'TECH',
    lessons: [
        { title: 'Python Syntax', url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk' },
        { title: 'Web Architecture', url: 'https://www.youtube.com/watch?v=FsGdznlfE2U' },
        { title: 'JavaScript Basics', url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk' },
        { title: 'AI & Machine Learning', url: 'https://www.youtube.com/watch?v=aircAruvnKk' },
        { title: 'Cybersecurity Basics', url: 'https://www.youtube.com/watch?v=inWWhr5tnEA' },
    ]
  },
  { 
    id: 'life-skills', name: 'Life Skills', icon: Star, color: 'bg-pink-600', progress: 35, category: 'SOCIAL',
    lessons: [
        { title: 'Emotional Intelligence', url: 'https://www.youtube.com/watch?v=URUJD5NEXC8' },
        { title: 'Critical Thinking', url: 'https://www.youtube.com/watch?v=HfACrKJ_Y2w' },
        { title: 'Financial Literacy', url: 'https://www.youtube.com/watch?v=xdFeEstPeAo' },
        { title: 'Leadership Skills', url: 'https://www.youtube.com/watch?v=XKUPDUDOBVo' },
        { title: 'Time Management', url: 'https://www.youtube.com/watch?v=oTugjssqOT0' },
    ]
  },
  { 
    id: 'languages', name: 'Languages', icon: Globe, color: 'bg-cyan-600', progress: 50, category: 'LANGUAGE',
    lessons: [
        { title: 'Swahili Basics', url: 'https://www.youtube.com/watch?v=81u77GD_DZk' },
        { title: 'French Intro', url: 'https://www.youtube.com/watch?v=_tD60lkjzXU' },
        { title: 'Spanish Basics', url: 'https://www.youtube.com/watch?v=SkHZAWCd_4A' },
        { title: 'Advanced Grammar', url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ' },
    ]
  },
  {
    id: 'history', name: 'History', icon: BookOpen, color: 'bg-amber-600', progress: 40, category: 'HUMANITIES',
    lessons: [
        { title: 'African History', url: 'https://www.youtube.com/watch?v=1ZYbU82GVz4' },
        { title: 'World War II', url: 'https://www.youtube.com/watch?v=fo2Rb9h788s' },
        { title: 'Ancient Civilizations', url: 'https://www.youtube.com/watch?v=Yocja_N5s1I' },
        { title: 'Colonial History', url: 'https://www.youtube.com/watch?v=ALHqABpFBzg' },
    ]
  },
  {
    id: 'business', name: 'Business', icon: Target, color: 'bg-green-700', progress: 55, category: 'COMMERCE',
    lessons: [
        { title: 'Entrepreneurship', url: 'https://www.youtube.com/watch?v=xdFeEstPeAo' },
        { title: 'Marketing Basics', url: 'https://www.youtube.com/watch?v=bixR-KIJKYM' },
        { title: 'Economics 101', url: 'https://www.youtube.com/watch?v=3ez10ADR_gM' },
        { title: 'Accounting Basics', url: 'https://www.youtube.com/watch?v=yYX4bvQSqbo' },
    ]
  },
];

const KIDS_SUBJECTS = [
  { id: 'phonics', name: 'Phonics Fun', icon: 'A', color: 'bg-purple-600', category: 'LANGUAGE', progress: 40, lessons: [
    { title: 'Phonics Song', url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ' },
    { title: 'Alphabet ABC', url: 'https://www.youtube.com/watch?v=v2S_7WGV29M' },
    { title: 'Letter Sounds', url: 'https://www.youtube.com/watch?v=yht8QHMkMSk' },
  ]},
  { id: 'numbers', name: 'Number Safari', icon: '1', color: 'bg-blue-600', category: 'MATH', progress: 65, lessons: [
    { title: 'Counting 1-10', url: 'https://www.youtube.com/watch?v=DR-cfDsHCGA' },
    { title: 'Number Rocks', url: 'https://www.youtube.com/watch?v=D0Ajq682yrA' },
    { title: 'Addition Fun', url: 'https://www.youtube.com/watch?v=ziWumzV_hk4' },
  ]},
  { id: 'animals', name: 'Animal Explorer', icon: '🐾', color: 'bg-green-600', category: 'SCIENCE', progress: 30, lessons: [
    { title: 'Animal Discovery', url: 'https://www.youtube.com/watch?v=1ZYbU82GVz4' },
    { title: 'Safari Tour', url: 'https://www.youtube.com/watch?v=wCfWmlnJl-A' },
    { title: 'Ocean Animals', url: 'https://www.youtube.com/watch?v=XqZsoesa55w' },
  ]},
  { id: 'kindness', name: 'Kindness Club', icon: '🫂', color: 'bg-pink-600', category: 'SOCIAL', progress: 80, lessons: [
    { title: 'Kindness Song', url: 'https://www.youtube.com/watch?v=akTRWJZMks0' },
    { title: 'Sharing Node', url: 'https://www.youtube.com/watch?v=75p-N9YKqNo' },
    { title: 'Friendship Stories', url: 'https://www.youtube.com/watch?v=ziWumzV_hk4' },
  ]},
  { id: 'space', name: 'Space Explorer', icon: '🚀', color: 'bg-indigo-600', category: 'SCIENCE', progress: 50, lessons: [
    { title: 'Solar System', url: 'https://www.youtube.com/watch?v=D0Ajq682yrA' },
    { title: 'Stars & Planets', url: 'https://www.youtube.com/watch?v=aircAruvnKk' },
  ]},
  { id: 'art', name: 'Art Studio', icon: '🎨', color: 'bg-orange-500', category: 'ARTS', progress: 60, lessons: [
    { title: 'Draw a Rainbow', url: 'https://www.youtube.com/watch?v=URUJD5NEXC8' },
    { title: 'Colour Mixing', url: 'https://www.youtube.com/watch?v=yht8QHMkMSk' },
  ]},
  { id: 'music', name: 'Music Time', icon: '🎵', color: 'bg-yellow-600', category: 'ARTS', progress: 70, lessons: [
    { title: 'Nursery Rhymes', url: 'https://www.youtube.com/watch?v=ziWumzV_hk4' },
    { title: 'Kids Songs', url: 'https://www.youtube.com/watch?v=XqZsoesa55w' },
  ]},
  { id: 'coding', name: 'Coding for Kids', icon: '💻', color: 'bg-cyan-600', category: 'TECH', progress: 20, lessons: [
    { title: 'Scratch Basics', url: 'https://www.youtube.com/watch?v=4xrKuTnnc8I' },
    { title: 'Robot Coding', url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk' },
  ]},
];

const RECENT_LESSONS = [
  { id: 'rl1', title: 'Quadratic Equations', subject: 'Math', duration: '15 min', icon: Triangle, url: 'https://www.youtube.com/watch?v=Xpk67Yz2Deo' },
  { id: 'rl2', title: 'Cell Biology Basics', subject: 'Science', duration: '20 min', icon: Microscope, url: 'https://www.youtube.com/watch?v=8IlzKri08kk' },
];

const InternalPlayer = ({ url }: { url: string }) => {
  const embedUrl = getEmbedUrl(url);
  return <iframe src={embedUrl} className="w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
};

const GoogleViewer = ({ query, onClose }: { query: string, onClose: () => void }) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;

    return (
        <div className="w-full h-full flex flex-col bg-black">
            <div className="bg-slate-900 p-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Google Intelligence Node: {query}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-[9px] font-black uppercase text-white/40 hover:text-white" onClick={() => window.open(searchUrl, '_blank')}>
                      <ExternalLink className="mr-1.5 h-3 w-3" /> Protocol Override
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-[9px] font-black uppercase text-white/40 hover:text-white" onClick={onClose}>
                      <RefreshCw className="mr-1.5 h-3 w-3" /> Reset
                  </Button>
                </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-center p-8 space-y-6">
                        <RefreshCw className="h-12 w-12 animate-spin text-primary opacity-20" />
                        <div className="space-y-2">
                            <p className="font-headline text-2xl font-bold uppercase tracking-tight text-white">Synchronizing Node...</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Initializing Intelligence Matrix</p>
                        </div>
                    </div>
                )}
                <iframe src={searchUrl} className="w-full h-full border-none bg-white" allowFullScreen onLoad={() => setIsLoading(false)} />
            </div>
        </div>
    );
};

export default function LearningHubPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedLesson, setSelectedLesson] = React.useState<any>(null);
  const [missionSeconds, setMissionSeconds] = React.useState<number | null>(null);
  const [isMissionComplete, setIsMissionComplete] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeSearch, setActiveSearch] = React.useState<string | null>(null);

  const [completedCount, setCompletedCount] = React.useState(0);
  const [streakCount, setStreakCount] = React.useState(0);
  const [badgesCount, setBadgesCount] = React.useState(0);

  const userRef = useMemoFirebase(() => (!user || !firestore) ? null : doc(firestore, 'users', user.uid), [user, firestore]);
  const { data: profile } = useDoc<UserProfile>(userRef);
  const isUnder10 = profile?.ageGroup === 'under-10';

  React.useEffect(() => {
    if (profile) {
      setCompletedCount(profile.lessonsCompleted || 0);
      setStreakCount(profile.nodeStreak || 0);
      setBadgesCount(profile.badgesEarned || 0);
    }
  }, [profile]);

  const isEntertainmentQuery = React.useMemo(() => {
    const forbiddenKeywords = ['movie', 'game', 'music', 'song', 'play', 'fun', 'entertainment', 'youtube', 'tiktok', 'instagram', 'celebrity'];
    return forbiddenKeywords.some(keyword => searchQuery.toLowerCase().includes(keyword));
  }, [searchQuery]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (missionSeconds !== null && missionSeconds > 0) {
      interval = setInterval(() => {
        setMissionSeconds(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (missionSeconds === 0) {
      setIsMissionComplete(true);
      if (user && firestore) {
          const uRef = doc(firestore, 'users', user.uid);
          updateDocumentNonBlocking(uRef, { 
              lessonsCompleted: (completedCount || 0) + 1,
              nodeStreak: (streakCount || 0) + 1 
          });
      }
      window.dispatchEvent(new CustomEvent('stark-b-mission-complete'));
      setMissionSeconds(null);
      setSelectedLesson(null);
    }
    return () => clearInterval(interval);
  }, [missionSeconds, user, firestore, completedCount, streakCount]);

  const handleInitializeLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    if (missionSeconds === null) {
      setMissionSeconds(30); 
      toast({ title: "Mission Node Active", description: "30-second synchronization cycle started." });
    }
  };

  const handleAuthorizeEntertainment = () => {
      setIsMissionComplete(false);
      router.push(`/HomeTon/${profile?.ageGroup || '10-16'}`);
  };

  const activeSubjects = isUnder10 ? KIDS_SUBJECTS : SUBJECTS;

  // Live feed posts that match educational content
  const { posts: livePosts } = useRealtimeFeed(profile?.ageGroup || '10-16');
  const educationalLivePosts = React.useMemo(() => {
    return livePosts
      .filter(p => !containsInappropriateWords(`${p.caption} ${p.title || ''}`, isUnder10))
      .slice(0, 6)
      .map(p => ({ title: p.title || p.caption, url: p.url || p.mediaUrl }));
  }, [livePosts, isUnder10]);

  return (
    <div className="container mx-auto space-y-12 pb-32 max-w-7xl animate-in fade-in duration-700 pt-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
            <h1 className="font-headline text-4xl font-black uppercase tracking-tight text-white">Learning Hub</h1>
            <p className="text-muted-foreground font-medium italic text-white/60">High-performance educational matrix</p>
        </div>
        
        <div className="flex items-center gap-4">
            <form onSubmit={(e) => { e.preventDefault(); if(searchQuery.trim() && !isEntertainmentQuery) setActiveSearch(searchQuery); }} className="relative w-64 group">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", isEntertainmentQuery ? "text-red-500" : "text-muted-foreground")} />
                <Input placeholder="Search Intelligence..." className={cn("pl-10 h-10 bg-black/20 border-white/5 rounded-xl text-xs text-white", isEntertainmentQuery ? "border-red-500 text-red-500" : "")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </form>
            {missionSeconds !== null && (
                <div className="h-10 px-4 rounded-xl border border-primary/40 text-primary flex items-center gap-3 bg-black/20">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono font-bold tabular-nums">{missionSeconds}s</span>
                </div>
            )}
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="font-headline text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
            <BookOpen className="h-6 w-6 text-primary" /> Subject Nodes
        </h2>
        <div className={cn("grid gap-4", isUnder10 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6")}>
            {activeSubjects.map((sub) => (
                <DropdownMenu key={sub.id}>
                    <DropdownMenuTrigger asChild>
                        <Card className="border border-white/5 bg-card/40 backdrop-blur-xl rounded-[1.5rem] p-6 transition-all hover:border-primary/40 cursor-pointer group shadow-xl">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-6 shadow-lg", sub.color)}>
                                {typeof sub.icon === 'string' ? <span className="text-white font-black text-xl">{sub.icon}</span> : <sub.icon className="h-6 w-6 text-white" />}
                            </div>
                            <div className="space-y-1 mb-4">
                                <h3 className="font-black text-sm uppercase tracking-tight text-white group-hover:text-primary transition-colors">{sub.name}</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{sub.category || 'Core Mission'}</p>
                            </div>
                            <Progress value={sub.progress} className="h-1.5 bg-white/5" />
                        </Card>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-primary/20 rounded-2xl p-2">
                        {sub.lessons.map((lesson) => (
                            <DropdownMenuItem key={lesson.url} onClick={() => handleInitializeLesson(lesson)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 cursor-pointer transition-all">
                                <PlayCircle className="h-4 w-4 text-primary" />
                                <span className="font-bold text-xs text-white">{lesson.title}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ))}
        </div>
      </section>

      <Dialog open={isMissionComplete} onOpenChange={setIsMissionComplete}>
          <DialogContent className="bg-slate-900 border-primary/20 rounded-[3rem] max-w-lg text-center p-12 shadow-2xl">
              <DialogTitle className="sr-only">Mission Status Node</DialogTitle>
              <div className="mx-auto h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 animate-bounce mb-8">
                  <Star className="h-12 w-12 text-primary fill-current" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Enjoy a bit!</h2>
              <p className="text-lg font-medium italic text-white/80 mt-4">Protocol Synchronized. Your high-performance mission is complete. You are now authorized for entertainment.</p>
              <Button className="w-full h-16 rounded-3xl font-black uppercase mt-8 shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-3" onClick={handleAuthorizeEntertainment}>
                  <PartyPopper className="h-6 w-6" /> Authorize Entertainment Mode
              </Button>
          </DialogContent>
      </Dialog>

      <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && setSelectedLesson(null)}>
          <DialogContent className="max-w-[96vw] h-[96vh] p-0 bg-black border-primary/20 rounded-[3rem] overflow-hidden flex flex-col">
              <DialogTitle className="sr-only">Mission Node Player</DialogTitle>
              <div className="flex-1 w-full relative">{selectedLesson && <InternalPlayer url={selectedLesson.url} />}</div>
              <div className="bg-slate-900 p-8 flex items-center justify-between border-t border-white/10">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">{selectedLesson?.title}</h2>
                  <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Syncing Mission Node...</p>
              </div>
          </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-7 space-y-6">
              <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-white">Recent Synchronizations</h2>
              <div className="space-y-3">
                  {RECENT_LESSONS.map((lesson) => (
                      <Card key={lesson.id} className="border border-white/5 bg-black/20 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/40 transition-all cursor-pointer" onClick={() => handleInitializeLesson(lesson)}>
                          <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><PlayCircle className="h-5 w-5" /></div>
                              <div>
                                  <h4 className="font-bold text-sm text-white">{lesson.title}</h4>
                                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">{lesson.subject} • {lesson.duration}</p>
                              </div>
                          </div>
                          <Trophy className="h-4 w-4 text-orange-400 opacity-40 group-hover:opacity-100" />
                      </Card>
                  ))}
              </div>
          </section>

          <section className="lg:col-span-5 space-y-6">
              <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-white">Learning Stats</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                      { label: 'Units Complete', value: completedCount, icon: BookOpen, color: 'text-blue-400' },
                      { label: 'Node Streak', value: streakCount, icon: Flame, color: 'text-emerald-400' },
                      { label: 'Badges Earned', value: badgesCount, icon: Award, color: 'text-yellow-400' }
                  ].map((stat) => (
                      <Card key={stat.label} className="border border-white/5 bg-black/20 rounded-2xl p-6 flex flex-col items-center text-center space-y-3 shadow-xl">
                          <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}><stat.icon className="h-6 w-6" /></div>
                          <div className="space-y-1">
                              <p className="text-2xl font-black text-white tabular-nums">{stat.value}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{stat.label}</p>
                          </div>
                      </Card>
                  ))}
              </div>
          </section>
      </div>

      <Dialog open={!!activeSearch} onOpenChange={(open) => !open && setActiveSearch(null)}>
          <DialogContent className="max-w-[96vw] h-[96vh] p-0 overflow-hidden border-2 border-primary/20 bg-black rounded-[3rem] shadow-2xl flex flex-col">
              <DialogTitle className="sr-only">Intelligence Search Matrix</DialogTitle>
              {activeSearch && <GoogleViewer query={activeSearch} onClose={() => setActiveSearch(null)} />}
          </DialogContent>
      </Dialog>

      {/* Live feed educational content */}
      {educationalLivePosts.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Flame className="h-6 w-6 text-orange-400" /> Live Community Lessons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {educationalLivePosts.map((post, i) => (
              <Card key={i} className="border border-white/5 bg-black/20 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => handleInitializeLesson(post)}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400 shrink-0">
                    <PlayCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white line-clamp-1">{post.title}</p>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Community · Live</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}