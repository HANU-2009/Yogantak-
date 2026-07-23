import React, { useState, useEffect } from 'react';
import { ShoppingBag, BookOpen, Clock, Heart, Sparkles, User, Search, Shield } from 'lucide-react';
import { CartItem } from '../types';

interface NavbarProps {
  activeTab: 'catalog' | 'lab' | 'orders' | 'about' | 'contact' | 'privacy' | 'terms' | 'returns';
  setActiveTab: (tab: 'catalog' | 'lab' | 'orders' | 'about' | 'contact' | 'privacy' | 'terms' | 'returns') => void;
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  savedCount: number;
  user: any;
  onAccountClick: () => void;
  onOpenAdmin?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cart,
  setIsCartOpen,
  savedCount,
  user,
  onAccountClick,
  onOpenAdmin
}: NavbarProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

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
  const shouldHide = !isMobile && isCatalog && scrollY < 100;

  // Modern floating pill for catalog, standard sticky for others
  const positionClass = isCatalog ? 'fixed top-0 md:top-6 left-0 md:left-[2.5%] md:w-[95%]' : 'sticky top-0 w-full';
  const roundedClass = isCatalog ? 'md:rounded-full' : '';

  return (
    <>
      <header 
        className={`${positionClass} ${roundedClass} z-50 bg-white/50 backdrop-blur-2xl border border-neutral-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Left: Brand Logo */}
          <button 
            onClick={() => setActiveTab('catalog')}
            className="flex items-center gap-2 cursor-pointer group focus:outline-none"
          >
            <div className="w-6 h-6 bg-black text-white rounded-md flex items-center justify-center font-bold text-xs italic">Y</div>
            <span className="font-sans text-xl font-bold tracking-tight text-neutral-900 group-hover:opacity-75 transition-opacity">
              yogantak.
            </span>
          </button>

          {/* Center: Search Bar (Dribbble Reference) */}
          <div className="hidden lg:flex items-center bg-white/50 backdrop-blur-md rounded-full px-4 py-2 flex-grow max-w-md mx-8 border border-neutral-200/60 shadow-sm">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="bg-transparent border-none outline-none text-sm text-neutral-700 w-full placeholder:text-neutral-400"
            />
            <button className="bg-black/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black hover:scale-105 transition-all cursor-pointer">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Cart & Utility Panel */}
          <div className="flex items-center gap-3">
            
            {/* Wishlist */}
            <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100/70 backdrop-blur-sm text-neutral-600 hover:bg-neutral-200 transition-all cursor-pointer relative">
              <Heart className="w-4.5 h-4.5" />
              {savedCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100/70 backdrop-blur-sm text-neutral-600 hover:bg-neutral-200 transition-all cursor-pointer relative"
              aria-label="Open shopping bag"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Profile */}
            <button
              onClick={onAccountClick}
              className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-neutral-100/70 backdrop-blur-sm border border-neutral-200/50 hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 bg-neutral-300 rounded-full overflow-hidden flex items-center justify-center">
                <User className="w-4 h-4 text-neutral-600" />
              </div>
              <span className="text-sm font-semibold text-neutral-700 hidden sm:block">
                {user ? user.fullName.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Admin Dashboard Shortcut */}
            {(user?.role === 'admin' || ['sonpureachintya@gmail.com', 'achintyasonpure69@gmail.com', 'archanasonpure1@gmail.com'].includes((user?.email || '').toLowerCase())) && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-violet-600/20 cursor-pointer active:scale-95"
                title="Open Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Bottom Tab Bar for Mobile Devices */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm bg-white/90 backdrop-blur-[20px] border border-neutral-200 rounded-full px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-around">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'catalog' ? 'text-black scale-105 font-bold' : 'text-neutral-400 hover:text-black'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span className="text-[8px] uppercase tracking-widest font-semibold font-sans">Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('lab')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'lab' ? 'text-black scale-105 font-bold' : 'text-neutral-400 hover:text-black'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span className="text-[8px] uppercase tracking-widest font-semibold font-sans">Studio</span>
        </button>

      </div>
    </>
  );
}
