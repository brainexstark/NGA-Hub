'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth, useUser } from '../firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { supabase } from '../lib/supabase';
import { Bell, Settings, LogOut, Activity } from 'lucide-react';
import type { UserProfile } from '../lib/types';
import { useToast } from '../hooks/use-toast';
import { useState, useEffect } from 'react';

export function UserNav() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('app_users').select('*').eq('id', user.uid).single()
      .then(({ data }) => { if (data) setProfile(data as UserProfile); });
  }, [user?.uid]);

  const handleLogout = async () => {
    if (!auth) return;
    await auth.signOut();
    router.push('/sign-in');
  };

  const handleNotifications = () => {
    router.push('/activity');
  };

  if (isUserLoading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return (
       <Link href="/sign-in">
          <Button variant="outline">Log In</Button>
        </Link>
    )
  }

  const avatarUrl = profile?.profilePicture || user.photoURL || '';
  const displayName = profile?.displayName || user.displayName || 'NGA User';

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleNotifications}
        className="relative h-10 w-10 rounded-full text-muted-foreground hover:text-primary transition-all"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent animate-pulse" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
              />
              <AvatarFallback className="bg-primary/10 font-bold text-primary">{displayName.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
             <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer font-medium">
                <Settings className="mr-2 h-4 w-4" /> Profile Settings
              </DropdownMenuItem>
            </Link>
             <Link href="/activity">
              <DropdownMenuItem className="cursor-pointer font-medium">
                <Activity className="mr-2 h-4 w-4" /> Your Activity
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive font-bold">
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
