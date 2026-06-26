import React, { useState, useEffect } from 'react';
import { ShoppingBag, BookOpen, Clock, Heart, Sparkles, User } from 'lucide-react';
import { CartItem } from '../types';

interface NavbarProps {
  activeTab: 'catalog' | 'lab' | 'orders' | 'about' | 'contact' | 'privacy' | 'terms' | 'returns';
  setActiveTab: (tab: 'catalog' | 'lab' | 'orders' | 'about' | 'contact' | 'privacy' | 'terms' | 'returns') => void;
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  savedCount: number;
  user: any;
  onAccountClick: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cart,
  setIsCartOpen,
  savedCount,
  user,
  onAccountClick
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
    <>
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
            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 py-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'border-[#adc6ff] text-white'
                  : 'border-transparent text-[#c1c6d7] hover:text-white'
              }`}
            >
              <span>About</span>
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex items-center gap-2 py-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'contact'
                  ? 'border-[#adc6ff] text-white'
                  : 'border-transparent text-[#c1c6d7] hover:text-white'
              }`}
            >
              <span>Contact</span>
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

            {/* User Profile Button */}
            <button
              onClick={onAccountClick}
              className="group relative p-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black transition-all duration-200 focus:outline-none cursor-pointer"
              aria-label={user ? `Account profile for ${user.fullName}` : 'Account access'}
            >
              <User className="w-5 h-5" />
              {user && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#131315]" />
              )}
              {user && (
                <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-[#1a1a1e] border border-neutral-800 text-[#e4e2e4] text-[10px] font-mono tracking-wider py-1.5 px-3 rounded-md shadow-xl pointer-events-none whitespace-nowrap z-[100] uppercase font-bold">
                  Hi, {user.fullName}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Bottom Tab Bar for Mobile Devices */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-black/45 backdrop-blur-[20px] border border-white/10 rounded-full px-5 py-3 shadow-2xl flex items-center justify-around">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'catalog' ? 'text-[#adc6ff] scale-105 font-bold' : 'text-neutral-450 hover:text-white'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span className="text-[8px] uppercase tracking-widest font-semibold font-sans">Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('lab')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'lab' ? 'text-[#adc6ff] scale-105 font-bold' : 'text-neutral-450 hover:text-white'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span className="text-[8px] uppercase tracking-widest font-semibold font-sans">Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'orders' ? 'text-[#adc6ff] scale-105 font-bold' : 'text-neutral-450 hover:text-white'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          <span className="text-[8px] uppercase tracking-widest font-semibold font-sans">Orders</span>
        </button>
      </div>
    </>
  );
}
