/**
 * NGA Hub — Cloudflare Workers AI Integration
 * Uses Cloudflare's free AI REST API for:
 * 1. Content moderation
 * 2. Search filtering
 * 3. AI chat assistant
 * 4. Algorithm feed personalisation
 *
 * No SDK needed — plain fetch calls to Cloudflare REST API.
 * Set NEXT_PUBLIC_CF_ACCOUNT_ID and NEXT_PUBLIC_CF_AI_TOKEN in .env
 */

const CF_ACCOUNT_ID = process.env.NEXT_PUBLIC_CF_ACCOUNT_ID || '';
const CF_AI_TOKEN   = process.env.NEXT_PUBLIC_CF_AI_TOKEN   || '';

// Models
const MODELS = {
  text:   '@cf/meta/llama-3-8b-instruct',
  embed:  '@cf/baai/bge-small-en-v1.5',
};

const BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run`;

async function cfRun(model: string, body: object): Promise<any> {
  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) return null;
  try {
    const res = await fetch(`${BASE}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_AI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000), // 5s max
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.result ?? null;
  } catch {
    return null;
  }
}

// ─── 1. CONTENT MODERATION ────────────────────────────────────────────────────
export async function aiModerateContent(text: string): Promise<{ flagged: boolean; reason: string }> {
  // Fast local check first
  const LOCAL_BANNED = [
    'nude', 'naked', 'porn', 'xxx', 'sex', 'drugs', 'kill', 'murder',
    'suicide', 'bomb', 'weapon', 'hack', 'rape', 'abuse',
  ];
  const lower = text.toLowerCase();
  const localHit = LOCAL_BANNED.find(w => lower.includes(w));
  if (localHit) return { flagged: true, reason: `Contains inappropriate content: "${localHit}"` };

  // Cloudflare AI deep check
  const result = await cfRun(MODELS.text, {
    messages: [
      {
        role: 'system',
        content: 'You are a content moderator for a youth social media app. Reply with JSON only: {"flagged":true/false,"reason":"short reason"}. Flag content that is sexual, violent, hateful, or harmful to minors. Allow educational, creative, and positive content.',
      },
      { role: 'user', content: `Moderate this post: "${text}"` },
    ],
    max_tokens: 60,
  });

  if (!result?.response) return { flagged: false, reason: '' };

  try {
    const parsed = JSON.parse(result.response.trim().replace(/```json|```/g, ''));
    return { flagged: !!parsed.flagged, reason: parsed.reason || '' };
  } catch {
    return { flagged: false, reason: '' };
  }
}

// ─── 2. SEARCH FILTERING ─────────────────────────────────────────────────────
export async function aiFilterSearch(query: string, ageGroup: string): Promise<{ allowed: boolean; reason: string }> {
  const BLOCKED_SEARCH = [
    'porn', 'nude', 'sex', 'drugs', 'violence', 'hack', 'weapon',
  ];
  const lower = query.toLowerCase();
  const localHit = BLOCKED_SEARCH.find(w => lower.includes(w));
  if (localHit) return { allowed: false, reason: `Search blocked for "${localHit}"` };

  // For under-13 do stricter check via AI
  if (ageGroup === 'under-13') {
    const result = await cfRun(MODELS.text, {
      messages: [
        {
          role: 'system',
          content: 'You are a search filter for a children\'s app (under 13). Reply JSON only: {"allowed":true/false,"reason":""}. Block anything adult, violent, or age-inappropriate.',
        },
        { role: 'user', content: `Is this search safe for children under 13? Query: "${query}"` },
      ],
      max_tokens: 40,
    });

    if (result?.response) {
      try {
        const parsed = JSON.parse(result.response.trim().replace(/```json|```/g, ''));
        return { allowed: !!parsed.allowed, reason: parsed.reason || '' };
      } catch {}
    }
  }

  return { allowed: true, reason: '' };
}

// ─── 3. AI CHAT ASSISTANT ─────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function aiChat(messages: ChatMessage[], ageGroup: string): Promise<string> {
  const systemPrompt = ageGroup === 'under-13'
    ? 'You are a friendly, safe AI assistant for children. Keep answers short, simple, positive and educational. Never discuss adult topics.'
    : ageGroup === '14-17'
    ? 'You are a helpful AI assistant for teenagers on NGA Hub. Be informative, encouraging and age-appropriate. Help with homework, creativity, and social questions.'
    : 'You are a helpful AI assistant on NGA Hub. Be informative, professional and helpful. You can discuss a wide range of topics.';

  const result = await cfRun(MODELS.text, {
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10), // last 10 messages for context
    ],
    max_tokens: 300,
    stream: false,
  });

  return result?.response?.trim() || "I'm having trouble responding right now. Please try again.";
}

// ─── 4. ALGORITHM FEED ───────────────────────────────────────────────────────
export async function aiRankFeed(
  posts: any[],
  userInterests: Record<string, number>,
  watchHistory: string[],
): Promise<any[]> {
  if (!posts.length) return posts;

  // Score each post locally based on user interest weights
  const scored = posts.map(post => {
    let score = 0;
    const cat = (post.category || 'general').toLowerCase();

    // Category interest weight (0–10 scale from watch history)
    score += (userInterests[cat] || 0) * 2;

    // Recency bonus — newer posts score higher
    const ageHours = (Date.now() - new Date(post.createdAt || 0).getTime()) / 3600000;
    score += Math.max(0, 10 - ageHours / 2);

    // Popularity bonus
    score += Math.min((post.likesCount || 0) / 5, 5);

    // Penalise already-watched posts
    if (watchHistory.includes(post.id)) score -= 8;

    return { ...post, _score: score };
  });

  // Sort by score descending, keeping newest 2 at top always
  const top2 = scored.slice(0, 2);
  const rest = scored.slice(2).sort((a, b) => b._score - a._score);

  return [...top2, ...rest].map(({ _score, ...p }) => p);
}
