import React, { useState } from 'react';
import { Product, PhoneModel, CaseMaterial, CaseColor } from '../types';
import PhoneCaseRenderer from './PhoneCaseRenderer';
import { Star, Sparkles, ShoppingBag, Heart } from 'lucide-react';

interface ProductCardProps {
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
      return { current: 39.99, retail: 49.99 };
    }
    if (product.id === 'liquid-silicone') {
      return { current: 24.99, retail: 29.99 };
    }
    if (product.id === 'crystal-poly') {
      return { current: 34.99, retail: 39.99 };
    }
    if (product.id === 'stealth-aramid') {
      return { current: 49.99, retail: 59.99 };
    }
    return { current: product.basePrice, retail: null };
  };

  const badge = getBadge();
  const prices = getPrices();

  if (layout === 'list') {
    return (
      <div 
        onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
        className="group bg-white border border-gray-150 rounded-3xl p-4 flex gap-6 hover:shadow-md transition-all duration-300 text-gray-800 cursor-pointer"
      >
        {/* Left: Phone Image Area */}
        <div className="w-40 bg-gray-50 rounded-2xl flex items-center justify-center p-3 relative overflow-hidden shrink-0 aspect-[4/5]">
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
              <h3 className="text-base font-extrabold text-gray-900 leading-tight group-hover:text-[#6366f1] transition-colors">
                {product.name}
              </h3>
              <button
                onClick={handleHeartClick}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:scale-105 transition-all text-gray-400 hover:text-red-500"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 font-medium capitalize">
              {activeModel} • {activeColor.name} • {activeMaterial.replace('Premium ', '')}
            </p>

            <p className="text-xs text-gray-400 font-light line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            {/* Ratings and Reviews */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="font-bold text-gray-800">{product.rating}</span>
              <span>({product.reviewsCount} reviews)</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-[#6366f1] font-mono">
                ${prices.current.toFixed(2)}
              </span>
              {prices.retail && (
                <span className="text-xs text-gray-450 line-through font-mono">
                  ${prices.retail.toFixed(2)}
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
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    activeColor.id === col.id 
                      ? 'ring-2 ring-[#6366f1] scale-110 border-transparent' 
                      : 'border-gray-200'
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
      className="group relative flex flex-col bg-white border border-gray-150 rounded-3xl p-4 hover:shadow-lg transition-all duration-300 text-gray-800 h-full"
    >
      {/* 1. Image Container (Ratio 4/5) */}
      <div 
        onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
        className="w-full bg-[#f3f4f6]/80 group-hover:bg-[#eaecef] aspect-[4/5] rounded-2xl flex items-center justify-center p-5 cursor-pointer relative overflow-hidden transition-colors duration-300 select-none"
      >
        {/* Dynamic Badge Overlay */}
        {badge && (
          <div className={`absolute top-3.5 left-3.5 z-10 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg shadow-sm border ${
            badge.type === 'discount' 
              ? 'bg-[#fee2e2] text-[#ef4444] border-[#fecaca]' 
              : badge.type === 'new'
              ? 'bg-[#dcfce7] text-[#22c55e] border-[#bbf7d0]'
              : 'bg-[#ffedd5] text-[#f97316] border-[#fed7aa]'
          }`}>
            {badge.text}
          </div>
        )}

        {/* Heart Wishlist Trigger */}
        <button
          onClick={handleHeartClick}
          className="absolute top-3.5 right-3.5 z-10 w-8.5 h-8.5 bg-white border border-gray-150 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-sm cursor-pointer text-gray-400 hover:text-red-500"
          title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isSaved 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-400'
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
        <div className={`absolute inset-0 bg-black/10 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 p-4 transition-all duration-300 z-20 ${
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
            className="w-4/5 py-2.5 bg-[#6366f1] hover:bg-[#5558e6] text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
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
                      ? 'ring-2 ring-[#6366f1] scale-110 border-transparent' 
                      : 'border-gray-250 hover:border-gray-400'
                  } ${col.bgClass}`}
                  title={col.name}
                />
              );
            })}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-gray-400 font-bold font-mono pl-1">+{product.colors.length - 5}</span>
            )}
          </div>

          {/* Title & model */}
          <div className="space-y-0.5">
            <h3 
              onClick={() => onOpenDetails(product, activeModel, activeColor, activeMaterial)}
              className="text-sm font-extrabold text-gray-900 leading-snug cursor-pointer line-clamp-1 hover:text-[#6366f1] transition-colors"
            >
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 font-medium capitalize">
              {activeModel}
            </p>
          </div>
        </div>

        {/* 3. Bottom Row: Price and Rating */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-extrabold text-[#6366f1] font-mono leading-none">
              ${prices.current.toFixed(2)}
            </span>
            {prices.retail && (
              <span className="text-[11px] text-gray-400 line-through font-mono leading-none">
                ${prices.retail.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-gray-800">{product.rating}</span>
            <span className="text-gray-400 font-medium font-sans">({product.reviewsCount})</span>
          </div>
        </div>

      </div>

    </div>
  );
}
