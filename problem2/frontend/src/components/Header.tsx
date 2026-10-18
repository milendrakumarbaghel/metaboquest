import React from 'react';
import type { Language, ResearchPaper } from '../types';

interface HeaderProps {
  activeTab: 'papers' | 'review' | 'studio' | 'schedule' | 'effort';
  setActiveTab: (tab: 'papers' | 'review' | 'studio' | 'schedule' | 'effort') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  papers: ResearchPaper[];
  activePaperId: string;
  setActivePaperId: (id: string) => void;
  pendingClaimsCount: number;
  isPackageApproved: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  papers,
  activePaperId,
  setActivePaperId,
  pendingClaimsCount,
  isPackageApproved
}) => {
  return (
    <header className="border-b border-[#E6CBBD] bg-[#F5EBDF] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <span className="font-serif text-3xl font-bold tracking-tight text-[#C04E2A]">steer</span>
            <span className="text-[#B58777] text-sm">/</span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#661414]">Science Studio</span>
              <span className="text-xs text-[#B58777]">Research Paper to Instagram Pipeline</span>
            </div>
            {isPackageApproved ? (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#661414] text-white">
                ✓ Clinically Approved
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E6CBBD] text-[#661414]">
                {pendingClaimsCount > 0 ? `${pendingClaimsCount} Claims In Review` : 'Draft'}
              </span>
            )}
          </div>

          {/* Paper Selector & Language Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="paper-select" className="text-xs font-medium text-[#795B50] whitespace-nowrap">Paper:</label>
              <select
                id="paper-select"
                value={activePaperId}
                onChange={(e) => setActivePaperId(e.target.value)}
                className="text-xs bg-[#F8F2EB] border border-[#E6CBBD] rounded-md px-2.5 py-1.5 text-[#351D1D] font-medium focus:outline-none focus:ring-2 focus:ring-[#C04E2A] max-w-[220px] sm:max-w-[280px] truncate"
              >
                {papers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Switcher */}
            <div className="inline-flex rounded-md shadow-xs border border-[#E6CBBD] bg-[#F8F2EB] p-0.5">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${language === 'en' ? 'bg-[#C04E2A] text-white' : 'text-[#351D1D] hover:bg-[#E6CBBD]'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hinglish')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${language === 'hinglish' ? 'bg-[#C04E2A] text-white' : 'text-[#351D1D] hover:bg-[#E6CBBD]'}`}
              >
                Hinglish
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${language === 'hi' ? 'bg-[#C04E2A] text-white' : 'text-[#351D1D] hover:bg-[#E6CBBD]'}`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-3 mt-3 overflow-x-auto pb-1" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('papers')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'papers'
                ? 'bg-[#661414] text-white'
                : 'text-[#351D1D] hover:bg-[#E6CBBD]/60'
            }`}
          >
            1. Papers & Evidence
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-[#661414] text-white'
                : 'text-[#351D1D] hover:bg-[#E6CBBD]/60'
            }`}
          >
            2. Doctor Review Gate
            {pendingClaimsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'review' ? 'bg-[#C04E2A] text-white' : 'bg-[#C04E2A] text-white'}`}>
                {pendingClaimsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'studio'
                ? 'bg-[#661414] text-white'
                : 'text-[#351D1D] hover:bg-[#E6CBBD]/60'
            }`}
          >
            3. Content Studio (Carousel, Static, Reel)
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'schedule'
                ? 'bg-[#661414] text-white'
                : 'text-[#351D1D] hover:bg-[#E6CBBD]/60'
            }`}
          >
            4. Publish & Schedule
          </button>
          <button
            onClick={() => setActiveTab('effort')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'effort'
                ? 'bg-[#661414] text-white'
                : 'text-[#351D1D] hover:bg-[#E6CBBD]/60'
            }`}
          >
            5. Human Effort Audit
          </button>
        </nav>
      </div>
    </header>
  );
};
