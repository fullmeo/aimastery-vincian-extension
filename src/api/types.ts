// Types pour la génération de contenu pour les réseaux sociaux

export type UserTier = 'free' | 'pro' | 'enterprise';

export interface SocialMediaContent {
  platform: string;
  content: string;
  hashtags: string[];
  mediaType?: 'image' | 'video' | 'text';
  metadata?: Record<string, any>;
}

export interface SocialMediaPack {
  contents: SocialMediaContent[];
  generatedAt: string;
  cached?: boolean;
}

export interface AnalysisData {
  summary: string;
  keyPoints?: string[];
  vincianScore?: number;
  goldenRatioScore?: number;
  [key: string]: any;
}

export interface User {
  id: string;
  tier: UserTier;
  email?: string;
  name?: string;
}
