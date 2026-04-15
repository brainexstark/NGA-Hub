'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ChartContainer, ChartTooltipContent } from '../../../components/ui/chart';

const chartData = {
  '7days': {
    logins: [
      { date: 'Mon', logins: 12 },
      { date: 'Tue', logins: 20 },
      { date: 'Wed', logins: 15 },
      { date: 'Thu', logins: 25 },
      { date: 'Fri', logins: 30 },
      { date: 'Sat', logins: 22 },
      { date: 'Sun', logins: 18 },
    ],
    timeSpent: [
      { page: 'Feed', minutes: 120 },
      { page: 'Stories', minutes: 90 },
      { page: 'Reels', minutes: 240 },
      { page: 'Discover', minutes: 60 },
      { page: 'Chat', minutes: 150 },
    ],
    stats: {
        totalLogins: 142,
        avgSession: '18 min',
        newFollowers: 34,
    }
  },
  '30days': {
    logins: [
        { date: 'Week 1', logins: 142 },
        { date: 'Week 2', logins: 160 },
        { date: 'Week 3', logins: 155 },
        { date: 'Week 4', logins: 180 },
    ],
    timeSpent: [
      { page: 'Feed', minutes: 580 },
      { page: 'Stories', minutes: 410 },
      { page: 'Reels', minutes: 1100 },
      { page: 'Discover', minutes: 250 },
      { page: 'Chat', minutes: 700 },
    ],
    stats: {
        totalLogins: 637,
        avgSession: '22 min',
        newFollowers: 152,
    }
  },
};

const lineChartConfig = {
  logins: {
    label: "Logins",
    color: "hsl(var(--primary))",
  },
} satisfies import('../../../components/ui/chart').ChartConfig;

export default function ActivityPage() {
  return (
    <div className="container mx-auto space-y-8 pb-32 animate-in fade-in duration-700 pt-6">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-black uppercase tracking-tight text-white">Activity Analytics</h1>
        <p className="text-muted-foreground text-lg italic">
          Insights into your high-performance engagement and community synchronization.
        </p>
      </header>

      <Tabs defaultValue="7days">
        <TabsList className="bg-black/20 p-1 rounded-2xl border border-white/5">
          <TabsTrigger value="7days" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30days" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6">Last 30 Days</TabsTrigger>
        </TabsList>

        <TabsContent value="7days" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardHeader>
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Total Logins</CardTitle>
                      <CardDescription className="font-bold text-white/60">Last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-4xl font-black tabular-nums text-white">{chartData['7days'].stats.totalLogins}</p>
                  </CardContent>
              </Card>
               <Card className="border-2 border-accent/10 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardHeader>
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-accent">Avg. Session</CardTitle>
                      <CardDescription className="font-bold text-white/60">Last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-4xl font-black tabular-nums text-white">{chartData['7days'].stats.avgSession}</p>
                  </CardContent>
              </Card>
               <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardHeader>
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">New Followers</CardTitle>
                      <CardDescription className="font-bold text-white/60">Last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-4xl font-black tabular-nums text-white">{chartData['7days'].stats.newFollowers}</p>
                  </CardContent>
              </Card>
          </div>
          <Card className="border-2 border-white/5 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader>
                <CardTitle className="font-headline text-xl font-bold uppercase tracking-tight text-white">Weekly Summary</CardTitle>
                <CardDescription className="font-medium italic text-white/40">A quick look at your key metrics.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-foreground/80 font-medium italic leading-relaxed text-white/80">
                    "You've logged in a total of <strong className="text-primary">{chartData['7days'].stats.totalLogins}</strong> times this week, with an average session lasting about <strong className="text-primary">{chartData['7days'].stats.avgSession}</strong>. You also gained <strong className="text-accent">{chartData['7days'].stats.newFollowers}</strong> new followers. Keep up the high-performance engagement!"
                </p>
            </CardContent>
          </Card>
          <Card className="border-2 border-white/5 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-white">Activity Over Time</CardTitle>
              <CardDescription className="font-bold text-white/40">Logins per day for the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={lineChartConfig} className="h-64 w-full">
                <LineChart data={chartData['7days'].logins}>
                  <CartesianGrid vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line dataKey="logins" type="monotone" stroke="var(--color-logins)" strokeWidth={4} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="30days" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardHeader>
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Total Logins</CardTitle>
                      <CardDescription className="font-bold text-white/60">Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-4xl font-black tabular-nums text-white">{chartData['30days'].stats.totalLogins}</p>
                  </CardContent>
              </Card>
               <Card className="border-2 border-accent/10 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardHeader>
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-accent">Avg. Session</CardTitle>
                      <CardDescription className="font-bold text-white/60">Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-4xl font-black tabular-nums text-white">{chartData['30days'].stats.avgSession}</p>
                  </CardContent>
              </Card>
               <Card className="border-2 border-primary/10 bg-card/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <CardHeader>
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">New Followers</CardTitle>
                      <CardDescription className="font-bold text-white/60">Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-4xl font-black tabular-nums text-white">{chartData['30days'].stats.newFollowers}</p>
                  </CardContent>
              </Card>
          </div>
          <Card className="border-2 border-white/5 bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader>
                <CardTitle className="font-headline text-xl font-bold uppercase tracking-tight text-white">Monthly Summary</CardTitle>
                <CardDescription className="font-medium italic text-white/40">A long-term view of your legacy activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-foreground/80 font-medium italic leading-relaxed text-white/80">
                    "This month, you logged in a total of <strong className="text-primary">{chartData['30days'].stats.totalLogins}</strong> times, with an average session lasting about <strong className="text-primary">{chartData['30days'].stats.avgSession}</strong>. Your community grew by <strong className="text-accent">{chartData['30days'].stats.newFollowers}</strong> new followers. Great mission work!"
                </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}