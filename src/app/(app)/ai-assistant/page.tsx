'use client';

import * as React from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Send, Bot, Loader2, ArrowLeft } from 'lucide-react';
import { useUser } from '../../../firebase';
import { supabase } from '../../../lib/supabase';
import type { UserProfile } from '../../../lib/types';
import { aiChat, type ChatMessage } from '../../../lib/cloudflare-ai';
import Link from 'next/link';
import { cn } from '../../../lib/utils';

const CF_ACCOUNT_ID = process.env.NEXT_PUBLIC_CF_ACCOUNT_ID || '';

export default function AiAssistantPage() {
  const { user } = useUser();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    if (user) supabase.from('app_users').select('*').eq('id', user.uid).single()
      .then(({ data }) => { if (data) setProfile(data as UserProfile); });
  }, [user?.uid]);

  const ageGroup = profile?.ageGroup || '14-17';

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiChat(newMessages, ageGroup);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't respond right now. Please try again.",
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!CF_ACCOUNT_ID) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-5 rounded-[2.5rem] bg-white/5 border border-white/10">
          <Bot className="h-14 w-14 text-white/40" />
        </div>
        <div className="space-y-3 max-w-sm">
          <h1 className="font-headline text-3xl font-black uppercase tracking-tighter">NGA Hub AI</h1>
          <p className="text-white/60 font-medium leading-relaxed">
            🤖 AI Assistant coming soon! Add your Cloudflare AI credentials to enable.
          </p>
          <p className="text-white/30 text-sm">
            Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_CF_ACCOUNT_ID</code> and{' '}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_CF_AI_TOKEN</code> in your environment.
          </p>
        </div>
        <Link href="/ai-tools">
          <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to AI Tools
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] max-h-screen bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-10">
        <Link href="/ai-tools">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <h1 className="font-black text-sm uppercase tracking-tight text-white">NGA Hub AI</h1>
            <p className="text-[10px] text-white/40 font-medium">
              {ageGroup === 'under-13' ? 'Safe mode for children' : ageGroup === '14-17' ? 'Teen assistant' : 'AI assistant'}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase text-green-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
            <div className="text-5xl">🤖</div>
            <div className="space-y-2">
              <p className="font-black text-lg text-white/80 uppercase tracking-tight">NGA Hub AI</p>
              <p className="text-white/40 text-sm max-w-xs">
                {ageGroup === 'under-13'
                  ? 'Hi! I\'m your friendly AI helper. Ask me anything safe!'
                  : ageGroup === '14-17'
                  ? 'Hey! I can help with homework, ideas, and more. What\'s up?'
                  : 'Hello! I\'m here to help. What would you like to know?'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {(['Tell me a fun fact', 'Help with homework', 'What can you do?'] as string[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm mr-2 mt-0.5 shrink-0">
                🤖
              </div>
            )}
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-zinc-800 text-white/90 rounded-bl-sm'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm mr-2 shrink-0">
              🤖
            </div>
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 p-4 bg-zinc-900/90 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center gap-2 bg-zinc-800 rounded-2xl px-4 py-2 border border-white/10 focus-within:border-primary/40 transition-colors">
          <input
            ref={inputRef}
            type="text"
            placeholder="Message NGA Hub AI..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none py-1.5 font-medium"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/80 active:scale-95 transition-all"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-[9px] text-white/20 font-medium mt-2 uppercase tracking-widest">
          Powered by Cloudflare Workers AI
        </p>
      </div>
    </div>
  );
}
