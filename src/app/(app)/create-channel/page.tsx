'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Atom } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { containsInappropriateWords } from '@/lib/inappropriate-words';

export default function CreateChannelPage() {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName) {
      toast({
        variant: 'destructive',
        title: 'Channel Name Required',
        description: 'Please provide a name for your channel.',
      });
      return;
    }
    if (containsInappropriateWords(channelName) || containsInappropriateWords(description)) {
      toast({
        variant: 'destructive',
        title: 'Inappropriate Content Detected',
        description: 'Please remove any inappropriate words from your channel name or description.',
      });
      return;
    }
    // In a real app, you would now send this data to your backend.
    toast({
      title: 'Channel Launched!',
      description: 'Your channel is now live.',
    });
    setChannelName('');
    setDescription('');
  };

  return (
    <div className="container mx-auto flex justify-center items-center flex-grow">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create Your Channel</CardTitle>
          <CardDescription>
            Start your journey on NGA Hub by creating a channel to share your content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input id="channel-name" placeholder="e.g., QuantumLeap Gaming" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-description">Description</Label>
              <Textarea id="channel-description" placeholder="Tell everyone what your channel is about." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-category">Category</Label>
               <Select>
                <SelectTrigger id="channel-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learning">Learning & Education</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                   <SelectItem value="art-design">Art & Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" size="lg">
              <Atom className="mr-2 h-5 w-5" />
              Launch Channel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
