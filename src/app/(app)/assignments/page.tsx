'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, BookOpen, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { aiDatabase } from '@/lib/ai-database';
import { cn } from '@/lib/utils';

export default function AssignmentsPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  const assignments = aiDatabase.educationalNodes.assignments;

  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-bold uppercase tracking-widest">
            <ClipboardList className="h-4 w-4" /> Learning Objectives Sync
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter dynamic-text-mesh">Active Assignments</h1>
        <p className="text-muted-foreground text-lg font-medium italic max-w-2xl">
            Synchronize your educational nodes and complete your high-performance training modules.
        </p>
      </header>

      <Tabs defaultValue="pending" className="space-y-8">
        <TabsList className="bg-black/20 p-1.5 rounded-2xl border border-white/5 h-auto flex gap-2 w-fit">
          <TabsTrigger value="pending" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all uppercase text-[10px] tracking-widest">
            <Clock className="h-3 w-3 mr-2" /> Pending Nodes
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl font-bold px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all uppercase text-[10px] tracking-widest">
            <CheckCircle2 className="h-3 w-3 mr-2" /> Completed Syncs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="animate-in fade-in zoom-in-95 duration-500">
          <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-white/5 p-8">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Pending Objectives</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-b border-white/5">
                    <TableHead className="px-8 py-4 font-black uppercase text-[10px] tracking-widest opacity-40">Task Node</TableHead>
                    <TableHead className="px-8 py-4 font-black uppercase text-[10px] tracking-widest opacity-40">Segment</TableHead>
                    <TableHead className="px-8 py-4 font-black uppercase text-[10px] tracking-widest opacity-40">Deadline</TableHead>
                    <TableHead className="px-8 py-4 text-right font-black uppercase text-[10px] tracking-widest opacity-40">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.filter(a => a.status === 'pending').map((asg) => (
                    <TableRow key={asg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100" />
                            <span className="font-bold text-lg">{asg.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6 font-medium text-muted-foreground">{asg.subject}</TableCell>
                      <TableCell className="px-8 py-6 font-mono text-xs text-primary">{asg.dueDate}</TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <button className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Initialize</button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="animate-in fade-in zoom-in-95 duration-500">
           <Card className="border-2 border-white/5 bg-card/20 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden opacity-60">
            <CardContent className="p-12 text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto opacity-20" />
                <p className="italic font-medium text-muted-foreground">All completed high-performance modules are archived here for legacy review.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}