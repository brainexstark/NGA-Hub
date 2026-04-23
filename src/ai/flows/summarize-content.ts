export type SummarizeContentInput = { videoTitle: string; videoDescription: string; videoTranscript?: string };
export type SummarizeContentOutput = { summary: string };

export async function summarizeContent(input: SummarizeContentInput): Promise<SummarizeContentOutput> {
  if (typeof window === 'undefined') {
    try {
      const { getAI } = await import('../genkit');
      const ai = getAI();
      if (ai) {
        const { text } = await ai.generate({ prompt: `Summarize in 2-3 sentences:\nTitle: ${input.videoTitle}\nDescription: ${input.videoDescription}` });
        return { summary: text };
      }
    } catch {}
  }
  return { summary: `${input.videoTitle} — ${input.videoDescription}` };
}
