export type Language = 'en' | 'hi' | 'hinglish'
export type PaperStatus = 'QUEUED' | 'EXTRACTED' | 'FAILED'
export type PaperSourceType = 'PDF' | 'URL'
export type ClaimReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PackageStatus = 'AWAITING_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED'
export type AssetType = 'CAROUSEL' | 'STATIC' | 'REEL' | 'CAPTION'
export type AssetStatus = 'DRAFT' | 'APPROVED' | 'REJECTED'
export type BatchStatus = 'RUNNING' | 'COMPLETED' | 'PARTIAL_FAILURE' | 'FAILED'
export type Platform = 'INSTAGRAM_FEED' | 'INSTAGRAM_REELS' | 'INSTAGRAM_STORIES' | 'FACEBOOK'
export type ScheduleStatus = 'SCHEDULED' | 'PUBLISHED' | 'FAILED'
export type Tab = 'papers' | 'review' | 'studio' | 'schedule' | 'effort'
export interface PaperView { id: string; title: string; sourceType: PaperSourceType; sourceUrl?: string; fileName?: string; sourceDownloadUrl: string; pageCount: number; status: PaperStatus; failureReason?: string; createdAt: string }
export interface ClaimView { id: string; claimText: string; plainLanguage: string; evidenceQuote: string; pageNumber: number; section: string; confidence: number; evidenceVerified: boolean; reviewStatus: ClaimReviewStatus; reviewer?: string; reviewNote?: string; reviewedAt?: string }
export interface CarouselSlide { headline: string; body: string; theme?: string }
export interface CarouselPayload { slides: CarouselSlide[]; dimensions: string }
export interface StaticPayload { headline: string; body: string; footer: string; dimensions: string }
export interface ReelScene { time: string; visual: string; voiceover: string; subtitle: string }
export interface ReelPayload { hook: string; totalSeconds: number; musicMood: string; scenes: ReelScene[]; bRollPrompts: string[] }
export interface CaptionPayload { text: string; hashtags: string[] }
export interface AssetView { id: string; type: AssetType; title: string; payload: CarouselPayload | StaticPayload | ReelPayload | CaptionPayload | Record<string, unknown>; claimIds: string[]; status: AssetStatus }
export interface PackageView { id: string; paper: PaperView; language: Language; audience: string; coreMessage: string; reasoning: string; status: PackageStatus; aiProvider: string; promptVersion: string; estimatedHumanMinutes: number; readyForApproval: boolean; claims: ClaimView[]; assets: AssetView[]; createdAt: string }
export interface BatchView { id: string; status: BatchStatus; requestedCount: number; completedCount: number; failedCount: number; packageIds: string[]; errors: Record<string, string>; createdAt: string; completedAt?: string }
export interface ScheduledPostView { id: string; packageId: string; platform: Platform; scheduledFor: string; status: ScheduleStatus; caption: string; hashtags: string[]; mediaFormat: string; metaPublishedId?: string; publishedAt?: string; createdAt: string }
export interface HumanEffortView { ingestSeconds: number; extractionSeconds: number; reviewSeconds: number; exportSeconds: number; totalHumanSeconds: number; manualBaselineSeconds: number; timeSavedPercentage: number }
export type Decision = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
export interface ReviewInput { actor: string; note: string }
export interface GenerateInput { language: Language; audience: string }
export interface ScheduleInput { platform: Platform; scheduledFor: string; caption: string; hashtags: string[]; mediaFormat: string }
