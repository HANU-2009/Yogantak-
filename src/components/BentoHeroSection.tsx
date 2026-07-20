import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Star, Heart } from 'lucide-react';

interface BentoHeroProps {
  onExploreClick: () => void;
  onStudioClick: () => void;
}

export default function BentoHeroSection({ onExploreClick, onStudioClick }: BentoHeroProps) {
  return (
    <div className="w-full bg-[#f4f5f1] min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 text-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 auto-rows-auto">
        
        {/* BIG HERO LEFT (col-span-8) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-8 bg-[#fdfdfd] rounded-[2rem] p-8 lg:p-12 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[450px]"
        >
          <div className="z-10 w-full max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-500 mb-6 border border-neutral-200">
              <span className="w-2 h-2 rounded-full bg-neutral-400"></span> Design is Classic
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-neutral-900 leading-[1.1]">
              Yogantak Inspiring<br />Protection.
            </h1>
            
            <div className="flex items-center gap-4 mb-10 mt-6">
              <span className="text-4xl font-light text-neutral-300">01</span>
              <div className="w-12 h-[1px] bg-neutral-300"></div>
              <div>
                <p className="font-semibold text-neutral-900 text-sm">Clear Aesthetics</p>
                <p className="text-xs text-neutral-500 max-w-[200px]">Making your dream style come true stay with Yogantak Cases!</p>
              </div>
            </div>

            <button 
              onClick={onExploreClick}
              className="group flex items-center gap-4 bg-[#cfff71]/80 backdrop-blur-sm text-neutral-900 font-bold px-6 py-3 rounded-full hover:bg-[#cfff71] transition-all cursor-pointer"
            >
              View All Products
              <span className="bg-black text-white p-2 rounded-full group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </button>
          </div>

          {/* Floating Phone Case Hero Image Placeholder */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full opacity-90 hidden sm:block">
            <img 
              src="/products/Gemini_Generated_Image_t6puc4t6puc4t6pu.png" 
              alt="Premium Phone Case" 
              className="object-cover w-full h-full object-center rounded-l-3xl"
              style={{ maskImage: 'linear-gradient(to right, transparent, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}
            />
          </div>
        </motion.div>

        {/* TOP RIGHT COLUMN (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6">
          
          {/* Popular Colors Box */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#fdfdfd] rounded-[2rem] p-6 shadow-sm"
          >
            <h3 className="text-sm font-semibold mb-4 text-neutral-800">Popular Colors</h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#486bd9] ring-4 ring-[#486bd9]/20 cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-[#f97316] cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-[#22c55e] cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-[#ef4444] cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-[#06b6d4] cursor-pointer"></div>
            </div>
          </motion.div>

          {/* New Gen Box */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#fdfdfd] rounded-[2rem] p-6 shadow-sm relative overflow-hidden flex-grow cursor-pointer group min-h-[200px]"
            onClick={onStudioClick}
          >
            <div className="absolute top-6 right-6 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4 text-neutral-800" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-neutral-800 relative z-10">New Gen<br />Carbon</h3>
            <div className="absolute -right-4 -bottom-4 w-44 h-44">
              <img 
                src="/products/separate_image_2.png" 
                alt="Carbon Case" 
                className="w-full h-full object-cover rounded-tl-3xl opacity-90 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>

        </div>

        {/* BOTTOM ROW (4 sections spanning the 12 cols) */}

        {/* More Products (col-span-3) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-3 bg-[#fdfdfd] rounded-[2rem] p-6 shadow-sm relative"
        >
          <div className="absolute top-6 right-6 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <h3 className="text-md font-bold text-neutral-800">More Products</h3>
          <p className="text-xs text-neutral-500 mb-4">460 plus items.</p>
          <div className="flex gap-2">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/products/Gemini_Generated_Image_t6puc4t6puc4t6pu.png" className="w-full h-full object-cover" alt="item" />
            </div>
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/products/separate_image_2.png" className="w-full h-full object-cover" alt="item" />
            </div>
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/products/case_set2_2.png" className="w-full h-full object-cover" alt="item" />
            </div>
          </div>
        </motion.div>

        {/* Downloads / Reviews (col-span-2) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-[#fdfdfd] rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-center"
        >
          <div className="w-24 h-24 bg-[#3d70f5] rounded-full flex flex-col items-center justify-center text-white shadow-lg shadow-[#3d70f5]/30 mb-4 cursor-pointer hover:scale-105 transition-transform">
            <span className="text-xl font-bold">5m+</span>
            <span className="text-[9px] uppercase tracking-wider opacity-90">Orders</span>
          </div>
          <div className="flex items-center gap-1 bg-[#cfff71]/20 text-[#719814] px-3 py-1 rounded-full text-xs font-semibold">
            <Star className="w-3 h-3 fill-current" /> 4.6 reviews
          </div>
        </motion.div>

        {/* Collection Released (col-span-4) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-4 bg-[#fdfdfd] rounded-[2rem] p-6 shadow-sm relative overflow-hidden group cursor-pointer"
          onClick={onExploreClick}
        >
          <div className="absolute top-6 right-6 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-4 h-4 text-neutral-800" />
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-bold mb-3 relative z-10 border border-red-100">
            <Heart className="w-3 h-3 fill-current" /> Popular
          </div>
          <h3 className="text-lg font-bold text-neutral-800 relative z-10 max-w-[150px] leading-tight">
            MagSafe Case Has Been Released
          </h3>
          <div className="absolute right-0 bottom-0 w-48 h-full">
            <img 
              src="/products/case_set2_2.png" 
              alt="Hands holding case" 
              className="w-full h-full object-cover object-left opacity-90 group-hover:scale-105 transition-transform duration-500"
              style={{ maskImage: 'linear-gradient(to right, transparent, black 30%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)' }}
            />
          </div>
        </motion.div>

        {/* Right Tall Feature Card (col-span-3) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-3 bg-[#e8eaec] rounded-[2rem] p-6 shadow-sm relative overflow-hidden min-h-[220px]"
        >
          <div className="absolute top-6 right-6 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
            <ArrowUpRight className="w-4 h-4 text-neutral-800" />
          </div>
          <div className="absolute inset-0 z-0 mix-blend-multiply opacity-50">
             <img 
              src="/products/separate_image_6.png" 
              alt="Model with case" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 mt-auto flex flex-col justify-end h-full">
            <h3 className="text-lg font-bold text-neutral-900 leading-tight mb-1">Light Grey Surface<br />Armor Case</h3>
            <p className="text-xs text-neutral-600 font-medium">Boosted with protection</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
