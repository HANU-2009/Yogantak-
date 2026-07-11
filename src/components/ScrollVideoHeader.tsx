import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Volume2, VolumeX } from 'lucide-react';

interface ScrollVideoHeaderProps {
  onSkip: () => void;
}

export default function ScrollVideoHeader({ onSkip }: ScrollVideoHeaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [activePhase, setActivePhase] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Cycle through brand message phases every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Explicitly trigger play on mount to satisfy strict browser autoplay policies
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log('Autoplay was prevented by browser policy, will play on user interaction:', err);
      });
    }
  }, []);

  // Track window scroll for subtle parallax/fade out effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      
      // Explicitly trigger play to handle potential browser auto-pause policies
      videoRef.current.play().catch((err) => {
        console.warn('Playback failed or was prevented:', err);
      });
    }
  };

  // Calculate opacity/translation based on active phase
  const getPhaseStyles = (index: number) => {
    const isActive = activePhase === index;
    return {
      opacity: isActive ? 1 : 0,
      transform: isActive ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: isActive ? 'auto' : 'none' as const,
    };
  };

  // Fade out elements as user scrolls down
  const headerOpacity = Math.max(1 - scrollY / (window.innerHeight * 0.8), 0);

  return (
    <div className="relative w-full h-[82svh] sm:h-screen bg-[#0F1012] select-none z-30 overflow-hidden">
      {/* Background Video element */}
      <video
        ref={videoRef}
        src="/showcase.mp4"
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        style={{ 
          transform: `translate3d(0, ${scrollY * 0.3}px, 0)`,
          willChange: 'transform',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)'
        }} // Hardware accelerated parallax and transparent bottom gradient mask
      />

      {/* Premium Dark Vignette Overlays fading to the next section's background color (#0F1012) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1012] via-transparent to-black/50 pointer-events-none" />
      
      {/* Aesthetic scanlines / grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-20 pointer-events-none" />

      {/* Floating Top Header (Brand logo) */}
      <div 
        className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none transition-all duration-300"
        style={{ opacity: headerOpacity }}
      >
        <span className="font-mono text-[9px] tracking-[0.4em] text-neutral-400 uppercase mb-1">
          CINEMATIC PROLOGUE
        </span>
        <span className="font-sans text-2xl font-black tracking-[-0.05em] text-white italic">
          YOGANTAK.
        </span>
      </div>

      {/* Dynamic Center Text Overlays */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
        style={{ opacity: headerOpacity }}
      >
        
        {/* Phase 1 Text */}
        <div 
          style={getPhaseStyles(0)} 
          className="absolute flex flex-col items-center max-w-2xl space-y-4"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#DBE9EE] uppercase font-bold">
            01 // CONCEPT
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-extralight tracking-tight leading-tight uppercase">
            METICULOUS <br />
            <span className="font-normal italic">ENGINEERING</span>
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm tracking-widest uppercase font-mono max-w-md">
            Forged to protect. Designed to inspire.
          </p>
        </div>

        {/* Phase 2 Text */}
        <div 
          style={getPhaseStyles(1)} 
          className="absolute flex flex-col items-center max-w-2xl space-y-4"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#DBE9EE] uppercase font-bold">
            02 // MATERIAL
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-extralight tracking-tight leading-tight uppercase">
            ARTISANAL <br />
            <span className="font-normal italic">CRAFTSMANSHIP</span>
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm tracking-widest uppercase font-mono max-w-md">
            Premium pebble leather meets aerospace aluminum.
          </p>
        </div>

        {/* Phase 3 Text */}
        <div 
          style={getPhaseStyles(2)} 
          className="absolute flex flex-col items-center max-w-2xl space-y-4"
        >
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#DBE9EE] uppercase font-bold">
            03 // EXPERIENCE
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-extralight tracking-tight leading-tight uppercase">
            UNCOMPROMISING <br />
            <span className="font-normal italic">SHIELDING</span>
          </h2>
          <p className="text-neutral-450 text-xs sm:text-sm tracking-widest uppercase font-mono max-w-md">
            Enter the YOGANTAK laboratory.
          </p>
        </div>

      </div>

      {/* Bottom Bar Controls */}
      <div 
        className="absolute bottom-6 sm:bottom-10 inset-x-4 sm:inset-x-8 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 text-white font-mono text-[10px] tracking-wider transition-all duration-300"
        style={{ opacity: headerOpacity }}
      >
        
        {/* Scroll Down Indicator */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={onSkip}
        >
          <ChevronDown className="w-4 h-4 animate-bounce" />
          <span className="uppercase tracking-[0.2em] text-neutral-400 font-bold">
            SCROLL TO DISCOVER
          </span>
        </div>

        {/* Audio & Skip controls */}
        <div className="flex items-center gap-4">
          {/* Audio Toggle */}
          <button 
            onClick={toggleMute}
            className="px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 uppercase select-none rounded-none cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? "UNMUTE" : "MUTED"}</span>
          </button>

          {/* Skip Intro */}
          <button 
            onClick={onSkip}
            className="px-3 py-1.5 bg-white text-black hover:bg-neutral-250 transition-colors uppercase font-bold select-none rounded-none cursor-pointer"
          >
            SKIP INTRO
          </button>
        </div>

      </div>

    </div>
  );
}
