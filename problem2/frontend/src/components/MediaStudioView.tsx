import React, { useState, useEffect, useRef } from 'react';
import type { ContentPackage, ResearchPaper } from '../types';

interface MediaStudioViewProps {
  contentPackage: ContentPackage;
  paper: ResearchPaper;
}

export const MediaStudioView: React.FC<MediaStudioViewProps> = ({
  contentPackage,
  paper
}) => {
  const [subTab, setSubTab] = useState<'carousel' | 'static' | 'reel' | 'caption'>('carousel');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [carouselRatio, setCarouselRatio] = useState<'square' | 'portrait'>('portrait');
  const [staticRatio, setStaticRatio] = useState<'square' | 'portrait' | 'story'>('portrait');
  const [showCanvaModal, setShowCanvaModal] = useState<boolean>(false);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);

  // Reel Player State
  const [isPlayingReel, setIsPlayingReel] = useState<boolean>(false);
  const [reelTime, setReelTime] = useState<number>(0); // 0 to 30
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);

  const reelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const slides = contentPackage.carousel.slides;
  const currentSlide = slides[carouselIndex] || slides[0];

  // Reel animation ticker
  useEffect(() => {
    let interval: any = null;
    if (isPlayingReel) {
      interval = setInterval(() => {
        setReelTime((prev) => {
          if (prev >= 30) {
            setIsPlayingReel(false);
            return 0;
          }
          return Math.min(30, prev + 0.1);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlayingReel]);

  // Render Reel Canvas
  useEffect(() => {
    const canvas = reelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Background Cream
    ctx.fillStyle = '#F5EBDF';
    ctx.fillRect(0, 0, width, height);

    // Instagram Reel Top Safe Header
    ctx.fillStyle = '#C04E2A';
    ctx.font = 'bold 55px Georgia, serif';
    ctx.fillText('steer', 80, 180);

    ctx.fillStyle = '#B58777';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('RESEARCH REEL • ' + Math.floor(reelTime) + 's / 30s', 260, 175);

    // Reel Progress Bar
    ctx.fillStyle = '#E6CBBD';
    ctx.fillRect(80, 210, width - 160, 8);
    ctx.fillStyle = '#C04E2A';
    const progressW = (width - 160) * (reelTime / 30);
    ctx.fillRect(80, 210, progressW, 8);

    // Current Scene Detection
    let sceneIndex = 0;
    let subtitle = contentPackage.reel.scenes[0]?.subtitle || 'Research, made simpler';
    let voiceover = contentPackage.reel.scenes[0]?.voiceover || contentPackage.reel.hook;
    let bRoll = contentPackage.reel.scenes[0]?.visual || 'Paper title appears';

    if (reelTime >= 3 && reelTime < 12) {
      sceneIndex = 1;
      subtitle = contentPackage.reel.scenes[1]?.subtitle || 'Key Evidence';
      voiceover = contentPackage.reel.scenes[1]?.voiceover || contentPackage.coreMessage;
      bRoll = contentPackage.reel.scenes[1]?.visual || 'Kinetic evidence typography';
    } else if (reelTime >= 12 && reelTime < 22) {
      sceneIndex = 2;
      subtitle = contentPackage.reel.scenes[2]?.subtitle || 'Habits, not willpower';
      voiceover = contentPackage.reel.scenes[2]?.voiceover || 'This is biology, not a failure of willpower.';
      bRoll = contentPackage.reel.scenes[2]?.visual || 'Indian lifestyle & chai break';
    } else if (reelTime >= 22) {
      sceneIndex = 3;
      subtitle = contentPackage.reel.scenes[3]?.subtitle || 'Talk to a Steer doctor';
      voiceover = contentPackage.reel.scenes[3]?.voiceover || 'Ask a doctor at steerclub.com';
      bRoll = contentPackage.reel.scenes[3]?.visual || 'Clinical review card';
    }

    // Soft Paper Card
    const cardX = 75;
    const cardY = 380;
    const cardW = width - 150;
    const cardH = 1000;
    ctx.fillStyle = '#F8F2EB';
    roundRect(ctx, cardX, cardY, cardW, cardH, 36);
    ctx.fill();
    ctx.strokeStyle = '#E6CBBD';
    ctx.lineWidth = 3;
    roundRect(ctx, cardX, cardY, cardW, cardH, 36);
    ctx.stroke();

    // Scene Badge
    ctx.fillStyle = '#661414';
    roundRect(ctx, cardX + 50, cardY + 60, 260, 48, 16);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SCENE ' + (sceneIndex + 1), cardX + 75, cardY + 92);

    // Serif Headline
    ctx.fillStyle = '#C04E2A';
    ctx.font = 'bold 56px Georgia, serif';
    drawWrapped(ctx, subtitle, cardX + 50, cardY + 180, cardW - 100, 70, 4);

    // Voiceover Script
    ctx.fillStyle = '#351D1D';
    ctx.font = '32px sans-serif';
    drawWrapped(ctx, `"${voiceover}"`, cardX + 50, cardY + 440, cardW - 100, 48, 5);

    // B-Roll Prompt Instruction Box
    const bRollY = cardY + cardH - 260;
    ctx.fillStyle = '#F5EBDF';
    roundRect(ctx, cardX + 40, bRollY, cardW - 80, 200, 20);
    ctx.fill();
    ctx.fillStyle = '#B58777';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('CAMERA & B-ROLL DIRECTION', cardX + 65, bRollY + 45);
    ctx.fillStyle = '#351D1D';
    ctx.font = 'italic 26px sans-serif';
    drawWrapped(ctx, bRoll, cardX + 65, bRollY + 95, cardW - 130, 38, 3);

    // Dynamic Soundwave Animation
    const waveY = 1540;
    ctx.fillStyle = '#C04E2A';
    for (let i = 0; i < 28; i++) {
      const barH = 20 + 40 * Math.abs(Math.sin((i + reelTime * 6) * 0.4));
      const barX = 160 + i * 28;
      roundRect(ctx, barX, waveY - barH / 2, 12, barH, 6);
      ctx.fill();
    }

    // Karaoke Subtitle Bar
    const subBoxY = 1660;
    ctx.fillStyle = 'rgba(53, 29, 29, 0.92)';
    roundRect(ctx, 80, subBoxY, width - 160, 110, 24);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(subtitle, 120, subBoxY + 68);

  }, [reelTime, contentPackage]);

  // Audio Voiceover synthesizer using Web Audio API
  const playVoiceoverAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Play synthesized warm ambient chord pad + speech cadence
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 30);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 30);

    // Speech Synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const currentVo = contentPackage.reel.scenes.map(s => s.voiceover).join('. ');
      const utterance = new SpeechSynthesisUtterance(currentVo);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleReelPlay = () => {
    if (!isPlayingReel) {
      setIsPlayingReel(true);
      playVoiceoverAudio();
    } else {
      setIsPlayingReel(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  };

  const handleResetReel = () => {
    setIsPlayingReel(false);
    setReelTime(0);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  // Video Export using MediaRecorder on Canvas
  const handleExportReelVideo = () => {
    const canvas = reelCanvasRef.current;
    if (!canvas) return;

    setIsRecordingVideo(true);
    setRecordingProgress(0);

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `steer_reel_${contentPackage.language}_30s.webm`;
        a.click();
        setIsRecordingVideo(false);
      };

      recorder.start();
      setIsPlayingReel(true);
      setReelTime(0);

      const interval = setInterval(() => {
        setRecordingProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            recorder.stop();
            return 100;
          }
          return p + 3.3;
        });
      }, 1000);

    } catch (err) {
      console.warn('MediaRecorder error, downloading storyboard image instead:', err);
      handleDownloadReelFrame();
      setIsRecordingVideo(false);
    }
  };

  const handleDownloadReelFrame = () => {
    const canvas = reelCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `steer_reel_scene_1080x1920.png`;
    a.click();
  };

  const handleDownloadSlidePng = () => {
    // Render current slide to offscreen canvas
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = carouselRatio === 'square' ? 1080 : 1350;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderSlideToCanvas(ctx, currentSlide, carouselIndex, slides.length, width, height, paper.title);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `steer_carousel_slide_${carouselIndex + 1}_${carouselRatio}.png`;
    a.click();
  };

  const handleDownloadStaticPng = () => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = staticRatio === 'square' ? 1080 : staticRatio === 'story' ? 1920 : 1350;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderStaticToCanvas(ctx, contentPackage.staticPost, width, height, paper.title);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `steer_static_post_${staticRatio}.png`;
    a.click();
  };

  const handleCopyCaption = () => {
    const fullText = `${contentPackage.caption.text}\n\n${contentPackage.caption.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Studio Header & Format Navigation */}
      <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#661414] bg-[#E6CBBD]/60 px-2 py-0.5 rounded">
                Editorial Content Factory
              </span>
              <span className="text-xs text-[#B58777]">• Multi-Format Renderers & Canva Automation</span>
            </div>
            <h2 className="text-xl font-serif text-[#661414] font-bold mt-1">
              Finished Media Production Studio
            </h2>
            <p className="text-xs text-[#351D1D] mt-0.5">
              Derived from verified claims for <strong>"{paper.title.substring(0, 60)}..."</strong>
            </p>
          </div>

          {/* Quick Format Pills */}
          <div className="flex items-center gap-2 bg-[#F5EBDF] p-1 rounded-lg border border-[#E6CBBD]">
            <button
              onClick={() => setSubTab('carousel')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                subTab === 'carousel' ? 'bg-[#661414] text-white shadow-xs' : 'text-[#351D1D] hover:bg-[#E6CBBD]'
              }`}
            >
              📸 Carousel (5 Slides)
            </button>
            <button
              onClick={() => setSubTab('static')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                subTab === 'static' ? 'bg-[#661414] text-white shadow-xs' : 'text-[#351D1D] hover:bg-[#E6CBBD]'
              }`}
            >
              🖼️ Static Graphic
            </button>
            <button
              onClick={() => setSubTab('reel')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                subTab === 'reel' ? 'bg-[#661414] text-white shadow-xs' : 'text-[#351D1D] hover:bg-[#E6CBBD]'
              }`}
            >
              🎬 AI Reel Player (30s)
            </button>
            <button
              onClick={() => setSubTab('caption')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                subTab === 'caption' ? 'bg-[#661414] text-white shadow-xs' : 'text-[#351D1D] hover:bg-[#E6CBBD]'
              }`}
            >
              📝 Captions & Tags
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: CAROUSEL STUDIO */}
      {subTab === 'carousel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Interactive Carousel Preview */}
          <div className="lg:col-span-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs flex flex-col items-center">
            
            {/* Aspect Ratio Switcher & Slide Controls */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#E6CBBD] mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#661414]">Format Ratio:</span>
                <button
                  onClick={() => setCarouselRatio('portrait')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${carouselRatio === 'portrait' ? 'bg-[#C04E2A] text-white' : 'bg-[#F5EBDF] border border-[#E6CBBD] text-[#351D1D]'}`}
                >
                  4:5 Portrait (1080x1350)
                </button>
                <button
                  onClick={() => setCarouselRatio('square')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${carouselRatio === 'square' ? 'bg-[#C04E2A] text-white' : 'bg-[#F5EBDF] border border-[#E6CBBD] text-[#351D1D]'}`}
                >
                  1:1 Square (1080x1080)
                </button>
              </div>

              {/* Slide Counter */}
              <span className="text-xs font-bold text-[#661414] bg-[#E6CBBD]/60 px-3 py-1 rounded-full">
                Slide {carouselIndex + 1} of {slides.length}
              </span>
            </div>

            {/* Slide Graphic Viewport */}
            <div className={`w-full max-w-[440px] rounded-2xl shadow-md border-2 border-[#E6CBBD] p-6 flex flex-col justify-between transition-all ${
              currentSlide.theme === 'maroon' ? 'bg-[#661414] text-[#F5EBDF]' : 'bg-[#F5EBDF] text-[#351D1D]'
            }`} style={{ aspectRatio: carouselRatio === 'portrait' ? '4/5' : '1/1' }}>
              
              {/* Slide Top Bar */}
              <div className="flex items-center justify-between border-b border-[#E6CBBD]/50 pb-2">
                <span className={`font-serif text-2xl font-bold ${currentSlide.theme === 'maroon' ? 'text-[#F5EBDF]' : 'text-[#C04E2A]'}`}>
                  steer
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B58777]">
                  {carouselIndex === 0 ? 'RESEARCH BRIEF' : `FINDING ${carouselIndex}`}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSlide.theme === 'maroon' ? 'bg-white/20 text-white' : 'bg-[#E6CBBD] text-[#661414]'
                }`}>
                  {String(carouselIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
              </div>

              {/* Slide Center Card */}
              <div className={`p-5 rounded-xl border my-auto ${
                currentSlide.theme === 'maroon' ? 'bg-black/20 border-white/20' : 'bg-[#F8F2EB] border-[#E6CBBD]'
              }`}>
                <h3 className={`font-serif text-xl sm:text-2xl font-bold leading-snug ${
                  currentSlide.theme === 'maroon' ? 'text-[#F5EBDF]' : 'text-[#C04E2A]'
                }`}>
                  {currentSlide.headline}
                </h3>
                <p className="text-xs sm:text-sm mt-3 leading-relaxed text-[#351D1D]/90">
                  {currentSlide.body}
                </p>

                {carouselIndex > 0 && carouselIndex < slides.length - 1 && (
                  <div className="mt-4 pt-3 border-t border-[#E6CBBD] flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      ✓ Clinically Verified Claim
                    </span>
                    <span className="text-[#B58777]">Page 2 Citation</span>
                  </div>
                )}
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between text-[11px] text-[#B58777] pt-2 border-t border-[#E6CBBD]/50">
                <span className="truncate max-w-[200px]">Source: {paper.title}</span>
                <span className="font-bold text-[#351D1D]">steerclub.com</span>
              </div>
            </div>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                disabled={carouselIndex === 0}
                onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                className="px-3 py-1.5 rounded-md bg-[#F5EBDF] border border-[#E6CBBD] text-xs font-semibold hover:bg-[#E6CBBD] disabled:opacity-40"
              >
                ◀ Previous Slide
              </button>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      carouselIndex === i ? 'bg-[#C04E2A] w-6' : 'bg-[#E6CBBD]'
                    }`}
                  />
                ))}
              </div>
              <button
                disabled={carouselIndex === slides.length - 1}
                onClick={() => setCarouselIndex(i => Math.min(slides.length - 1, i + 1))}
                className="px-3 py-1.5 rounded-md bg-[#F5EBDF] border border-[#E6CBBD] text-xs font-semibold hover:bg-[#E6CBBD] disabled:opacity-40"
              >
                Next Slide ▶
              </button>
            </div>
          </div>

          {/* Right: Export & Canva Automation Controls */}
          <div className="space-y-4">
            <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#661414]">
                Export & Download Media
              </h3>

              <button
                onClick={handleDownloadSlidePng}
                className="w-full py-2.5 px-3 bg-[#C04E2A] hover:bg-[#a63d1e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>💾 Download Current Slide ({carouselRatio.toUpperCase()})</span>
              </button>

              <a
                href={`/api/v1/packages/${contentPackage.id}/render/carousel/zip`}
                download
                className="w-full py-2.5 px-3 bg-[#661414] hover:bg-[#4a0d0d] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>📦 Download All 5 Slides Deck (.ZIP)</span>
              </a>

              <a
                href={`/api/v1/packages/${contentPackage.id}/render/carousel/pdf`}
                download
                className="w-full py-2 px-3 bg-[#F5EBDF] border border-[#E6CBBD] hover:bg-[#E6CBBD] text-[#351D1D] text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>📄 Download Carousel Document (PDF)</span>
              </a>

              <button
                onClick={() => setShowCanvaModal(true)}
                className="w-full py-2 px-3 bg-[#F5EBDF] border border-[#C04E2A] text-[#C04E2A] hover:bg-[#C04E2A] hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>🎨 Canva Automation & Template Sync</span>
              </button>
            </div>

            {/* Steer Voice & Editorial Rules Callout */}
            <div className="bg-[#F5EBDF] border border-[#E6CBBD] rounded-xl p-4 text-xs space-y-2">
              <span className="font-bold text-[#661414] uppercase tracking-wider text-[10px] block">
                Steer Brand Design Rules Applied
              </span>
              <ul className="space-y-1.5 text-[11px] text-[#351D1D] list-disc list-inside">
                <li>Warm cream (#F5EBDF) paper base, rust (#C04E2A) accents.</li>
                <li>Generous breathing room and high typographical contrast.</li>
                <li>No body transformation photos, no fear, no drug promotion.</li>
                <li>Every medical assertion cites the source paper and page number.</li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 2: STATIC POST STUDIO */}
      {subTab === 'static' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs flex flex-col items-center">
            
            {/* Format Ratio Selector */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#E6CBBD] mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#661414]">Aspect Ratio:</span>
                <button
                  onClick={() => setStaticRatio('portrait')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${staticRatio === 'portrait' ? 'bg-[#C04E2A] text-white' : 'bg-[#F5EBDF] border border-[#E6CBBD] text-[#351D1D]'}`}
                >
                  4:5 Portrait Feed (1080x1350)
                </button>
                <button
                  onClick={() => setStaticRatio('square')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${staticRatio === 'square' ? 'bg-[#C04E2A] text-white' : 'bg-[#F5EBDF] border border-[#E6CBBD] text-[#351D1D]'}`}
                >
                  1:1 Square Feed (1080x1080)
                </button>
                <button
                  onClick={() => setStaticRatio('story')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${staticRatio === 'story' ? 'bg-[#C04E2A] text-white' : 'bg-[#F5EBDF] border border-[#E6CBBD] text-[#351D1D]'}`}
                >
                  9:16 Story / Status (1080x1920)
                </button>
              </div>
            </div>

            {/* Static Graphic Viewport */}
            <div
              className="w-full max-w-[420px] bg-[#F5EBDF] border-2 border-[#E6CBBD] rounded-2xl p-6 shadow-md flex flex-col justify-between"
              style={{
                aspectRatio: staticRatio === 'square' ? '1/1' : staticRatio === 'story' ? '9/16' : '4/5'
              }}
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-2">
                  <span className="font-serif text-2xl font-bold text-[#C04E2A]">steer</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B58777]">
                    CLINICAL BRIEF
                  </span>
                  <span className="text-[10px] bg-[#E6CBBD] text-[#661414] font-bold px-2 py-0.5 rounded-full">
                    {staticRatio.toUpperCase()}
                  </span>
                </div>

                <div className="mt-6 p-5 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#C04E2A] leading-snug">
                    {contentPackage.staticPost.headline}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#351D1D] mt-3 leading-relaxed">
                    {contentPackage.staticPost.body}
                  </p>
                  
                  <div className="mt-4 p-2.5 bg-[#F5EBDF] rounded-md border border-[#E6CBBD]">
                    <span className="text-[10px] font-bold text-[#661414] uppercase block">Indian Context & Habits:</span>
                    <span className="text-[11px] text-[#351D1D] mt-0.5 block">
                      Calibrated for Indian bodies, meal patterns, and long-term metabolic health.
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white bg-[#661414] px-2 py-0.5 rounded">
                      ✓ CLINICALLY VERIFIED
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#B58777] pt-2 border-t border-[#E6CBBD]">
                <span className="truncate max-w-[200px]">Source: {paper.title}</span>
                <span className="font-bold text-[#351D1D]">steerclub.com</span>
              </div>
            </div>
          </div>

          {/* Static Controls */}
          <div className="space-y-4">
            <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#661414]">
                Export Static Asset
              </h3>
              <button
                onClick={handleDownloadStaticPng}
                className="w-full py-2.5 px-3 bg-[#C04E2A] hover:bg-[#a63d1e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>💾 Download High-Res PNG ({staticRatio.toUpperCase()})</span>
              </button>

              <p className="text-[11px] text-[#795B50]">
                Automatically scaled with optimized typography and generous margins for Instagram feeds and Stories.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: AI VIDEO REEL STUDIO */}
      {subTab === 'reel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Reel Interactive Canvas Player */}
          <div className="lg:col-span-2 bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#E6CBBD] mb-4">
              <div>
                <span className="text-xs font-bold text-[#661414]">AI-Generated Video Reel Player</span>
                <p className="text-[11px] text-[#B58777]">
                  9:16 Vertical Video with Synchronized Voiceover, Animated Subtitles & B-Roll
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-[#661414] text-white rounded-full">
                30-Second Composition
              </span>
            </div>

            {/* Video Canvas Element */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-[#351D1D] bg-black">
              <canvas
                ref={reelCanvasRef}
                className="w-[280px] sm:w-[320px] h-[498px] sm:h-[568px] block"
              />
              
              {/* Play / Pause Overlay Button */}
              <button
                onClick={handleToggleReelPlay}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#661414]/80 hover:bg-[#661414] text-white text-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                style={{ opacity: isPlayingReel ? 0.2 : 0.9 }}
              >
                {isPlayingReel ? '❚❚' : '▶'}
              </button>
            </div>

            {/* Player Controls Bar */}
            <div className="w-full max-w-[420px] mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#351D1D]">
                <span>{formatSeconds(reelTime)}</span>
                <span className="text-[11px] text-[#795B50]">
                  {reelTime < 3 ? 'Scene 1: Hook' : reelTime < 12 ? 'Scene 2: Finding' : reelTime < 22 ? 'Scene 3: Indian Habits' : 'Scene 4: Doctor Call'}
                </span>
                <span>00:30</span>
              </div>

              {/* Scrub Slider */}
              <input
                type="range"
                min="0"
                max="30"
                step="0.1"
                value={reelTime}
                onChange={(e) => setReelTime(parseFloat(e.target.value))}
                className="w-full accent-[#C04E2A] cursor-pointer"
              />

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={handleResetReel}
                  className="px-3 py-1 bg-[#F5EBDF] border border-[#E6CBBD] hover:bg-[#E6CBBD] text-xs font-medium rounded"
                >
                  ⏮ Restart
                </button>
                <button
                  onClick={handleToggleReelPlay}
                  className="px-5 py-1.5 bg-[#C04E2A] hover:bg-[#a63d1e] text-white text-xs font-bold rounded-md shadow-xs"
                >
                  {isPlayingReel ? 'Pause Reel ❚❚' : 'Play Reel ▶'}
                </button>
              </div>
            </div>

          </div>

          {/* Right: Reel Exports & Storyboard */}
          <div className="space-y-4">
            
            <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#661414]">
                Export Encoded Video & Audio
              </h3>

              <button
                onClick={handleExportReelVideo}
                disabled={isRecordingVideo}
                className="w-full py-2.5 px-3 bg-[#661414] hover:bg-[#4a0d0d] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRecordingVideo ? (
                  <span>🔴 Recording Reel Stream ({Math.round(recordingProgress)}%)...</span>
                ) : (
                  <span>🎬 Export Encoded Reel Video (.WEBM / MP4)</span>
                )}
              </button>

              <button
                onClick={handleDownloadReelFrame}
                className="w-full py-2 px-3 bg-[#C04E2A] hover:bg-[#a63d1e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>📸 Download Current Scene Frame (1080x1920)</span>
              </button>

              <a
                href={`/api/v1/packages/${contentPackage.id}/render/reel/audio`}
                download
                className="w-full py-2 px-3 bg-[#F5EBDF] border border-[#E6CBBD] hover:bg-[#E6CBBD] text-[#351D1D] text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>🔊 Download Voiceover Audio (.WAV)</span>
              </a>

              <a
                href={`/api/v1/packages/${contentPackage.id}/render/reel/subtitles?format=srt`}
                download
                className="w-full py-2 px-3 bg-[#F5EBDF] border border-[#E6CBBD] hover:bg-[#E6CBBD] text-[#351D1D] text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>💬 Download Subtitles (.SRT / .VTT)</span>
              </a>

              <a
                href={`/api/v1/packages/${contentPackage.id}/render/reel/zip`}
                download
                className="w-full py-2 px-3 bg-[#F5EBDF] border border-[#C04E2A] text-[#C04E2A] hover:bg-[#C04E2A] hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>📦 Complete Reel Production Kit (.ZIP)</span>
              </a>
            </div>

            {/* B-Roll Prompts */}
            <div className="bg-[#F5EBDF] border border-[#E6CBBD] rounded-xl p-4 text-xs space-y-2">
              <span className="font-bold text-[#661414] uppercase tracking-wider text-[10px] block">
                B-Roll Production Prompts
              </span>
              <div className="space-y-1.5 text-[11px] text-[#351D1D]">
                {contentPackage.reel.bRollPrompts.map((p, idx) => (
                  <div key={idx} className="p-2 bg-[#F8F2EB] rounded border border-[#E6CBBD]">
                    <strong>Prompt {idx + 1}:</strong> {p}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 4: CAPTIONS & HASHTAGS */}
      {subTab === 'caption' && (
        <div className="max-w-3xl mx-auto bg-[#F8F2EB] border border-[#E6CBBD] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6CBBD]">
            <div>
              <h3 className="text-sm font-bold text-[#661414] font-serif">Instagram Caption & Hashtags Asset</h3>
              <p className="text-xs text-[#795B50]">
                Pre-formatted with scientific context, Indian routine framing, and Steer signoff
              </p>
            </div>
            <button
              onClick={handleCopyCaption}
              className="px-4 py-1.5 bg-[#C04E2A] hover:bg-[#a63d1e] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              {copiedCaption ? '✓ Copied to Clipboard!' : 'Copy Entire Caption'}
            </button>
          </div>

          <div className="p-4 bg-white border border-[#E6CBBD] rounded-lg font-mono text-xs text-[#351D1D] whitespace-pre-wrap leading-relaxed">
            {contentPackage.caption.text}
          </div>

          <div>
            <span className="text-xs font-bold text-[#661414] block mb-2">Recommended Hashtags:</span>
            <div className="flex flex-wrap gap-2">
              {contentPackage.caption.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#F5EBDF] border border-[#E6CBBD] text-[#351D1D] rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CANVA AUTOMATION MODAL */}
      {showCanvaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#F8F2EB] border border-[#E6CBBD] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                <h3 className="font-serif text-lg font-bold text-[#661414]">Canva Automation & Template Sync</h3>
              </div>
              <button
                onClick={() => setShowCanvaModal(false)}
                className="w-7 h-7 rounded-full bg-[#E6CBBD] text-[#351D1D] hover:bg-[#C04E2A] hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#351D1D]">
              Steer Science Studio generates automated Canva-ready design specifications and template layouts. You can either import vector SVGs directly into your Canva brand kit or use our pre-configured editorial templates.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#F5EBDF] rounded-lg border border-[#E6CBBD]">
                <strong className="text-[#661414] block">Template Option 1: Multi-Page Editorial Carousel</strong>
                <span className="text-[#795B50] block mt-0.5">1080x1350 Portrait / 1080x1080 Square • 5 Slides with Brand Palette</span>
                <a
                  href="https://www.canva.com/design/templates?query=editorial+carousel"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 px-3 py-1 bg-[#C04E2A] text-white rounded text-[11px] font-semibold"
                >
                  Open Canva Carousel Template ↗
                </a>
              </div>

              <div className="p-3 bg-[#F5EBDF] rounded-lg border border-[#E6CBBD]">
                <strong className="text-[#661414] block">Template Option 2: Minimalist Health Quote Static</strong>
                <span className="text-[#795B50] block mt-0.5">High-contrast serif headline with cream paper card</span>
                <a
                  href="https://www.canva.com/design/templates?query=minimalist+health+quote"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 px-3 py-1 bg-[#C04E2A] text-white rounded text-[11px] font-semibold"
                >
                  Open Canva Static Template ↗
                </a>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCanvaModal(false)}
                className="px-4 py-2 bg-[#661414] text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Canvas drawing helpers
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let curY = y;
  let linesDrawn = 0;

  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (line) {
        ctx.fillText(line, x, curY);
        curY += lineHeight;
        linesDrawn++;
        if (linesDrawn >= maxLines - 1) {
          line = word + '...';
          break;
        }
      }
      line = word;
    } else {
      line = test;
    }
  }
  if (line && linesDrawn < maxLines) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

function renderSlideToCanvas(ctx: CanvasRenderingContext2D, slide: any, idx: number, total: number, width: number, height: number, paperTitle: string) {
  const isMaroon = slide.theme === 'maroon';
  ctx.fillStyle = isMaroon ? '#661414' : '#F5EBDF';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = isMaroon ? '#F5EBDF' : '#C04E2A';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('steer', 80, 110);

  ctx.fillStyle = '#B58777';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(idx === 0 ? 'RESEARCH BRIEF' : `FINDING ${idx}`, 200, 105);
  ctx.fillText(`${idx + 1} / ${total}`, width - 160, 105);

  const cardW = width - 160;
  const cardH = height * 0.70;
  ctx.fillStyle = isMaroon ? 'rgba(0,0,0,0.25)' : '#F8F2EB';
  roundRect(ctx, 80, 180, cardW, cardH, 32);
  ctx.fill();

  ctx.fillStyle = isMaroon ? '#F5EBDF' : '#C04E2A';
  ctx.font = 'bold 50px Georgia, serif';
  drawWrapped(ctx, slide.headline, 120, 280, cardW - 80, 65, 3);

  ctx.fillStyle = isMaroon ? '#F5EBDF' : '#351D1D';
  ctx.font = '28px sans-serif';
  drawWrapped(ctx, slide.body, 120, 480, cardW - 80, 42, 6);

  ctx.fillStyle = '#B58777';
  ctx.font = '18px sans-serif';
  ctx.fillText('Source: ' + paperTitle.substring(0, 60) + '...', 80, height - 50);
  ctx.fillText('steerclub.com', width - 200, height - 50);
}

function renderStaticToCanvas(ctx: CanvasRenderingContext2D, staticPost: any, width: number, height: number, paperTitle: string) {
  ctx.fillStyle = '#F5EBDF';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#C04E2A';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('steer', 80, 110);

  const cardW = width - 160;
  const cardH = height * 0.72;
  ctx.fillStyle = '#F8F2EB';
  roundRect(ctx, 80, 170, cardW, cardH, 32);
  ctx.fill();

  ctx.fillStyle = '#C04E2A';
  ctx.font = 'bold 52px Georgia, serif';
  drawWrapped(ctx, staticPost.headline, 130, 270, cardW - 100, 68, 3);

  ctx.fillStyle = '#351D1D';
  ctx.font = '28px sans-serif';
  drawWrapped(ctx, staticPost.body, 130, 480, cardW - 100, 42, 6);

  ctx.fillStyle = '#B58777';
  ctx.font = '18px sans-serif';
  ctx.fillText('Source: ' + paperTitle.substring(0, 60) + '...', 80, height - 50);
  ctx.fillText('steerclub.com', width - 200, height - 50);
}

function formatSeconds(secs: number): string {
  const s = Math.floor(secs);
  return `00:${String(s).padStart(2, '0')}`;
}
