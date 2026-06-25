import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ShieldCheck, Earth, ChevronDown, Play, Pause, Volume2, VolumeX, RefreshCw, AlertCircle, Maximize2, Search, Heart, Star, Compass, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onStudioClick: () => void;
}

const PREMIUM_VIDEOS = [
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-dark-fluid-metal-animation-loop-41829-large.mp4',
    title: 'Fluid Metallic Session',
    codec: 'MP4 / H.264',
  },
  {
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    title: 'Sleek Marine Energy',
    codec: 'MP4 / AAC',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41852-large.mp4',
    title: 'Neon Spark Refraction',
    codec: 'WebM / AV1',
  }
];

const BANNER_SLIDES = [
  {
    model: 'iPhone 15 Pro Max',
    image: '/products/Gemini_Generated_Image_iy3i6tiy3i6tiy3i.png',
    tag: 'PREMIUM GLACIER',
    description: 'Ultra-clear MagSafe-ready polycarbonate shell with refined titanium edge contours.'
  },
  {
    model: 'Samsung Galaxy S24 Ultra',
    image: '/products/separate_image_2.png',
    tag: 'TITANIUM SHIELD',
    description: 'Perfect alignment with drop-tested corner cushions preserving raw titanium rails.'
  },
  {
    model: 'Google Pixel 8 Pro',
    image: '/products/separate_image_6.png',
    tag: 'VISOR ARMOR',
    description: 'Precision cutouts designed explicitly to guard the signature aluminum camera visor.'
  },
  {
    model: 'Samsung Galaxy S24+',
    image: '/products/case_set2_2.png',
    tag: 'GLACIER SHIELD',
    description: 'A crystal-clear casing showing off the refined contours and aesthetic sienna buttons.'
  },
  {
    model: 'Nothing Phone (2)',
    image: '/products/Gemini_Generated_Image_t6puc4t6puc4t6pu.png',
    tag: 'GLYPH INTEGRATION',
    description: 'Perfect visual clarity highlighting the dynamic LED Glyph interface layout.'
  },
  {
    model: 'OnePlus 12',
    image: '/products/Gemini_Generated_Image_txtit5txtit5txti (1).png',
    tag: 'DISK GUARD',
    description: 'Custom molded wrap protecting the distinct camera disc with absolute precision.'
  },
  {
    model: 'Samsung Galaxy Z Fold 5',
    image: '/products/Gemini_Generated_Image_txtit5txtit5txti.png',
    tag: 'HINGE COMPATIBLE',
    description: 'Sophisticated dual-layered protection crafted for complex fold mechanics.'
  },
  {
    model: 'Motorola Edge',
    image: '/products/case_set2_4.png',
    tag: 'SLIM GLASSMOUR',
    description: 'Impossibly thin shielding protecting the curved screen and distinct camera bumps.'
  },
  {
    model: 'iPhone 15',
    image: '/products/separate_image_4.png',
    tag: 'DAILY DEFENSE',
    description: 'Full impact-absorption in a clear lightweight guard for everyday protection.'
  }
];

