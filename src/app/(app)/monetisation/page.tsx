'use client';

import * as React from 'react';
import { TrendingUp, WifiOff, FileText, Sparkles, Lock, DollarSign } from 'lucide-react';

const REVENUE_STREAMS = [
  {
    title: 'Offline Reels',
    icon: '📱',
    price: '$0.02/day',
    priceKes: '≈ KES 2.60/day',
    description: 'Download up to 25 reels daily for offline viewing. Perfect for low-connectivity environments. Billed via M-Pesa or Stripe.',
    status: 'Coming Soon',
    color: 'from-indigo-900/40 to-blue-900/40',
    border: 'border-indigo-500/20',
    accent: 'text-indigo-400',
    badgeColor: 'bg-indigo-500/20 text-indigo-300',
    iconBg: 'bg-indigo-500/20',
  },
  {
    title: 'Office Apps Suite',
    icon: '📋',
    price: '$0.007/day',
    priceKes: '≈ KES 0.91/day',
    description: 'Full Microsoft Office Online integration — Word, Excel, PowerPoint and OneNote embedded inside NGA Hub.',
    status: 'Coming Soon',
    color: 'from-blue-900/40 to-cyan-900/40',
    border: 'border-blue-500/20',
    accent: 'text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300',
    iconBg: 'bg-blue-500/20',
  },
  {
    title: 'Premium Features',
    icon: '⭐',
    price: 'TBD',
    priceKes: 'Custom pricing',
    description: 'Ad-free experience, profile badges, extended screen time, custom themes, advanced analytics and priority support.',
    status: 'Planning',
    color: 'from-yellow-900/40 to-orange-900/40',
    border: 'border-yellow-500/20',
    accent: 'text-yellow-400',
    badgeColor: 'bg-yellow-500/20 text-yellow-300',
    iconBg: 'bg-yellow-500/20',
  },
  {
    title: 'Ad Revenue',
    icon: '📣',
    price: 'Per impression',
    priceKes: 'Revenue share',
    description: 'Brands and creators can run targeted ads across age groups. Revenue is shared with top content creators on the platform.',
    status: 'Active',
    color: 'from-green-900/40 to-emerald-900/40',
    border: 'border-green-500/20',
    accent: 'text-green-400',
    badgeColor: 'bg-green-500/20 text-green-300',
    iconBg: 'bg-green-500/20',
  },
];

const PAYMENT_METHODS = [
  { name: 'M-Pesa', icon: '📲', desc: 'Mobile money for East Africa', ready: false },
  { name: 'Stripe', icon: '💳', desc: 'Cards & digital wallets worldwide', ready: false },
  { name: 'PayPal', icon: '🌐', desc: 'International payments', ready: false },
  { name: 'Crypto', icon: '₿', desc: 'Bitcoin & stablecoins', ready: false },
];

export default function MonetisationPage() {
  return (
    <div className="min-h-screen p-4 space-y-10 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest">
          <TrendingUp className="h-3 w-3" /> Revenue Systems
        </div>
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter">Monetisation Hub</h1>
        <p className="text-white/50 text-sm font-medium max-w-xl">
          NGA Hub's revenue roadmap — affordable micro-pricing designed for African markets with global reach.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Projected Streams', value: '4', icon: DollarSign, color: 'text-green-400' },
          { label: 'Cheapest Plan', value: '$0.007', icon: Sparkles, color: 'text-blue-400' },
          { label: 'Payment Methods', value: '4', icon: Lock, color: 'text-purple-400' },
          { label: 'Status', value: 'Coming Soon', icon: TrendingUp, color: 'text-yellow-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl bg-white/5 border border-white/5 p-4 text-center space-y-2">
            <stat.icon className={`h-5 w-5 mx-auto ${stat.color}`} />
            <p className={`font-black text-lg ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Stream Cards */}
      <div className="space-y-4">
        <h2 className="font-black text-xs uppercase tracking-widest text-white/40">Revenue Streams</h2>
        <div className="space-y-4">
          {REVENUE_STREAMS.map(stream => (
            <div
              key={stream.title}
              className={`rounded-2xl bg-gradient-to-r ${stream.color} border ${stream.border} p-5 flex items-start gap-4`}
            >
              <div className={`h-12 w-12 rounded-2xl ${stream.iconBg} flex items-center justify-center text-2xl shrink-0`}>
                {stream.icon}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-sm uppercase tracking-tight text-white">{stream.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${stream.badgeColor}`}>
                    {stream.status}
                  </span>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">{stream.description}</p>
                <div className="flex items-center gap-3 pt-1">
                  <span className={`font-black text-sm ${stream.accent}`}>{stream.price}</span>
                  <span className="text-white/30 text-[10px] font-medium">{stream.priceKes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h2 className="font-black text-xs uppercase tracking-widest text-white/40">Payment Integration</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PAYMENT_METHODS.map(pm => (
            <div key={pm.name} className="rounded-2xl bg-white/5 border border-white/5 p-4 text-center space-y-2">
              <span className="text-2xl">{pm.icon}</span>
              <p className="font-black text-xs uppercase tracking-tight text-white">{pm.name}</p>
              <p className="text-[9px] text-white/30 font-medium">{pm.desc}</p>
              <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[9px] font-black uppercase text-yellow-400">
                Pending
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="rounded-2xl bg-white/3 border border-white/5 p-5 text-center space-y-2 pb-12">
        <p className="font-black text-xs uppercase tracking-widest text-white/30">Revenue System — Coming Soon</p>
        <p className="text-white/20 text-xs leading-relaxed max-w-md mx-auto">
          All pricing is designed to be affordable for youth in developing markets. Our goal is sustainable revenue that keeps NGA Hub free for those who can't pay.
        </p>
      </div>
    </div>
  );
}
