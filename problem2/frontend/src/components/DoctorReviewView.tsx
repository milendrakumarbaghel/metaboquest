import React, { useState } from 'react';
import type { ContentPackage } from '../types';

interface DoctorReviewViewProps {
  contentPackage: ContentPackage;
  onApproveClaim: (claimId: string, reviewer: string, note: string) => void;
  onRejectClaim: (claimId: string, reviewer: string, note: string) => void;
  onApprovePackage: (reviewer: string, note: string) => void;
  onNavigateToStudio: () => void;
}

export const DoctorReviewView: React.FC<DoctorReviewViewProps> = ({
  contentPackage,
  onApproveClaim,
  onRejectClaim,
  onApprovePackage,
  onNavigateToStudio
}) => {
  const [reviewerName, setReviewerName] = useState<string>('Dr. A. Sharma (MD Endocrinology, Reg #88421)');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [packageNote] = useState<string>('Checked against quoted page numbers and clinical context.');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const claims = contentPackage.claims;
  const approvedCount = claims.filter(c => c.reviewStatus === 'APPROVED').length;
  const pendingCount = claims.filter(c => c.reviewStatus === 'PENDING').length;
  const rejectedCount = claims.filter(c => c.reviewStatus === 'REJECTED').length;
  const allClaimsApproved = claims.length > 0 && approvedCount === claims.length;

  const handleClaimDecision = (claimId: string, approve: boolean) => {
    const note = notes[claimId] || (approve ? 'Verified against source document' : 'Requires clinical clarification');
    if (approve) {
      onApproveClaim(claimId, reviewerName, note);
      setSuccessMsg(`Claim approved by ${reviewerName}`);
    } else {
      onRejectClaim(claimId, reviewerName, note);
      setSuccessMsg(`Claim rejected with clinical revision note`);
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleApproveAllClaims = () => {
    claims.forEach(c => {
      onApproveClaim(c.id, reviewerName, 'Clinically validated verbatim evidence span');
    });
    setSuccessMsg('All claims approved by clinician');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handlePackageSignoff = () => {
    if (!allClaimsApproved) return;
    onApprovePackage(reviewerName, packageNote);
    setSuccessMsg('Package approved! Export and publishing locks released.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Review Gate Banner & Controls */}
      <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#661414] bg-[#E6CBBD]/60 px-2 py-0.5 rounded">
                Mandatory Clinical Gate
              </span>
              <span className="text-xs text-[#B58777]">• Fail-Closed Medical Governance</span>
            </div>
            <h2 className="text-xl font-serif text-[#661414] font-bold mt-1">
              Doctor Review & Evidence Verification
            </h2>
            <p className="text-xs text-[#351D1D] mt-0.5 max-w-2xl">
              No content can become publish-ready or be exported without explicit, itemized clinical review. 
              Review each plain-language claim against its verbatim quoted source passage and page number.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 bg-[#F5EBDF] p-2.5 rounded-lg border border-[#E6CBBD] self-start lg:self-center">
            <div className="text-center px-3 border-r border-[#E6CBBD]">
              <span className="text-[10px] uppercase font-bold text-[#795B50] block">Total Claims</span>
              <span className="text-base font-bold text-[#351D1D]">{claims.length}</span>
            </div>
            <div className="text-center px-3 border-r border-[#E6CBBD]">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Approved</span>
              <span className="text-base font-bold text-emerald-800">{approvedCount}</span>
            </div>
            <div className="text-center px-3 border-r border-[#E6CBBD]">
              <span className="text-[10px] uppercase font-bold text-[#C04E2A] block">Pending</span>
              <span className="text-base font-bold text-[#C04E2A]">{pendingCount}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Rejected</span>
              <span className="text-base font-bold text-rose-800">{rejectedCount}</span>
            </div>
          </div>
        </div>

        {/* Reviewer Credentials Input */}
        <div className="mt-4 pt-4 border-t border-[#E6CBBD] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="clinician-name" className="text-xs font-semibold text-[#661414] whitespace-nowrap">Reviewing Clinician:</label>
            <input
              id="clinician-name"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="text-xs bg-[#F5EBDF] border border-[#E6CBBD] rounded-md px-3 py-1.5 text-[#351D1D] w-full sm:w-[340px] focus:outline-none focus:ring-1 focus:ring-[#C04E2A]"
            />
          </div>

          {pendingCount > 0 && (
            <button
              onClick={handleApproveAllClaims}
              className="px-3.5 py-1.5 bg-[#661414] hover:bg-[#4a0d0d] text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap"
            >
              ✓ Fast-Track: Approve All Verified Claims
            </button>
          )}
        </div>

        {successMsg && (
          <div className="mt-3 p-2 bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs rounded-md font-medium">
            ✓ {successMsg}
          </div>
        )}
      </div>

      {/* Itemized Claims Review List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#661414]">
          Traceable Claim Manifest ({claims.length} Extracted Findings)
        </h3>

        {claims.map((claim, idx) => {
          const isApproved = claim.reviewStatus === 'APPROVED';
          const isRejected = claim.reviewStatus === 'REJECTED';

          return (
            <div
              key={claim.id}
              className={`p-5 rounded-xl border transition-all ${
                isApproved
                  ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                  : isRejected
                  ? 'bg-rose-50/40 border-rose-300'
                  : 'bg-[#F8F2EB] border-[#E6CBBD] shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-bold text-[#661414]">
                    Claim {idx + 1}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F5EBDF] border border-[#E6CBBD] text-[#795B50]">
                    PDF Page {claim.pageNumber} • {claim.section || 'Results'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                    Confidence: {Math.round(claim.confidence * 100)}%
                  </span>
                </div>

                {/* Status Badge */}
                <div>
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      ✓ Approved by Clinician
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
                      ✗ Rejected
                    </span>
                  )}
                  {!isApproved && !isRejected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C04E2A] text-white">
                      ⏳ Pending Medical Review
                    </span>
                  )}
                </div>
              </div>

              {/* Claim Plain-Language Translation */}
              <div className="mt-3">
                <span className="text-[11px] font-bold text-[#C04E2A] uppercase tracking-wide block">
                  Steer Plain-Language Translation (Audience Copy):
                </span>
                <p className="text-sm font-semibold text-[#351D1D] mt-0.5 leading-relaxed">
                  "{claim.plainLanguage}"
                </p>
              </div>

              {/* Verbatim Grounded Quote */}
              <div className="mt-3 p-3 bg-amber-50/70 border-l-4 border-[#C04E2A] rounded-r-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#661414] block">
                  Verbatim Source Passage (Page {claim.pageNumber}):
                </span>
                <p className="text-xs text-[#351D1D] font-mono mt-1 leading-relaxed italic">
                  "{claim.evidenceQuote}"
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-[#B58777]">
                  <span>Exact substring located and verified in parsed document</span>
                  <span className="text-emerald-700 font-bold">✓ Substring Verified</span>
                </div>
              </div>

              {/* Reviewer Note Input & Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#E6CBBD]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:flex-1">
                  <input
                    type="text"
                    placeholder="Doctor clinical review note (e.g. Verified against Table 2 / Page 2)..."
                    value={notes[claim.id] || claim.reviewNote || ''}
                    onChange={(e) => setNotes({ ...notes, [claim.id]: e.target.value })}
                    className="w-full text-xs bg-white border border-[#E6CBBD] rounded px-3 py-1.5 text-[#351D1D] focus:outline-none focus:ring-1 focus:ring-[#C04E2A]"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleClaimDecision(claim.id, false)}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleClaimDecision(claim.id, true)}
                    className="px-4 py-1.5 rounded text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <span>✓</span>
                    <span>Approve Claim</span>
                  </button>
                </div>
              </div>

              {claim.reviewer && (
                <div className="mt-2 text-[10px] text-[#795B50] flex items-center gap-2">
                  <span>Reviewed by: <strong>{claim.reviewer}</strong></span>
                  {claim.reviewedAt && <span>• {new Date(claim.reviewedAt).toLocaleTimeString()}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Publication Lock / Final Package Approval Gate */}
      <div className={`p-6 rounded-xl border-2 transition-all ${
        contentPackage.status === 'APPROVED'
          ? 'bg-emerald-50 border-emerald-500 shadow-md'
          : allClaimsApproved
          ? 'bg-[#F8F2EB] border-[#C04E2A] shadow-md ring-2 ring-[#C04E2A]/20'
          : 'bg-[#F5EBDF] border-[#B58777] opacity-90'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {contentPackage.status === 'APPROVED' ? '✅' : allClaimsApproved ? '🔓' : '🔒'}
              </span>
              <h4 className="text-base font-bold text-[#661414] font-serif">
                {contentPackage.status === 'APPROVED'
                  ? 'Package Clinically Approved for Publication'
                  : allClaimsApproved
                  ? 'Publication Gate Unlocked: Ready for Final Clinical Sign-Off'
                  : 'Publication Gate Locked: Pending Medical Review'}
              </h4>
            </div>
            <p className="text-xs text-[#351D1D] max-w-xl">
              {contentPackage.status === 'APPROVED'
                ? 'All medical claims and generated assets are verified by Steer clinicians. High-res carousels, static images, video reels, and scheduling payloads are unlocked for export.'
                : allClaimsApproved
                ? 'Every claim in this package has been reviewed and verified against the scientific paper. Sign off to enable exports and social scheduling.'
                : 'Under Steer clinical policy, marketing materials and Instagram assets cannot be published or downloaded as approved media while any claim remains unverified.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {contentPackage.status === 'APPROVED' ? (
              <button
                onClick={onNavigateToStudio}
                className="px-5 py-2.5 bg-[#661414] hover:bg-[#4a0d0d] text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>View & Export Finished Media</span>
                <span>▶</span>
              </button>
            ) : (
              <button
                onClick={handlePackageSignoff}
                disabled={!allClaimsApproved}
                className="px-5 py-2.5 bg-[#C04E2A] hover:bg-[#a63d1e] text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>✓ Sign & Approve Content Package</span>
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
