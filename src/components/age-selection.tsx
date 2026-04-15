'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Users, ToyBrick, Rocket } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

type AgeGroupInfo = {
    title: string;
    description: string;
    value: 'under-10' | '10-16' | '16-plus';
    icon: any;
};

const ageGroups: AgeGroupInfo[] = [
  {
    title: 'Under 10',
    description: 'A fun, high-vibrancy environment optimized for safety and foundational discovery.',
    value: 'under-10',
    icon: ToyBrick,
  },
  {
    title: '10-16',
    description: 'A collaborative matrix for social connection, creative logic, and community growth.',
    value: '10-16',
    icon: Users,
  },
  {
    title: '16 Plus',
    description: 'Advanced high-performance tools and mature content for the next generation of leaders.',
    value: '16-plus',
    icon: Rocket,
  },
];

interface AgeSelectionProps {
    onSelectAgeGroup: (ageGroup: 'under-10' | '10-16' | '16-plus') => void;
    disabled?: boolean;
}

export function AgeSelection({ onSelectAgeGroup, disabled }: AgeSelectionProps) {
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
      {ageGroups.map((group) => (
        <Card key={group.title} className="h-full border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
          <CardHeader className="flex flex-col items-center space-y-6 text-center p-8">
            <div className="rounded-3xl bg-primary/10 p-5 text-primary group-hover:scale-110 transition-transform border border-primary/20">
              <group.icon className="h-12 w-12" />
            </div>
            <div className="space-y-3">
              <CardTitle className="font-headline text-2xl font-black uppercase tracking-tight leading-tight animate-text-color-sync">
                {group.title}
              </CardTitle>
              <CardDescription className="text-sm font-medium italic opacity-80 leading-relaxed animate-text-color-sync">
                "{group.description}"
              </CardDescription>
            </div>
          </CardHeader>
          <div className="p-8 pt-0">
             <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl group active:scale-95 transition-all animate-bg-color-sync border-none text-white" onClick={() => onSelectAgeGroup(group.value)} disabled={disabled}>
                <span className="animate-text-color-sync brightness-200">INITIALIZE NODE</span>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
