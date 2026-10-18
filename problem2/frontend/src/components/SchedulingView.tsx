import React, { useState } from 'react';
import type { ContentPackage, ResearchPaper } from '../types';

interface SchedulingViewProps {
  contentPackage: ContentPackage;
  paper?: ResearchPaper;
}

export const SchedulingView: React.FC<SchedulingViewProps> = ({
  contentPackage
}) => {
  const [platform, setPlatform] = useState<'INSTAGRAM_FEED' | 'INSTAGRAM_REELS' | 'INSTAGRAM_STORIES' | 'FACEBOOK'>('INSTAGRAM_FEED');
  const [scheduledDate, setScheduledDate] = useState<string>('2026-10-20T10:00');
  const [customCaption, setCustomCaption] = useState<string>(contentPackage.caption.text);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishedStatus, setPublishedStatus] = useState<any>(null);

  const isPackageApproved = contentPackage.status === 'APPROVED';

  const handleSimulatePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setPublishedStatus({
        status: 'PUBLISHED',
        metaPostId: 'meta_ig_17984291847102941',
        publishedAt: new Date().toISOString(),
        platform: platform,
        containerId: '180293810293819'
      });
      setIsPublishing(false);
    }, 1200);
  };

  const metaGraphPayload = {
    platform: platform,
    scheduled_publish_time: new Date(scheduledDate).toISOString(),
    media_type: platform === 'INSTAGRAM_REELS' ? 'REELS' : platform === 'INSTAGRAM_FEED' ? 'CAROUSEL' : 'IMAGE',
    caption: `${customCaption}\n\n${contentPackage.caption.hashtags.join(' ')}`,
    children_items: platform === 'INSTAGRAM_FEED' ? [
      { image_url: `https://api.steerclub.com/v1/packages/${contentPackage.id}/render/carousel/slides/0` },
      { image_url: `https://api.steerclub.com/v1/packages/${contentPackage.id}/render/carousel/slides/1` },
      { image_url: `https://api.steerclub.com/v1/packages/${contentPackage.id}/render/carousel/slides/2` },
      { image_url: `https://api.steerclub.com/v1/packages/${contentPackage.id}/render/carousel/slides/3` },
      { image_url: `https://api.steerclub.com/v1/packages/${contentPackage.id}/render/carousel/slides/4` }
    ] : undefined,
    video_url: platform === 'INSTAGRAM_REELS' ? `https://api.steerclub.com/v1/packages/${contentPackage.id}/render/reel/video` : undefined,
    image_url: platform !== 'INSTAGRAM_REELS' && platform !== 'INSTAGRAM_FEED' ? `https://api.steerclub.com/v1/packages/${contentPackage.id}/render/static?format=portrait` : undefined,
    access_token: 'EAAX...[SECURE_META_GRAPH_TOKEN]'
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#661414] bg-[#E6CBBD]/60 px-2 py-0.5 rounded">
                Distribution Connector
              </span>
              <span className="text-xs text-[#B58777]">• Meta Graph API / Instagram Content Publishing</span>
            </div>
            <h2 className="text-xl font-serif text-[#661414] font-bold mt-1">
              Social Media Scheduling & Meta Connector
            </h2>
            <p className="text-xs text-[#351D1D] mt-0.5">
              Automate multi-channel scheduling for Instagram Feed Carousels, Video Reels, and Stories once clinically approved.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPackageApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                <span>✓</span>
                <span>Clinically Approved for Publishing</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
                <span>🔒</span>
                <span>Locked (Doctor Approval Required)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Schedule Configuration */}
        <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#661414]">
            Campaign Settings & Platforms
          </h3>

          <div>
            <label className="text-xs font-semibold text-[#351D1D] block mb-1">Target Channel:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'INSTAGRAM_FEED', label: '📸 Instagram Carousel Feed' },
                { id: 'INSTAGRAM_REELS', label: '🎬 Instagram Reels Video' },
                { id: 'INSTAGRAM_STORIES', label: '📱 Instagram Story (9:16)' },
                { id: 'FACEBOOK', label: '👥 Facebook Brand Page' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlatform(item.id as any)}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                    platform === item.id
                      ? 'bg-[#661414] text-white border-[#661414] shadow-xs'
                      : 'bg-[#F5EBDF] border-[#E6CBBD] text-[#351D1D] hover:bg-[#E6CBBD]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#351D1D] block mb-1">Publishing Date & Time:</label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full text-xs bg-[#F5EBDF] border border-[#E6CBBD] rounded-md px-3 py-2 text-[#351D1D] focus:outline-none focus:ring-1 focus:ring-[#C04E2A]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#351D1D] block mb-1">Custom Caption:</label>
            <textarea
              rows={4}
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              className="w-full text-xs bg-[#F5EBDF] border border-[#E6CBBD] rounded-md p-2.5 text-[#351D1D] focus:outline-none focus:ring-1 focus:ring-[#C04E2A]"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSimulatePublish}
              disabled={isPublishing || !isPackageApproved}
              className="w-full py-2.5 px-4 bg-[#C04E2A] hover:bg-[#a63d1e] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Sending to Meta Graph API...
                </span>
              ) : (
                '🚀 Schedule / Publish Post Now'
              )}
            </button>
            {!isPackageApproved && (
              <p className="text-[11px] text-[#C04E2A] mt-1 text-center font-medium">
                * Note: Under medical review rules, publishing requires doctor sign-off.
              </p>
            )}
          </div>

          {publishedStatus && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span>✓ Successfully Sent to Meta!</span>
              </div>
              <div>Meta Container ID: <code className="bg-emerald-100 px-1 py-0.5 rounded">{publishedStatus.containerId}</code></div>
              <div>Live Post ID: <code className="bg-emerald-100 px-1 py-0.5 rounded">{publishedStatus.metaPostId}</code></div>
              <div className="text-[11px] text-emerald-700">Timestamp: {new Date(publishedStatus.publishedAt).toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Right: Meta Graph API Payload Inspector */}
        <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#661414]">
              Meta Graph API Payload Preview
            </h3>
            <span className="text-[10px] text-[#B58777] font-mono">POST /v19.0/{'{ig_user_id}'}/media</span>
          </div>

          <p className="text-xs text-[#795B50]">
            The pipeline converts the doctor-approved clinical package into standard JSON parameters expected by Instagram Graph API containers.
          </p>

          <pre className="flex-1 bg-[#351D1D] text-[#F5EBDF] p-3.5 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
            {JSON.stringify(metaGraphPayload, null, 2)}
          </pre>

          <div className="p-3 bg-[#F5EBDF] rounded-lg border border-[#E6CBBD] text-[11px] text-[#351D1D] space-y-1">
            <strong>Supported Meta Formats:</strong>
            <ul className="list-disc list-inside space-y-0.5 text-[#795B50]">
              <li>CAROUSEL: 5-7 slides sequence (1080x1350 / 1080x1080)</li>
              <li>REELS: 9:16 vertical video with synchronized audio and subtitles</li>
              <li>STATIC: Single editorial graphic in multiple dimensions</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};
