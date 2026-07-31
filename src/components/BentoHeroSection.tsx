import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Star, Heart, Sparkles } from 'lucide-react';

interface BentoHeroProps {
  onExploreClick: () => void;
  onStudioClick: () => void;
}

export default function BentoHeroSection({ onExploreClick, onStudioClick }: BentoHeroProps) {
  return (
    <div className="w-full bg-[#f4f5f1] min-h-screen pt-20 sm:pt-28 pb-8 sm:pb-12 px-3 sm:px-6 lg:px-8 text-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-6">
        
        {/* BIG HERO TOP BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="col-span-2 md:col-span-12 bg-[#fdfdfd] rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 lg:p-12 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[260px] sm:min-h-[450px]"
        >
          <div className="z-10 w-[60%] sm:w-full max-w-lg">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-neutral-100 rounded-full text-[10px] sm:text-xs font-semibold text-neutral-500 mb-3 sm:mb-6 border border-neutral-200">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-400"></span> Design is Classic
            </div>
            <h1 className="text-xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-2 sm:mb-4 text-neutral-900 leading-[1.1]">
              Yogantak Inspiring<br />Protection.
            </h1>
            
            <div className="flex items-center gap-2.5 sm:gap-4 mb-5 sm:mb-10 mt-3 sm:mt-6">
              <span className="text-xl sm:text-4xl font-light text-neutral-300">01</span>
              <div className="w-6 sm:w-12 h-[1px] bg-neutral-300"></div>
              <div>
                <p className="font-semibold text-neutral-900 text-xs sm:text-sm">Clear Aesthetics</p>
                <p className="text-[10px] sm:text-xs text-neutral-500 max-w-[200px] line-clamp-2">Making your dream style come true stay with Yogantak Cases!</p>
              </div>
            </div>

            <button 
              onClick={onExploreClick}
              className="group flex items-center justify-between gap-3 bg-[#cfff71]/80 backdrop-blur-sm text-neutral-900 font-bold px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full hover:bg-[#cfff71] transition-all cursor-pointer active:scale-95 shadow-sm text-xs sm:text-sm w-full sm:w-auto"
            >
              <span>View All Products</span>
              <span className="bg-black text-white p-1 sm:p-2 rounded-full group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </button>
          </div>

          {/* Floating Phone Case Hero Image - Visible on all screen sizes */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2/5 sm:w-1/2 h-full opacity-90 block pointer-events-none">
            <img 
              src="/products/Gemini_Generated_Image_t6puc4t6puc4t6pu.png" 
              alt="Premium Phone Case" 
              className="object-cover w-full h-full object-center rounded-l-3xl"
              style={{ maskImage: 'linear-gradient(to right, transparent, black 35%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%)' }}
            />
          </div>
        </motion.div>

        {/* BOTTOM ROW BENTO BOXES (Small square cards side-by-side on mobile grid-cols-2) */}
        
        {/* Studio Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onClick={onStudioClick}
          className="col-span-1 md:col-span-6 lg:col-span-3 bg-[#fdfdfd] rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6 shadow-sm flex flex-col justify-between group cursor-pointer border border-neutral-100 hover:border-neutral-300 transition-all aspect-square sm:aspect-auto min-h-[160px] sm:min-h-[220px]"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-neutral-100 text-neutral-700 text-[10px] sm:text-xs font-semibold">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Studio
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-auto">
            <h3 className="text-xs sm:text-lg font-bold text-neutral-900 leading-snug line-clamp-2">
              Monogram Studio
            </h3>
            <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 hidden sm:block">Add custom gold foil letters</p>
          </div>
          <div className="flex gap-1.5 mt-auto pt-1">
            <div className="w-8 h-8 sm:w-14 sm:h-14 bg-neutral-100 rounded-lg sm:rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/products/Gemini_Generated_Image_t6puc4t6puc4t6pu.png" className="w-full h-full object-cover" alt="item" />
            </div>
            <div className="w-8 h-8 sm:w-14 sm:h-14 bg-neutral-100 rounded-lg sm:rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/products/separate_image_2.png" className="w-full h-full object-cover" alt="item" />
            </div>
            <div className="w-8 h-8 sm:w-14 sm:h-14 bg-neutral-100 rounded-lg sm:rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/products/case_set2_2.png" className="w-full h-full object-cover" alt="item" />
            </div>
          </div>
        </motion.div>

        {/* Downloads / Reviews */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-1 md:col-span-6 lg:col-span-2 bg-[#fdfdfd] rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6 shadow-sm flex flex-col items-center justify-center text-center gap-2 aspect-square sm:aspect-auto min-h-[160px] sm:min-h-[220px]"
        >
          <div className="w-14 h-14 sm:w-24 sm:h-24 bg-[#3d70f5] rounded-full flex flex-col items-center justify-center text-white shadow-md shadow-[#3d70f5]/30 cursor-pointer hover:scale-105 transition-transform shrink-0">
            <span className="text-xs sm:text-xl font-bold">5m+</span>
            <span className="text-[7px] sm:text-[9px] uppercase tracking-wider opacity-90">Orders</span>
          </div>
          <div className="flex items-center gap-1 bg-[#cfff71]/20 text-[#719814] px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold">
            <Star className="w-3 h-3 fill-current" /> 4.6 reviews
          </div>
        </motion.div>

        {/* Collection Released */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="col-span-1 md:col-span-6 lg:col-span-4 bg-[#fdfdfd] rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6 shadow-sm relative overflow-hidden group cursor-pointer flex flex-col justify-between aspect-square sm:aspect-auto min-h-[160px] sm:min-h-[220px]"
          onClick={onExploreClick}
        >
          <div className="flex items-center justify-between z-10 relative">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[9px] sm:text-[10px] font-bold border border-red-100">
              <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" /> Popular
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-800" />
            </div>
          </div>
          <h3 className="text-xs sm:text-lg font-bold text-neutral-800 relative z-10 leading-tight max-w-[110px] sm:max-w-[170px] mt-auto">
            MagSafe Released
          </h3>
          <div className="absolute right-0 bottom-0 w-28 sm:w-48 h-full pointer-events-none">
            <img 
              src="/products/case_set2_2.png" 
              alt="MagSafe Case" 
              className="w-full h-full object-cover object-left opacity-90 group-hover:scale-105 transition-transform duration-500"
              style={{ maskImage: 'linear-gradient(to right, transparent, black 25%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 25%)' }}
            />
          </div>
        </motion.div>

        {/* Right Feature Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="col-span-1 md:col-span-6 lg:col-span-3 bg-[#e8eaec] rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6 shadow-sm relative overflow-hidden aspect-square sm:aspect-auto min-h-[160px] sm:min-h-[220px] flex flex-col justify-between"
        >
          <div className="flex justify-end z-10 relative">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-800" />
            </div>
          </div>
          <div className="absolute inset-0 z-0 opacity-80">
             <img 
              src="/products/separate_image_6.png" 
              alt="Model with case" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 mt-auto flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2 -mx-3.5 -mb-3.5 rounded-b-2xl sm:rounded-b-[2rem] text-white">
            <h3 className="text-xs sm:text-lg font-bold leading-tight mb-0.5">Armor Case</h3>
            <p className="text-[10px] sm:text-xs text-neutral-200 font-medium line-clamp-1">Max protection</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
