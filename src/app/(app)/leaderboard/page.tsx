'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Crown, Medal, Award, Trophy, Loader2 } from "lucide-react";
import { supabase } from '../../../lib/supabase';

export default function LeaderboardPage() {
  const [mounted, setMounted] = React.useState(false);
  const [leaders, setLeaders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    // Get top users by followers count from app_users
    supabase.from('app_users').select('id, display_name, avatar')
      .order('created_at', { ascending: true }).limit(20)
      .then(({ data }) => { if (data) setLeaders(data); setLoading(false); });
  }, []);

  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-black text-white/30">#{rank}</span>;
  };

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter dynamic-text-mesh">Leaderboard</h1>
        <p className="text-muted-foreground italic">Top community members</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : leaders.length === 0 ? (
        <div className="py-20 text-center opacity-30 space-y-3">
          <Trophy className="h-12 w-12 mx-auto" />
          <p className="font-black uppercase text-sm">No users yet</p>
        </div>
      ) : (
        <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-6 border-b border-white/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Community Members</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leaders.map((user, i) => (
              <div key={user.id} className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-all">
                <div className="w-8 flex justify-center shrink-0">{rankIcon(i + 1)}</div>
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary font-black">
                    {user.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-black text-sm uppercase tracking-tight">{user.display_name}</p>
                  <p className="text-[9px] text-white/30 font-bold uppercase">Member</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
