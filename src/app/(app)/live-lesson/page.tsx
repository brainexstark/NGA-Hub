'use client';

import { useState, useRef, useEffect } from 'react';
import { generateLessonPlan } from '../../../ai/flows/generate-lesson-plan';
import { generateLessonAudio } from '../../../ai/flows/generate-lesson-audio';
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Loader2, Sparkles, Volume2 } from "lucide-react";
import { useToast } from '../../../hooks/use-toast';
import { containsInappropriateWords } from '../../../lib/inappropriate-words';

export default function LiveLessonPage() {
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState<'under 10' | '10-16' | '16+'>('10-16');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic) {
      toast({
        variant: 'destructive',
        title: 'Topic is required',
        description: 'Please enter a topic for the lesson plan.',
      });
      return;
    }

    if (containsInappropriateWords(topic)) {
      toast({
        variant: 'destructive',
        title: 'Inappropriate Content',
        description: 'The topic contains words that are not allowed. Please choose a different topic.',
      });
      return;
    }

    setIsLoading(true);
    setLessonPlan('');
    setAudioDataUri('');

    const result = await generateLessonPlan({ topic, ageGroup });
    setLessonPlan(result.lessonPlan);

    setIsLoading(false);
  };
  
  const handlePlayAudio = async () => {
    if (!lessonPlan) return;

    setIsGeneratingAudio(true);
    setAudioDataUri('');

    try {
      const result = await generateLessonAudio({ lessonText: lessonPlan });
      setAudioDataUri(result.audioDataUri);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Audio Generation Failed',
        description: 'Could not generate audio for the lesson.',
      });
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  useEffect(() => {
    if (audioDataUri && audioRef.current) {
        audioRef.current.play();
    }
  }, [audioDataUri]);


  return (
    <div className="container mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-bold">AI Live Lesson Generator</h1>
        <p className="text-muted-foreground text-lg">
          Generate an instant lesson plan for any topic, "streamed" by our AI instructor.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Details</CardTitle>
              <CardDescription>Provide a topic and age group.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., The Solar System"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age-group">Age Group</Label>
                <Select value={ageGroup} onValueChange={(value) => setAgeGroup(value as any)}>
                  <SelectTrigger id="age-group">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under 10">Under 10</SelectItem>
                    <SelectItem value="10-16">10-16</SelectItem>
                    <SelectItem value="16+">16+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Lesson
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle>Generated Lesson Plan</CardTitle>
              <CardDescription>
                {isLoading ? "Our AI teacher is preparing the lesson..." : "Here is your generated lesson plan."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}
              {lessonPlan && (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-lg border bg-muted/50 p-6">
                  {lessonPlan}
                </div>
              )}
              {lessonPlan && !isLoading && (
                  <div className="space-y-4">
                     <Button onClick={handlePlayAudio} disabled={isGeneratingAudio} className="w-full">
                        {isGeneratingAudio ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Volume2 className="mr-2 h-4 w-4" />
                        )}
                        Play Lesson Audio
                    </Button>
                    {audioDataUri && <audio ref={audioRef} src={audioDataUri} className="hidden" controls />}
                  </div>
              )}
               {!isLoading && !lessonPlan && (
                <div className="flex flex-col justify-center items-center h-64 text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4"/>
                  <p>Your lesson plan will appear here once generated.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
