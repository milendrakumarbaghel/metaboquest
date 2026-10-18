import { useState } from 'react';
import { DEMO_PAPERS, DEMO_PACKAGES } from './mockData';
import type { ResearchPaper, ContentPackage, Language } from './types';
import { Header } from './components/Header';
import { PapersView } from './components/PapersView';
import { DoctorReviewView } from './components/DoctorReviewView';
import { MediaStudioView } from './components/MediaStudioView';
import { SchedulingView } from './components/SchedulingView';
import { EffortAuditView } from './components/EffortAuditView';

export function App() {
  const [papers, setPapers] = useState<ResearchPaper[]>(DEMO_PAPERS);
  const [activePaperId, setActivePaperId] = useState<string>('paper-1');
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'papers' | 'review' | 'studio' | 'schedule' | 'effort'>('studio');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [packagesState, setPackagesState] = useState<Record<string, Record<string, ContentPackage>>>(DEMO_PACKAGES);

  const activePaper = papers.find(p => p.id === activePaperId) || papers[0];
  const activePackage = packagesState[activePaperId]?.[language] || DEMO_PACKAGES['paper-1']['en'];

  const pendingClaimsCount = activePackage.claims.filter(c => c.reviewStatus === 'PENDING').length;
  const isPackageApproved = activePackage.status === 'APPROVED';

  const handleSelectPaper = (paper: ResearchPaper) => {
    setActivePaperId(paper.id);
  };

  const handleUploadMockPdf = (file: File) => {
    const newPaper: ResearchPaper = {
      id: 'paper-' + (papers.length + 1),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      journal: 'Clinical Manuscript Upload',
      doi: '10.1016/j.met.2026.04.' + (papers.length + 1),
      pmid: '419' + Math.floor(10000 + Math.random() * 90000),
      sourceType: 'PDF',
      fileName: file.name,
      pageCount: 3,
      status: 'INGESTED',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      pages: [
        `Extracted Page 1: Abstract and clinical methodology for ${file.name}.\nEvaluated incretin receptor agonist versus lifestyle counseling in adults with metabolic risk factors.`,
        `Extracted Page 2: Primary endpoints and quantitative results.\nParticipants maintained significant body weight and HbA1c reductions at 24 weeks under continuous clinical supervision.`,
        `Extracted Page 3: Discussion and physician oversight.\nSustained habit transformation and structured maintenance ensure muscle preservation during weight loss.`
      ]
    };
    setPapers([newPaper, ...papers]);
    setActivePaperId(newPaper.id);
  };

  const handleImportUrl = (url: string) => {
    const newPaper: ResearchPaper = {
      id: 'paper-' + (papers.length + 1),
      title: 'Imported Clinical Article from URL',
      journal: 'Public Health Literature Archive',
      doi: '10.1056/NEJMoa2026' + (papers.length + 1),
      pmid: '4149' + Math.floor(1000 + Math.random() * 9000),
      sourceType: 'URL',
      sourceUrl: url,
      fileName: 'imported_article.html',
      pageCount: 2,
      status: 'INGESTED',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      pages: [
        `Imported Article Page 1 (Source: ${url})\nCardiometabolic clinical investigation demonstrating the efficacy of physician-guided metabolic habit formation.`,
        `Imported Article Page 2 (Source: ${url})\nOne-year follow-up confirms adherence to personalized Indian nutrition plans prevents weight regain rebound.`
      ]
    };
    setPapers([newPaper, ...papers]);
    setActivePaperId(newPaper.id);
  };

  const handleTriggerGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setActiveTab('review');
    }, 1500);
  };

  const handleApproveClaim = (claimId: string, reviewer: string, note: string) => {
    const currentPkg = { ...activePackage };
    currentPkg.claims = currentPkg.claims.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          reviewStatus: 'APPROVED' as const,
          reviewer,
          reviewNote: note,
          reviewedAt: new Date().toISOString()
        };
      }
      return c;
    });

    const allApproved = currentPkg.claims.every(c => c.reviewStatus === 'APPROVED');
    currentPkg.readyForApproval = allApproved;

    setPackagesState({
      ...packagesState,
      [activePaperId]: {
        ...(packagesState[activePaperId] || {}),
        [language]: currentPkg
      }
    });
  };

  const handleRejectClaim = (claimId: string, reviewer: string, note: string) => {
    const currentPkg = { ...activePackage };
    currentPkg.claims = currentPkg.claims.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          reviewStatus: 'REJECTED' as const,
          reviewer,
          reviewNote: note,
          reviewedAt: new Date().toISOString()
        };
      }
      return c;
    });
    currentPkg.status = 'CHANGES_REQUESTED';
    currentPkg.readyForApproval = false;

    setPackagesState({
      ...packagesState,
      [activePaperId]: {
        ...(packagesState[activePaperId] || {}),
        [language]: currentPkg
      }
    });
  };

  const handleApprovePackage = (reviewer: string, note: string) => {
    const currentPkg = { ...activePackage };
    currentPkg.status = 'APPROVED';
    currentPkg.reasoning = `${currentPkg.reasoning} [Clinically signed by ${reviewer}: ${note}]`;
    setPackagesState({
      ...packagesState,
      [activePaperId]: {
        ...(packagesState[activePaperId] || {}),
        [language]: currentPkg
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F5EBDF] text-[#351D1D] flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        papers={papers}
        activePaperId={activePaperId}
        setActivePaperId={setActivePaperId}
        pendingClaimsCount={pendingClaimsCount}
        isPackageApproved={isPackageApproved}
      />

      {/* Main Tab Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'papers' && (
          <PapersView
            papers={papers}
            activePaper={activePaper}
            onSelectPaper={handleSelectPaper}
            onUploadMockPdf={handleUploadMockPdf}
            onImportUrl={handleImportUrl}
            onTriggerGenerate={handleTriggerGenerate}
            isGenerating={isGenerating}
          />
        )}

        {activeTab === 'review' && (
          <DoctorReviewView
            contentPackage={activePackage}
            onApproveClaim={handleApproveClaim}
            onRejectClaim={handleRejectClaim}
            onApprovePackage={handleApprovePackage}
            onNavigateToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'studio' && (
          <MediaStudioView
            contentPackage={activePackage}
            paper={activePaper}
          />
        )}

        {activeTab === 'schedule' && (
          <SchedulingView
            contentPackage={activePackage}
            paper={activePaper}
          />
        )}

        {activeTab === 'effort' && (
          <EffortAuditView papers={papers} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6CBBD] py-4 bg-[#F5EBDF] text-center text-xs text-[#795B50]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong className="text-[#661414]">Steer Science Studio</strong> • AI Research-to-Instagram Content Engine
          </span>
          <span className="text-[11px] text-[#B58777]">
            Doctor-led • Evidence-first • Calibrated for Indian biology • steerclub.com
          </span>
        </div>
      </footer>

    </div>
  );
}

export default App;
