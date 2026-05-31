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
  is_ad: true;
}

const STATIC_ADS: Ad[] = [
  {
    id: 'ad-1', partner_name: 'TechBrand', is_ad: true,
    media_url: 'https://picsum.photos/seed/ad1/800/600',
    video_url: 'https://www.youtube.com/watch?v=9JdeZ3I8xw8',
    title: 'The Future of Innovation 🚀', caption: 'Discover what\'s next in tech and engineering.',
    target_age_group: '16-plus', category: 'tech', click_url: 'https://example.com',
  },
  {
    id: 'ad-2', partner_name: 'SportsBrand', is_ad: true,
    media_url: 'https://picsum.photos/seed/ad2/800/600',
    video_url: 'https://www.youtube.com/watch?v=ZnuyfHMNMiQ',
    title: 'Champions Never Stop ⚽', caption: 'Train like a pro. Play like a champion.',
    target_age_group: '10-16', category: 'sports', click_url: 'https://example.com',
  },
  {
    id: 'ad-3', partner_name: 'KidsBrand', is_ad: true,
    media_url: 'https://picsum.photos/seed/ad3/800/600',
    video_url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    title: 'Learn & Play! 🎨', caption: 'Fun educational games for curious kids.',
    target_age_group: 'under-10', category: 'education', click_url: 'https://example.com',
  },
];

export async function fetchAds(ageGroup: string): Promise<Ad[]> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      // Strictly match the age group — no cross-group 'all' fallback
      .eq('target_age_group', ageGroup)
      .order('impressions', { ascending: false })
      .limit(5);
    if (error) { console.warn('Ads fetch error:', error.message); }
    if (data && data.length > 0) {
      const ids = data.map((d: any) => d.id);
      supabase.from('ads').update({ impressions: data[0].impressions + 1 }).in('id', ids).then(() => {});
      return data.map((d: any) => ({ ...d, is_ad: true as const }));
    }
    // Fall back to static ads for this specific age group only
    return STATIC_ADS.filter(ad => ad.target_age_group === ageGroup);
  } catch (e) {
    console.warn('Ads fetch failed:', e);
    return STATIC_ADS.filter(ad => ad.target_age_group === ageGroup);
  }
}

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

// Send a notification to a user
export async function sendNotification(params: {
  userId: string;
  type: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  message: string;
  postId?: string;
}) {
  try {
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      actor_id: params.actorId,
      actor_name: params.actorName,
      actor_avatar: params.actorAvatar,
      message: params.message,
      post_id: params.postId || null,
      is_read: false,
    });
  } catch (e) {
    console.warn('Notification send failed:', e);
  }
}

// Broadcast a system notification only to users in the same age group
export async function broadcastNotification(params: {
  type: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  message: string;
  postId?: string;
  ageGroup?: string; // restrict to this age group — required for content notifications
}) {
  try {
    let query = supabase.from('app_users').select('id').neq('id', params.actorId);
    // Strictly filter by age group so cross-group notifications never happen
    if (params.ageGroup) query = query.eq('age_group', params.ageGroup);
    const { data: users } = await query;
    if (!users?.length) return;
    await supabase.from('notifications').insert(
      users.map((u: any) => ({
        user_id: u.id,
        type: params.type,
        actor_id: params.actorId,
        actor_name: params.actorName,
        actor_avatar: params.actorAvatar,
        message: params.message,
        post_id: params.postId || null,
        is_read: false,
      }))
    );
  } catch (e) {
    console.warn('Broadcast notification failed:', e);
  }
}