export default function HeroSection({ onExploreClick, onStudioClick }: HeroSectionProps) {
  const [videoIndex, setVideoIndex] = useState(0);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCinematic, setIsCinematic] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync state with HTML video player
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Handled browser autoplay blocks gracefully
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, videoIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Track progress timeline
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleLoadStart = () => {
      setHasError(false);
      setIsLoaded(false);
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      setHasError(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoIndex]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const cycleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoIndex((prev) => (prev + 1) % PREMIUM_VIDEOS.length);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    video.currentTime = percentage * video.duration;
  };

  const activeVideo = PREMIUM_VIDEOS[videoIndex];

  return (
    <section className="relative bg-[#0F1012] py-6 sm:py-12 md:py-16 overflow-hidden border-b border-neutral-900 font-sans">
      
      {/* Background ambient light flare */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-[#e9c349]/5 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-[#adc6ff]/5 blur-[110px] pointer-events-none z-0" />

      {/* Cinematic Modal expansion for ultra-wide theater view */}
      {isCinematic && (
        <div 
          className="fixed inset-0 bg-black/98 z-50 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 transition-opacity duration-300"
          id="theaterModal"
        >
          <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest hidden sm:inline">
              PRO CINEMATIC PREVIEW
            </span>
            <button
              onClick={() => setIsCinematic(false)}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-white font-mono text-xs hover:bg-white hover:text-black transition-colors rounded-none"
            >
              ESC THEATER
            </button>
          </div>

          <div className="w-full max-w-5xl aspect-video bg-neutral-950 border border-neutral-850 relative overflow-hidden shadow-2xl flex items-center justify-center">
            {hasError ? (
              <div className="text-center p-8 space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-neutral-500" />
                <p className="font-mono text-xs text-neutral-400">Stream connectivity issues. Click next feed.</p>
                <button
                  onClick={cycleVideo}
                  className="px-4 py-2 bg-white text-black font-mono text-xs"
                >
                  LOAD NEXT FEED
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={activeVideo.url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            {/* Cinematic overlay footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col gap-3">
              <div className="flex justify-between items-center text-white">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400 block">ACTIVE STUDY</span>
                  <h3 className="font-sans font-bold leading-tight uppercase italic">{activeVideo.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={togglePlay} className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850">
                    {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <button onClick={toggleMute} className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <button onClick={cycleVideo} className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

              {/* Progress Bar Timeline */}
              <div 
                className="w-full h-1 bg-neutral-800 cursor-pointer relative"
                onClick={handleProgressBarClick}
              >
                <div 
                  className="h-full bg-white transition-all duration-100" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Luxury Tablet Bezel Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="bg-[#141517] rounded-2xl sm:rounded-3xl border border-neutral-800/80 p-3 sm:p-5 md:p-8 shadow-2xl transition-all">
          
          {/* YOGANTAK Header Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-neutral-800/65 pb-4 sm:pb-6 mb-4 sm:mb-6">
            
            {/* Left Pill badge: NEW */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-neutral-800/40 border border-neutral-700/50 rounded-full text-[10px] font-mono font-medium tracking-widest text-[#DBE9EE] uppercase select-none">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>✦ NEW</span>
            </div>

            {/* Middle Logo: YOGANTAK */}
            <div className="flex items-center gap-2 select-none">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#e9c349] via-[#4b8eff] to-[#adc6ff] flex items-center justify-center shadow-md shadow-[#adc6ff]/20">
                <span className="text-[10px] text-white font-bold">✦</span>
              </div>
              <span className="font-mono text-xs sm:text-sm tracking-[0.18em] sm:tracking-[0.3em] font-bold text-white uppercase pl-0.5">
                YOGANTAK
              </span>
            </div>

            {/* Right Side: Search and Welcome Greeting */}
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Search Pill */}
              <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 bg-neutral-900/60 border border-neutral-800/80 rounded-full text-neutral-400 text-[11px] font-mono w-40 hover:bg-neutral-900 transition-colors cursor-pointer select-none">
                <span>Search</span>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 ml-auto"></span>
                <Search className="w-3 h-3 text-neutral-400" />
              </div>

              {/* Welcome Avatar Greeting */}
              <div className="flex items-center gap-2 select-none">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop" 
                    alt="User" 
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-neutral-700 object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#141517]"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-neutral-500 tracking-wider">Welcome</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bento Grid Layout (Left large showcase column, right stack columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
            {/* LEFT MAIN ADVERTISING BILLBOARD COLUMN (col-span-8) */}
            <div 
              onClick={onExploreClick}
              className="lg:col-span-8 relative w-full aspect-[4/3] sm:aspect-[1024/558] bg-[#0c0c0e] rounded-xl sm:rounded-2xl border border-neutral-800/85 overflow-hidden group cursor-pointer select-none shadow-2xl"
            >
              {/* Slides */}
              {BANNER_SLIDES.map((slide, index) => {
                const isActive = index === activeBannerIndex;
                return (
                  <div
                    key={slide.model}
                    className="absolute inset-0 transition-all duration-1000 ease-in-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'scale(1)' : 'scale(1.025)',
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                  >
                    {/* Background Image */}
                    <img 
                      src={slide.image} 
                      alt={slide.model} 
                      className="w-full h-full object-cover opacity-75 group-hover:scale-[1.015] transition-transform duration-700"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"></div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                      <div className="space-y-1.5 max-w-md">
                        <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.25em] text-[#adc6ff] uppercase font-bold bg-[#adc6ff]/10 border border-[#adc6ff]/20 px-2 py-0.5 rounded">
                          {slide.tag}
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl text-white font-medium leading-tight">
                          Glacier Clear case: {slide.model}
                        </h3>
                        <p className="text-neutral-400 text-xs font-light leading-relaxed tracking-wide hidden sm:block">
                          {slide.description}
                        </p>
                      </div>

                      {/* Glassmorphic Shop Pill */}
                      <span className="shrink-0 text-[10px] font-mono tracking-widest text-[#adc6ff] bg-[#adc6ff]/10 hover:bg-[#adc6ff]/20 border border-[#adc6ff]/35 px-4 py-2 uppercase rounded-full transition-colors w-fit flex items-center gap-1.5">
                        <span>SHOP NOW</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Slide Indicators / Navigation dots */}
              <div className="absolute top-4 right-4 z-20 flex gap-1 bg-black/45 backdrop-blur-md px-2.5 py-1.5 border border-white/5 rounded-full">
                {BANNER_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBannerIndex(index);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === activeBannerIndex 
                        ? 'bg-[#adc6ff] w-4' 
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  ></button>
                ))}
              </div>
            </div>

            {/* RIGHT TWIN STACK BENTO CONTAINER COLUMNS (col-span-4) */}
            <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-3 sm:gap-5">
              
              {/* STACK CARD 1 - Galaxy S24 Ultra TPU Case Display */}
              <div className="relative h-[180px] sm:h-[210px] md:h-[230px] bg-[#111214] rounded-xl sm:rounded-2xl border border-neutral-800/80 overflow-hidden flex flex-col justify-end p-4 md:p-6 group select-none">
                {/* Visual S24 Ultra TPU Case Image */}
                <img 
                  src="/products/separate_image_2.png" 
                  alt="Galaxy S24 Ultra TPU Case" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 z-0"
                  referrerPolicy="no-referrer"
                />
                
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/40 to-transparent z-1" />

                {/* Card Content block */}
                <div className="relative z-10 space-y-1">
                  <span className="text-[8px] font-mono tracking-widest uppercase text-[#DBE9EE]">GLACIER SHIELD</span>
                  <h3 className="font-serif text-lg text-white font-medium leading-tight">
                    Galaxy S24 Ultra
                  </h3>
                  <p className="text-neutral-450 text-[11px] font-light leading-relaxed tracking-wide line-clamp-2 max-w-xs">
                    Impact-absorbing TPU buffer ring preserving the premium titanium contours.
                  </p>
                  
                  <button 
                    onClick={onExploreClick}
                    className="text-[10px] font-mono tracking-widest text-[#DBE9EE] uppercase block pt-2 border-b border-neutral-700 hover:border-[#DBE9EE] w-fit transition-colors pb-0.5 cursor-pointer mt-1"
                  >
                    SHOP GLACIER
                  </button>
                </div>
              </div>

              {/* STACK CARD 2 - Google Pixel 8 Pro TPU Case Display */}
              <div className="relative h-[180px] sm:h-[210px] md:h-[230px] bg-[#111214] rounded-xl sm:rounded-2xl border border-neutral-800/80 overflow-hidden flex flex-col justify-end p-4 md:p-6 group select-none">
                {/* Visual Pixel 8 Pro TPU Case Image */}
                <img 
                  src="/products/separate_image_6.png" 
                  alt="Google Pixel 8 Pro TPU Case" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 z-0"
                  referrerPolicy="no-referrer"
                />
                
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/40 to-transparent z-1" />

                {/* Card Content block */}
                <div className="relative z-10 space-y-1">
                  <span className="text-[8px] font-mono tracking-widest uppercase text-emerald-450">GLACIER SHIELD</span>
                  <h3 className="font-serif text-lg text-white font-medium leading-tight">
                    Google Pixel 8 Pro
                  </h3>
                  <p className="text-neutral-450 text-[11px] font-light leading-relaxed tracking-wide line-clamp-2 max-w-xs">
                    Ultra-thin optical clear shell showing off the signature camera visor.
                  </p>
                  
                  <button 
                    onClick={onExploreClick}
                    className="text-[10px] font-mono tracking-widest text-[#DBE9EE] uppercase block pt-2 border-b border-neutral-700 hover:border-[#DBE9EE] w-fit transition-colors pb-0.5 cursor-pointer mt-1"
                  >
                    SHOP GLACIER
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* LOWER BENTO SUB-FOOTER RECONSTRUCTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-5 mt-3 sm:mt-5">
            
            {/* Lower Col 1: Extra Capsule indicator (col-span-3) */}
            <div className="md:col-span-3 bg-[#111214]/80 border border-neutral-800/80 rounded-xl p-4.5 flex flex-col justify-center select-none">
              <span className="text-[10px] font-mono tracking-[0.2em] text-neutral-500 uppercase block mb-1">DESIGN DIVISION</span>
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-semibold text-white tracking-wide">ELITE PHONE ARMOR</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              </div>
            </div>

            {/* Lower Col 2: Trusted Stats Banner capsule (col-span-4) */}
            <div className="md:col-span-4 bg-[#111214]/80 border border-neutral-800/80 rounded-xl px-5 py-4.5 flex items-center justify-between select-none">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block leading-none">CONSUMER VERIFIED CLIENTS</span>
                <span className="block font-serif text-[11.5px] font-light text-neutral-200 tracking-wider">
                  Trusted by 12,000+ Users Worldwide
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-extrabold text-[#DBE9EE]">
                <span>4.9 / 5</span>
                <Star className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              </div>
            </div>

            {/* Lower Col 3: Handcrafted Slogan card block (col-span-5) */}
            <div className="md:col-span-5 bg-[#111214]/80 border border-neutral-800/80 rounded-xl p-5 select-none space-y-2 flex flex-col justify-center">
              <span className="text-[9px] font-mono tracking-[0.25em] text-neutral-500 uppercase block leading-none">
                HANDCRAFTED WITH LOVE
              </span>
              <p className="text-neutral-400 text-[10.5px] font-light leading-relaxed max-w-md">
                Every product is thoughtfully designed with meticulous attention to detail, using high-quality materials and modern craftsmanship. We focus on creating elegant, durable, and beautifully crafted pieces that bring both functionality and top design.
              </p>
              
              <button 
                onClick={onExploreClick}
                className="text-[9px] font-mono tracking-widest text-[#DBE9EE] uppercase block pt-0.5 border-b border-transparent hover:border-[#DBE9EE] w-fit transition-all pb-0.5 cursor-pointer"
              >
                DISCOVER MORE
              </button>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
