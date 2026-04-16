// Ad system — ads look identical to regular reels/posts
import { supabase } from './supabase';

export interface Ad {
  id: string;
  partner_name: string;
  media_url: string;
  video_url?: string;
  caption: string;
  title: string;
  target_age_group: string;
  category: string;
  click_url?: string;
  is_ad: true; // internal flag, never shown to user
}

// Fallback static ads that look like regular content
const STATIC_ADS: Ad[] = [
  {
    id: 'ad-1', partner_name: 'TechBrand', is_ad: true,
    media_url: 'https://picsum.photos/seed/ad1/800/600',
    video_url: 'https://www.youtube.com/watch?v=9JdeZ3I8xw8',
    title: 'The Future of Innovation 🚀', caption: 'Discover what\'s next in tech and engineering.',
    target_age_group: 'all', category: 'tech', click_url: 'https://example.com',
  },
  {
    id: 'ad-2', partner_name: 'SportsBrand', is_ad: true,
    media_url: 'https://picsum.photos/seed/ad2/800/600',
    video_url: 'https://www.youtube.com/watch?v=ZnuyfHMNMiQ',
    title: 'Champions Never Stop ⚽', caption: 'Train like a pro. Play like a champion.',
    target_age_group: 'all', category: 'sports', click_url: 'https://example.com',
  },
  {
    id: 'ad-3', partner_name: 'MusicBrand', is_ad: true,
    media_url: 'https://picsum.photos/seed/ad3/800/600',
    video_url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    title: 'Feel the Beat 🎵', caption: 'New sounds, new vibes. Stream now.',
    target_age_group: 'all', category: 'music', click_url: 'https://example.com',
  },
];

export async function fetchAds(ageGroup: string): Promise<Ad[]> {
  if (!supabase) return STATIC_ADS;
  const { data } = await supabase
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .or(`target_age_group.eq.all,target_age_group.eq.${ageGroup}`)
    .limit(5);
  if (!data || data.length === 0) return STATIC_ADS;
  return data.map(d => ({ ...d, is_ad: true as const }));
}

// Inject ads into a feed array at natural intervals (every 5 posts)
export function injectAds<T>(posts: T[], ads: Ad[], interval = 5): (T | Ad)[] {
  if (ads.length === 0) return posts;
  const result: (T | Ad)[] = [];
  let adIndex = 0;
  posts.forEach((post, i) => {
    result.push(post);
    if ((i + 1) % interval === 0 && adIndex < ads.length) {
      result.push(ads[adIndex % ads.length]);
      adIndex++;
    }
  });
  return result;
}

export function isAd(item: any): item is Ad {
  return item?.is_ad === true;
}
