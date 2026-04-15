'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { PlaceHolderImages } from "../../../lib/placeholder-images";
import { Crown, Medal, Award } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: 'QuantumLeaper', score: 12500, avatar: PlaceHolderImages.find(img => img.id === 'user-avatar-2') },
  { rank: 2, name: 'PixelPioneer', score: 11800, avatar: PlaceHolderImages.find(img => img.id === 'story-2') },
  { rank: 3, name: 'CodeCrafter', score: 11250, avatar: PlaceHolderImages.find(img => img.id === 'story-3') },
  { rank: 4, name: 'ArtfulAndroid', score: 10500, avatar: PlaceHolderImages.find(img => img.id === 'story-1') },
  { rank: 5, name: 'DataDynamo', score: 9800, avatar: PlaceHolderImages.find(img => img.id === 'content-2') },
  { rank: 6, name: 'StreamSurfer', score: 9150, avatar: PlaceHolderImages.find(img => img.id === 'content-3') },
  { rank: 7, name: 'GameGuru', score: 8800, avatar: PlaceHolderImages.find(img => img.id === 'content-5') },
];

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-yellow-700" />;
  return <span className="font-bold text-lg text-muted-foreground">{rank}</span>;
};

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto space-y-8 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-bold uppercase tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground text-lg italic">
          High-performance ranking synchronized with community engagement nodes.
        </p>
      </header>

      <Card className="border-2 border-primary/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
          <CardTitle className="font-headline text-2xl font-bold uppercase tracking-tight">Top Performers</CardTitle>
          <CardDescription className="font-medium italic">Based on nodes synchronized and contributions logged.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-b border-white/5">
                <TableHead className="w-[100px] text-center font-black uppercase text-[10px] tracking-widest opacity-40">Rank Node</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest opacity-40">User Identity</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest opacity-40 pr-8">Performance Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map(user => (
                <TableRow key={user.rank} className="border-b border-white/5 hover:bg-primary/5 transition-all group">
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center h-12 w-12 mx-auto">
                        <RankIcon rank={user.rank} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 py-2">
                      <Avatar className="h-12 w-12 border-2 border-primary/20 ring-2 ring-primary/5 group-hover:scale-110 transition-transform">
                        <AvatarImage src={user.avatar?.imageUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-black text-sm uppercase tracking-tight">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-xl text-primary pr-8">{user.score.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
