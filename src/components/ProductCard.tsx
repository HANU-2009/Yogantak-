import React, { useState } from 'react';
import { Product, PhoneModel, CaseMaterial, CaseColor } from '../types';
import PhoneCaseRenderer from './PhoneCaseRenderer';
import { Star, Sparkles, ShoppingBag, Heart } from 'lucide-react';

interface ProductCardProps {
  key?: any;
  product: Product;
  isSaved?: boolean;
  onToggleSaved?: (productId: string) => void;
  onOpenDetails: (product: Product, chosenModel: PhoneModel, chosenColor: CaseColor, chosenMaterial: CaseMaterial) => void;
  onCustomizeClick: (product: Product, chosenModel: PhoneModel, chosenColor: CaseColor, chosenMaterial: CaseMaterial) => void;
  onQuickAdd: (product: Product, model: PhoneModel, color: CaseColor, material: CaseMaterial) => void;
  layout?: 'grid' | 'list';
}

export default function ProductCard({
  product,
  isSaved = false,
  onToggleSaved,
  onOpenDetails,
  onCustomizeClick,
  onQuickAdd,
  layout = 'grid'
}: ProductCardProps) {
  // Local state for active selections
  const [activeModel, setActiveModel] = useState<PhoneModel>(product.models[0]);
  const [activeColor, setActiveColor] = useState<CaseColor>(product.colors[0]);
  const [activeMaterial, setActiveMaterial] = useState<CaseMaterial>(product.materials[0]);
  const [isHovered, setIsHovered] = useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSaved) {
      onToggleSaved(product.id);
    }
  };

  // Get dynamic badges to match the mockup screenshot
  const getBadge = () => {
    if (product.id === 'sienna-leather') {
      return { text: '-20%', type: 'discount' };
    }
    if (product.id === 'liquid-silicone') {
      return { text: '-15%', type: 'discount' };
    }
    if (product.id === 'crystal-poly') {
      return { text: 'New', type: 'new' };
    }
    if (product.id === 'bio-wheat') {
      return { text: 'New', type: 'new' };
    }
    if (product.id === 'stealth-aramid') {
      return { text: 'Bestseller', type: 'bestseller' };
    }
    if (product.bestseller) {
      return { text: 'Bestseller', type: 'bestseller' };
    }
    return null;
  };

  // Get dynamic price styling (retail & discounted) to match mockup pricing
  const getPrices = () => {
    if (product.id === 'sienna-leather') {
      return { current: 2999, retail: 3999 };
    }
    if (product.id === 'liquid-silicone') {
      return { current: 1999, retail: 2399 };
    }
    if (product.id === 'crystal-poly') {
      return { current: 2599, retail: 3199 };
    }
    if (product.id === 'stealth-aramid') {
      return { current: 3999, retail: 4999 };
    }
    return { current: product.basePrice, retail: null };
  };

  const badge = getBadge();
  const prices = getPrices();

  if (layout === 'list') {
    return (
      <div 
        onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
        className="group bg-[#18181b]/60 border border-neutral-800/60 rounded-3xl p-4 flex gap-6 hover:shadow-lg hover:border-neutral-700/80 transition-all duration-300 text-white cursor-pointer backdrop-blur-sm"
      >
        {/* Left: Phone Image Area */}
        <div className="w-40 bg-[#202024]/40 rounded-2xl flex items-center justify-center p-3 relative overflow-hidden shrink-0 aspect-[4/5]">
          <div className="transform scale-[0.65] transition-transform duration-500 group-hover:scale-[0.68]">
            <PhoneCaseRenderer
              model={activeModel}
              material={activeMaterial}
              color={activeColor}
              size="md"
              magsafe={product.magsafe}
            />
          </div>
        </div>

        {/* Right: Info Area */}
        <div className="flex-grow flex flex-col justify-between py-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-white leading-tight group-hover:text-[#adc6ff] transition-colors">
                {product.name}
              </h3>
              <button
                onClick={handleHeartClick}
                className="w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center hover:scale-105 transition-all text-neutral-400 hover:text-red-500 cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`} />
              </button>
            </div>
            
            <p className="text-xs text-neutral-400 font-medium capitalize">
              {activeModel} • {activeColor.name} • {activeMaterial.replace('Premium ', '')}
            </p>

            <p className="text-xs text-neutral-450 font-light line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            {/* Ratings and Reviews */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="font-bold text-neutral-200">{product.rating}</span>
              <span>({product.reviewsCount} reviews)</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-900 pt-3 mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-[#adc6ff] font-mono">
                ₹{prices.current.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-neutral-500 font-mono">(Incl. GST)</span>
              {prices.retail && (
                <span className="text-xs text-neutral-500 line-through font-mono ml-1">
                  ₹{prices.retail.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Swatches */}
            <div className="flex gap-1">
              {product.colors.map((col) => (
                <button
                  key={col.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveColor(col);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                    activeColor.id === col.id 
                      ? 'ring-2 ring-[#adc6ff] scale-110 border-transparent' 
                      : 'border-neutral-800'
                  } ${col.bgClass}`}
                  title={col.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout (Default mockup styling)
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-[#18181b]/60 border border-neutral-800/60 rounded-3xl p-4 hover:shadow-xl hover:border-neutral-700/80 transition-all duration-300 text-white h-full backdrop-blur-sm"
    >
      {/* 1. Image Container (Ratio 4/5) */}
      <div 
        onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
        className="w-full bg-[#202024]/40 group-hover:bg-[#202024]/75 aspect-[4/5] rounded-2xl flex items-center justify-center p-5 cursor-pointer relative overflow-hidden transition-colors duration-300 select-none"
      >
        {/* Dynamic Badge Overlay */}
        {badge && (
          <div className={`absolute top-3.5 left-3.5 z-10 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg shadow-sm border ${
            badge.type === 'discount' 
              ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/25' 
              : badge.type === 'new'
              ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/25'
              : 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/25'
          }`}>
            {badge.text}
          </div>
        )}

        {/* Heart Wishlist Trigger */}
        <button
          onClick={handleHeartClick}
          className="absolute top-3.5 right-3.5 z-10 w-8.5 h-8.5 bg-black/40 border border-white/10 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-sm cursor-pointer text-[#c1c6d7] hover:text-red-500"
          title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isSaved 
                ? 'fill-red-500 text-red-500' 
                : 'text-[#c1c6d7]'
            }`} 
          />
        </button>

        {/* Phone Case Render */}
        <div className="transform scale-[0.74] group-hover:scale-[0.77] transition-transform duration-500 ease-out origin-center">
          <PhoneCaseRenderer
            model={activeModel}
            material={activeMaterial}
            color={activeColor}
            size="md"
            magsafe={product.magsafe}
          />
        </div>

        {/* Dynamic Premium Hover Buttons Overlay */}
        <div className={`absolute inset-0 bg-black/35 backdrop-blur-[4px] flex flex-col items-center justify-center gap-3 p-4 transition-all duration-300 z-20 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product, activeModel, activeColor, activeMaterial);
            }}
            className="w-4/5 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Quick Add</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCustomizeClick(product, activeModel, activeColor, activeMaterial);
            }}
            className="w-4/5 py-2.5 bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e69] font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#002e69] fill-[#002e69]" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* 2. Text Summary details */}
      <div className="pt-4 flex-1 flex flex-col justify-between">
        
        <div className="space-y-1">
          {/* Swatches switcher */}
          <div className="flex gap-1.5 pb-1">
            {product.colors.map((col) => {
              const isSelected = activeColor.id === col.id;
              return (
                <button
                  key={col.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveColor(col);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                    isSelected 
                      ? 'ring-2 ring-[#adc6ff] scale-110 border-transparent' 
                      : 'border-neutral-700 hover:border-neutral-500'
                  } ${col.bgClass}`}
                  title={col.name}
                />
              );
            })}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-neutral-500 font-bold font-mono pl-1">+{product.colors.length - 5}</span>
            )}
          </div>

          {/* Title & model */}
          <div className="space-y-0.5">
            <h3 
              onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
              className="font-serif text-[15px] font-bold text-white leading-snug cursor-pointer line-clamp-1 hover:text-[#adc6ff] transition-colors"
            >
              {product.name}
            </h3>
            <p className="text-xs text-neutral-400 font-medium capitalize">
              {activeModel}
            </p>
          </div>
        </div>

        {/* 3. Bottom Row: Price and Rating */}
        <div className="flex items-center justify-between border-t border-neutral-900 pt-3 mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-extrabold text-[#adc6ff] font-mono leading-none">
              ₹{prices.current.toLocaleString('en-IN')}
            </span>
            <span className="text-[8px] text-neutral-500 font-mono">(Incl. GST)</span>
            {prices.retail && (
              <span className="text-[11px] text-neutral-500 line-through font-mono leading-none ml-0.5">
                ₹{prices.retail.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-450">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-neutral-200">{product.rating}</span>
            <span className="text-neutral-550 font-medium font-sans">({product.reviewsCount})</span>
          </div>
        </div>

      </div>

    </div>
  );
}
