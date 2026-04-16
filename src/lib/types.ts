
export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    ageGroup: 'under-10' | '10-16' | '16-plus' | null;
    phoneNumber?: string;
    dob?: string;
    profilePicture?: string;
    isBreached?: boolean;
    followersCount?: number;
    followingCount?: number;
    disciplesCount?: number;
    premiumFeatures?: boolean;
    channelId?: string;
    // Personalization Fields
    timerNotifications?: boolean;
    darkTheme?: boolean;
    language?: string;
    locationNotifications?: boolean;
    country?: string;
    privacyLevel?: 'public' | 'private';
    // Performance Metrics
    lessonsCompleted?: number;
    nodeStreak?: number;
    badgesEarned?: number;
    // Recommendation Engine Fields
    interests?: Record<string, number>;
    searchHistory?: string[];
    watchHistory?: string[];
    // Theme
    themeVariant?: number;
}

export interface AppStatus {
    isLockedDown: boolean;
    message?: string;
}

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    type: 'image' | 'video' | 'story' | 'reel';
    category?: string;
    mediaUrl: string;
    url?: string;
    caption: string;
    title?: string;
    ageGroup: string;
    likesCount: number;
    commentsCount: number;
    createdAt: any;
    isFlagged?: boolean;
    moderationReason?: string;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: any;
}

export interface VideoEntry {
    id: string;
    userId: string;
    title: string;
    videoUrl: string;
    duration: string;
    source: 'deposit' | 'record' | 'save';
    createdAt: any;
    isFlagged?: boolean;
}

export interface Channel {
    id: string;
    name: string;
    description?: string;
    category?: string;
    ownerId: string;
    createdAt: any;
}

export interface FeatureRequest {
    id: string;
    userId: string;
    userName: string;
    requestText: string;
    benefit?: string;
    createdAt: any;
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: any;
    nodeOrigin?: string;
    isEncrypted?: boolean;
    isGroup?: boolean;
    groupName?: string;
}

export interface FlaggedContent {
    id: string;
    contentId: string;
    contentType: 'post' | 'video' | 'chat';
    userId: string;
    userName: string;
    text: string;
    mediaUrl?: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: any;
    status: 'pending' | 'blocked' | 'cleared';
}
