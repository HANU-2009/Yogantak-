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
  const DEFAULT_COLOR: CaseColor = { id: 'default', name: 'Default', value: '#111827', bgClass: 'bg-gray-900', textContrast: 'light' };
  const [activeModel, setActiveModel] = useState<PhoneModel>((product.models?.[0] as PhoneModel) || 'iPhone 15 Pro Max');
  const [activeColor, setActiveColor] = useState<CaseColor>(product.colors?.[0] || DEFAULT_COLOR);
  const [activeMaterial, setActiveMaterial] = useState<CaseMaterial>((product.materials?.[0] as CaseMaterial) || 'Premium Pebble Leather');
  const [isHovered, setIsHovered] = useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSaved) {
      onToggleSaved(product.id);
    }
  };

  const getBadge = () => {
    if (product.id === 'sienna-leather') return { text: '-20%', type: 'discount' };
    if (product.id === 'liquid-silicone') return { text: '-15%', type: 'discount' };
    if (product.id === 'crystal-poly') return { text: 'New', type: 'new' };
    if (product.id === 'bio-wheat') return { text: 'New', type: 'new' };
    if (product.id === 'stealth-aramid' || product.bestseller) return { text: 'Bestseller', type: 'bestseller' };
    return null;
  };

  const getPrices = () => {
    if (product.id === 'sienna-leather') return { current: 2999, retail: 3999 };
    if (product.id === 'liquid-silicone') return { current: 1999, retail: 2399 };
    if (product.id === 'crystal-poly') return { current: 2599, retail: 3199 };
    if (product.id === 'stealth-aramid') return { current: 3999, retail: 4999 };
    return { current: product.price ?? product.basePrice ?? 0, retail: null };
  };

  const badge = getBadge();
  const prices = getPrices();

  if (layout === 'list') {
    return (
      <div 
        onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
        className="group bg-[#fdfdfd]/40 backdrop-blur-3xl border border-neutral-200/60 rounded-[2rem] p-4 flex gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 text-neutral-900 cursor-pointer"
      >
        {/* Image Compartment */}
        <div className="w-40 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center p-3 relative overflow-hidden shrink-0 aspect-[4/5]">
          {product.image && product.image !== 'custom' ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <div className="transform scale-[0.65] transition-transform duration-500 group-hover:scale-[0.68] w-full h-full">
              <PhoneCaseRenderer
                model={activeModel}
                material={activeMaterial}
                color={activeColor}
                size="fill"
                magsafe={product.magsafe}
              />
            </div>
          )}
        </div>

        {/* Right: Info Area */}
        <div className="flex-grow flex flex-col justify-between py-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-bold text-neutral-900 leading-tight group-hover:text-black transition-colors">
                {product.name}
              </h3>
              <button
                onClick={handleHeartClick}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:scale-105 transition-all text-neutral-400 hover:text-red-500 cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`} />
              </button>
            </div>
            
            <p className="text-xs text-neutral-500 font-medium capitalize">
              {activeModel} • {activeColor.name} • {activeMaterial.replace('Premium ', '')}
            </p>

            <p className="text-xs text-neutral-500 font-light line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="font-bold text-neutral-900">{product.rating}</span>
              <span>({product.reviewsCount} reviews)</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 pt-3 mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-neutral-900 font-sans tracking-tight">
                ₹{prices.current.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-neutral-400 font-sans">(Incl. GST)</span>
              {prices.retail && (
                <span className="text-xs text-neutral-400 line-through font-sans ml-1">
                  ₹{prices.retail.toLocaleString('en-IN')}
                </span>
              )}
            </div>

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
                      ? 'ring-2 ring-black scale-110 border-transparent' 
                      : 'border-neutral-200'
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

  // Grid layout
  return (
    <div 
      className="group relative flex flex-col bg-[#fdfdfd]/40 backdrop-blur-3xl border border-neutral-200/60 rounded-[2rem] p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 text-neutral-900 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main image presentation block */}
      <div 
        onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
        className="w-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 aspect-[4/5] rounded-2xl flex items-center justify-center p-3 cursor-pointer relative transition-colors duration-300 select-none overflow-hidden"
      >
        {/* Dynamic Badge Overlay */}
        {badge && (
          <div className={`absolute top-3.5 left-3.5 z-10 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm border ${
            badge.type === 'discount' 
              ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20' 
              : badge.type === 'new'
              ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
              : 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20'
          }`}>
            {badge.text}
          </div>
        )}

        {/* Heart Wishlist Trigger */}
        <button
          onClick={handleHeartClick}
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-sm cursor-pointer text-neutral-400 hover:text-red-500"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-red-500 text-red-500' : 'text-neutral-400'
            }`} 
          />
        </button>

        {/* Product Image */}
        <div className="w-full h-full flex items-center justify-center">
          {product.image && product.image !== 'custom' ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <PhoneCaseRenderer
              model={activeModel}
              material={activeMaterial}
              color={activeColor}
              size="fill"
              magsafe={product.magsafe}
            />
          )}
        </div>

        {/* Hover Buttons Overlay */}
        <div className={`absolute inset-0 bg-white/40 backdrop-blur-[4px] flex flex-col items-center justify-center gap-3 p-4 transition-all duration-300 z-20 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product, activeModel, activeColor, activeMaterial);
            }}
            className="w-4/5 py-3 bg-[#cfff71]/80 backdrop-blur-sm hover:bg-[#cfff71] text-neutral-900 font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Quick Add</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCustomizeClick(product, activeModel, activeColor, activeMaterial);
            }}
            className="w-4/5 py-3 bg-white/70 backdrop-blur-sm hover:bg-white text-neutral-900 font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-neutral-900 fill-neutral-900" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Text Summary */}
      <div className="pt-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
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
                      ? 'ring-2 ring-black scale-110 border-transparent' 
                      : 'border-neutral-300 hover:border-neutral-400'
                  } ${col.bgClass}`}
                  title={col.name}
                />
              );
            })}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-neutral-400 font-bold font-mono pl-1">+{product.colors.length - 5}</span>
            )}
          </div>

          <div className="space-y-0.5">
            <h3 
              onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
              className="font-sans text-[15px] font-bold text-neutral-900 leading-snug cursor-pointer line-clamp-1 hover:text-black transition-colors"
            >
              {product.name}
            </h3>
            <p className="text-xs text-neutral-500 font-medium capitalize">
              {activeModel}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-extrabold text-neutral-900 font-sans tracking-tight leading-none">
              ₹{prices.current.toLocaleString('en-IN')}
            </span>
            <span className="text-[8px] text-neutral-400 font-sans">(Incl. GST)</span>
            {prices.retail && (
              <span className="text-[11px] text-neutral-400 line-through font-sans leading-none ml-0.5">
                ₹{prices.retail.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-500">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-neutral-900">{(product.rating ?? 5).toFixed(1)}</span>
            <span className="text-neutral-400 font-medium font-sans">({product.reviewsCount ?? 0})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
