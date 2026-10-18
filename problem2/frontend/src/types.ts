export type Language = 'en' | 'hi' | 'hinglish';

export interface ResearchPaper {
  id: string;
  title: string;
  journal: string;
  doi: string;
  pmid: string;
  sourceType: 'PDF' | 'URL';
  sourceUrl?: string;
  fileName: string;
  pageCount: number;
  status: 'INGESTED' | 'GENERATED' | 'FAILED';
  sha256: string;
  pages: string[];
}

export interface Claim {
  id: string;
  packageId: string;
  claimText: string;
  plainLanguage: string;
  evidenceQuote: string;
  pageNumber: number;
  section: string;
  confidence: number;
  evidenceVerified: boolean;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer?: string;
  reviewNote?: string;
  reviewedAt?: string;
}

export interface CarouselSlide {
  headline: string;
  body: string;
  theme?: 'maroon' | 'cream';
  claimIndexes?: number[];
}

export interface CarouselPayload {
  slides: CarouselSlide[];
  dimensions: string;
}

export interface StaticPayload {
  headline: string;
  body: string;
  footer: string;
  dimensions: string;
}

export interface ReelScene {
  time: string;
  visual: string;
  voiceover: string;
  subtitle: string;
}

export interface ReelPayload {
  hook: string;
  totalSeconds: number;
  musicMood: string;
  scenes: ReelScene[];
  bRollPrompts: string[];
}

export interface CaptionPayload {
  text: string;
  hashtags: string[];
}

export interface ContentPackage {
  id: string;
  paperId: string;
  language: Language;
  audience: string;
  coreMessage: string;
  reasoning: string;
  status: 'AWAITING_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';
  aiProvider: string;
  promptVersion: string;
  estimatedHumanMinutes: number;
  readyForApproval: boolean;
  claims: Claim[];
  carousel: CarouselPayload;
  staticPost: StaticPayload;
  reel: ReelPayload;
  caption: CaptionPayload;
}

export interface ScheduledPost {
  id: string;
  packageId: string;
  platform: 'INSTAGRAM_FEED' | 'INSTAGRAM_REELS' | 'INSTAGRAM_STORIES' | 'FACEBOOK';
  scheduledFor: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  caption: string;
  hashtags: string[];
  mediaFormat: string;
  metaPublishedId?: string;
  publishedAt?: string;
}

export interface EffortMetrics {
  ingestSec: number;
  aiExtractionSec: number;
  doctorReviewSec: number;
  exportRenderSec: number;
  totalMachineSec: number;
  totalHumanSec: number;
  manualBaselineSec: number;
  timeSavedPct: number;
}

