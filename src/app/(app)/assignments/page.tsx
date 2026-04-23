'use client';
import * as React from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';

export default function AssignmentsPage() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  return (
    <div className="container mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter dynamic-text-mesh">Assignments</h1>
        <p className="text-muted-foreground italic">Your learning tasks and objectives</p>
      </header>
      <div className="py-20 text-center opacity-30 space-y-3">
        <ClipboardList className="h-12 w-12 mx-auto" />
        <p className="font-black uppercase text-sm">No assignments yet</p>
        <p className="text-xs">Your teacher will post assignments here</p>
      </div>
    </div>
  );
}
