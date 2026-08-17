import React, { useState, useEffect } from 'react';
import { ShoppingBag, BookOpen, Clock, Sparkles, User, Search, Shield, Menu, X, ChevronRight, Phone, Info, FileText, RefreshCw, Truck } from 'lucide-react';
import { CartItem } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  savedCount: number;
  user: any;
  onAccountClick: () => void;
  onOpenAdmin?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cart,
  setIsCartOpen,
  savedCount,
  user,
  onAccountClick,
  onOpenAdmin,
  searchQuery = '',
  onSearchChange
}: NavbarProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 1024) {
        setIsMobileSearchOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isCatalog = activeTab === 'catalog';

  // Modern floating pill for catalog, standard sticky for others
  const positionClass = isCatalog ? 'fixed top-0 md:top-4 left-0 md:left-[2.5%] w-full md:w-[95%]' : 'sticky top-0 w-full';
  const roundedClass = isCatalog ? 'md:rounded-full' : '';

  const navLinks = [
    { id: 'catalog', label: 'Catalog' },
    { id: 'orders', label: 'Orders' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
  ];

  const isAdminUser = user?.role === 'admin' || ['sonpureachintya@gmail.com', 'achintyasonpure69@gmail.com', 'archanasonpure1@gmail.com'].includes((user?.email || '').toLowerCase());

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
  };

  return (
    <>
      <header 
        className={`${positionClass} ${roundedClass} z-50 bg-white/75 backdrop-blur-2xl border border-neutral-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-18 flex items-center justify-between">
          
          {/* Left: Brand Logo */}
          <button 
            onClick={() => handleNavClick('catalog')}
            className="flex items-center gap-2 cursor-pointer group focus:outline-none shrink-0"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-black text-white rounded-md flex items-center justify-center font-bold text-xs sm:text-sm italic shadow-sm">Y</div>
            <span className="font-sans text-lg sm:text-xl font-bold tracking-tight text-neutral-900 group-hover:opacity-75 transition-opacity">
              yogantak.
            </span>
          </button>

          {/* Center: Desktop / Tablet Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 px-3 py-1.5 rounded-full bg-neutral-100/60 border border-neutral-200/50">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 lg:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Center-Right: Search Bar (Desktop / Large screen) */}
          <div className="hidden lg:flex items-center bg-white/70 backdrop-blur-md rounded-full px-4 py-1.5 flex-grow max-w-xs mx-4 border border-neutral-200/70 shadow-sm focus-within:border-neutral-400 transition-colors">
            <input 
              type="text" 
              placeholder="Search cases..." 
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-neutral-800 w-full placeholder:text-neutral-400 font-medium"
            />
            <button 
              onClick={() => handleNavClick('catalog')}
              className="text-neutral-500 hover:text-black p-1 rounded-full transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Cart & Utility Panel */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Mobile / Tablet Search Toggle */}
            <button 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="lg:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100/80 backdrop-blur-sm text-neutral-700 hover:bg-neutral-200 transition-all cursor-pointer"
              aria-label="Toggle search bar"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100/80 backdrop-blur-sm text-neutral-700 hover:bg-neutral-200 transition-all cursor-pointer relative"
              aria-label="Open shopping bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Profile */}
            <button
              onClick={onAccountClick}
              className="flex items-center gap-1.5 pl-1.5 pr-3 sm:pr-3.5 py-1.5 rounded-full bg-neutral-100/80 backdrop-blur-sm border border-neutral-200/60 hover:bg-neutral-200 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-neutral-300 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-neutral-700" />
              </div>
              <span className="text-xs font-bold text-neutral-700 hidden sm:block">
                {user ? user.fullName.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Admin Dashboard Shortcut */}
            {isAdminUser && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
                title="Open Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Slide-down Mobile / Tablet Search Input */}
        {isMobileSearchOpen && (
          <div className="lg:hidden px-4 pb-3 pt-1 border-t border-neutral-200/60 bg-white/95 backdrop-blur-xl transition-all animate-fade-in">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-full px-4 py-2 border border-neutral-200">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search phone cases by name, material, or style..."
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-neutral-800 w-full placeholder:text-neutral-400 font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange && onSearchChange('')}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Floating Bottom Tab Bar for Mobile Devices (< 768px) */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-sm bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2.5 shadow-[0_12px_40px_rgb(0,0,0,0.25)] flex items-center justify-around">
        <button
          onClick={() => handleNavClick('catalog')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition-all ${
            activeTab === 'catalog' ? 'text-white scale-105 font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold font-sans">Catalog</span>
        </button>


        <button
          onClick={() => handleNavClick('orders')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition-all relative ${
            activeTab === 'orders' ? 'text-white scale-105 font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold font-sans">Orders</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition-all ${
            isMobileMenuOpen || ['about', 'contact', 'privacy', 'terms', 'returns', 'cancellation', 'shipping'].includes(activeTab)
              ? 'text-white scale-105 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Menu className="w-4.5 h-4.5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold font-sans">More</span>
        </button>
      </div>

      {/* Slide-Up Mobile Navigation Menu Modal */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-[2.5rem] p-6 shadow-2xl overflow-y-auto z-50 flex flex-col gap-6 border-t border-neutral-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black text-white rounded-md flex items-center justify-center font-bold text-sm italic">Y</div>
                <span className="font-sans text-xl font-bold tracking-tight text-neutral-900">
                  YOGANTAK
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onAccountClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3.5 bg-neutral-100 rounded-2xl text-left active:scale-98 transition-transform"
              >
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900">Account</div>
                  <div className="text-[10px] text-neutral-500 line-clamp-1">{user ? user.fullName : 'Sign In'}</div>
                </div>
              </button>

              {isAdminUser && onOpenAdmin && (
                <button
                  onClick={() => {
                    onOpenAdmin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 p-3.5 bg-violet-100 text-violet-900 rounded-2xl text-left active:scale-98 transition-transform"
                >
                  <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Admin Panel</div>
                    <div className="text-[10px] text-violet-600">Manage store</div>
                  </div>
                </button>
              )}
            </div>

            {/* Navigation Pages */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 pb-1">
                Explore & Policies
              </div>
              
              {[
                { id: 'about', label: 'About Us', icon: Info, desc: 'Our mission and craftsmanship' },
                { id: 'contact', label: 'Contact Support', icon: Phone, desc: '24/7 concierge assistance' },
                { id: 'returns', label: 'Returns Policy', icon: RefreshCw, desc: '7-day hassle-free return' },
                { id: 'shipping', label: 'Shipping & Exchange', icon: Truck, desc: 'Delivery terms and times' },
                { id: 'privacy', label: 'Privacy Policy', icon: Shield, desc: 'Data security compliance' },
                { id: 'terms', label: 'Terms & Conditions', icon: FileText, desc: 'Store usage rules' }
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-neutral-900">{item.label}</div>
                        <div className="text-xs text-neutral-400">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                );
              })}
            </div>

            {/* Footer note inside mobile menu */}
            <div className="text-center pt-2 pb-4 text-xs text-neutral-400 font-medium">
              Yogantak • Designed for iPhone & Android
            </div>

          </div>
        </div>
      )}
    </>
  );
}

