import React, { useState, useEffect } from 'react';
import { ShoppingBag, BookOpen, Clock, Heart, Sparkles } from 'lucide-react';
import { CartItem } from '../types';

interface NavbarProps {
  activeTab: 'catalog' | 'lab' | 'orders';
  setActiveTab: (tab: 'catalog' | 'lab' | 'orders') => void;
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  savedCount: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cart,
  setIsCartOpen,
  savedCount
}: NavbarProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Track window scroll for fade-in animations on catalog tab
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isCatalog = activeTab === 'catalog';
  const shouldHide = !isMobile && isCatalog && scrollY < 300;

  // Use fixed positioning on catalog tab to float over video/content without layout shifting;
  // Use sticky on other tabs to behave like a standard page header.
  const positionClass = isCatalog ? 'fixed top-0 left-0' : 'sticky top-0';

  const headerStyle: React.CSSProperties = {
    opacity: shouldHide ? 0 : 1,
    transform: shouldHide ? 'translateY(-100%)' : 'translateY(0)',
    pointerEvents: shouldHide ? 'none' : 'auto',
    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <header 
      className={`${positionClass} z-50 w-full bg-[#131315]/95 backdrop-blur-md border-b border-neutral-800/80`}
      style={headerStyle}
    >
      {/* Top Banner Alert */}
      <div className="w-full bg-[#0e0e10] text-[#e4e2e4] text-[9px] sm:text-[10px] font-mono tracking-[0.12em] sm:tracking-[0.18em] text-center py-2 px-3 sm:px-4 uppercase font-medium border-b border-neutral-900/60 leading-snug">
        FREE EXPEDITED SHIPPING OVER $50 <span className="hidden sm:inline">- 100-DAY RISK-FREE EXPERIENCES</span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo - Minimalist, sans-italic, modern luxury spacing */}
        <button 
          onClick={() => setActiveTab('catalog')}
          className="flex flex-col items-start cursor-pointer group focus:outline-none"
        >
          <span className="font-sans text-lg sm:text-xl font-extrabold tracking-tighter text-white italic group-hover:opacity-85 transition-opacity select-none">
            YOGANTAK.
          </span>
          <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.18em] sm:tracking-[0.25em] text-[#c1c6d7] uppercase pl-0.5">
            Minimalist Studio
          </span>
        </button>

        {/* Brand Menu - Compact Minimal Anchors */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-[#adc6ff] text-white'
                : 'border-transparent text-[#c1c6d7] hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 opacity-75" />
            <span>Curated Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#adc6ff] text-white'
                : 'border-transparent text-[#c1c6d7] hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 opacity-75" />
            <span>Order History</span>
          </button>
        </nav>

        {/* Cart & Utility Panel */}
        <div className="flex items-center gap-4">
          {/* Saved count (aesthetic badge) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-[#c1c6d7]">
            <Heart className="w-4.5 h-4.5 text-white fill-white/10" />
            <span>({savedCount})</span>
          </div>

          {/* Cart Bag Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black transition-all duration-200 focus:outline-none cursor-pointer"
            aria-label="Open shopping bag"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#adc6ff] text-[#002e69] rounded-full flex items-center justify-center text-[10px] font-mono font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation rail representation */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800/80 bg-[#131315] text-[10px] uppercase tracking-wider font-semibold py-3">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'catalog' ? 'text-white' : 'text-neutral-500'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('lab')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'lab' ? 'text-white' : 'text-neutral-500'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'orders' ? 'text-white' : 'text-neutral-500'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span>Orders</span>
        </button>
      </div>
    </header>
  );
}
