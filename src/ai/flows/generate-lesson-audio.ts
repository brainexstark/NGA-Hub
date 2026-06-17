export async function generateLessonAudio(input: { lessonText: string }) {
  try {
    const response = await fetch('/api/live-lesson-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonText: input.lessonText }),
    });

    if (!response.ok) return { audioDataUri: '' };
    const data = await response.json();
    return { audioDataUri: typeof data.audioDataUri === 'string' ? data.audioDataUri : '' };
  } catch {
    return { audioDataUri: '' };
  }
}
