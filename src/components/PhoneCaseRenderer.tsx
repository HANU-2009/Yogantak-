import React from 'react';
import { PhoneModel, CaseMaterial, CaseColor } from '../types';

interface PhoneCaseRendererProps {
  model: PhoneModel;
  material: CaseMaterial;
  color: CaseColor;
  monogramText?: string;
  monogramColor?: 'gold' | 'silver' | 'rose' | 'blind';
  magsafe?: boolean;
  buttonColor?: 'gold' | 'silver' | 'gunmetal' | 'matching';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fill';
}

export default function PhoneCaseRenderer({
  model,
  material,
  color,
  monogramText = '',
  monogramColor = 'gold',
  magsafe = true,
  buttonColor = 'matching',
  size = 'md'
}: PhoneCaseRendererProps) {
  
  // Dimensions adaptation — 'fill' expands to parent container
  const sizeClasses = {
    sm: 'w-32 h-64 text-[8px]',
    md: 'w-48 h-96 text-xs',
    lg: 'w-64 h-[28rem] text-sm',
    xl: 'w-72 h-[32rem] text-base',
    fill: 'w-full h-full text-xs'
  };

  // Select the appropriate given product image based on the model
  let imageSrc = '/products/Gemini_Generated_Image_iy3i6tiy3i6tiy3i.png'; // default
  if (model === 'iPhone 15 Pro Max') {
    imageSrc = '/products/Gemini_Generated_Image_iy3i6tiy3i6tiy3i.png';
  } else if (model === 'iPhone 15 Pro') {
    imageSrc = '/products/separate_image_5.png';
  } else if (model === 'iPhone 15') {
    imageSrc = '/products/separate_image_4.png';
  } else if (model === 'Samsung Galaxy S24 Ultra') {
    imageSrc = '/products/separate_image_2.png';
  } else if (model === 'Samsung Galaxy S24+') {
    imageSrc = '/products/case_set2_2.png';
  } else if (model === 'Google Pixel 8 Pro') {
    imageSrc = '/products/separate_image_6.png';
  } else if (model === 'Nothing Phone (2)') {
    imageSrc = '/products/Gemini_Generated_Image_t6puc4t6puc4t6pu.png';
  } else if (model === 'OnePlus 12') {
    imageSrc = '/products/Gemini_Generated_Image_txtit5txtit5txti (1).png';
  } else if (model === 'Samsung Galaxy Z Fold 5') {
    imageSrc = '/products/Gemini_Generated_Image_txtit5txtit5txti.png';
  } else if (model === 'Motorola Edge') {
    imageSrc = '/products/case_set2_4.png';
  }

  // Determine structural shape (Samsung & Fold are boxier, iPhone, Pixel, Nothing & OnePlus are rounded)
  const isSamsung = model.includes('Samsung');
  const isFold = model.includes('Fold');
  const frameRadius = (isSamsung || isFold) ? 'rounded-[16px]' : 'rounded-[32px]';

  // Textures and overlay patterns
  let overlayClass = "";
  if (material === 'Premium Pebble Leather') {
    overlayClass = "bg-[radial-gradient(rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[size:3.5px_3.5px] opacity-45 mix-blend-overlay";
  } else if (material === 'Aramid Carbon Fiber') {
    overlayClass = "bg-[linear-gradient(45deg,#000_25%,transparent_25%),linear-gradient(-45deg,#000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#000_75%),linear-gradient(-45deg,transparent_75%,#000_75%)] bg-[size:3.5px_3.5px] opacity-80 mix-blend-multiply";
  } else if (material === 'Bio-Degradable Wheat Fiber') {
    overlayClass = "bg-[radial-gradient(rgba(0,0,0,0.35)_1px,transparent_1px)] bg-[size:7px_7px] opacity-40 mix-blend-overlay";
  } else if (material === 'Ultra-Tough Polycarbonate') {
    overlayClass = "bg-gradient-to-tr from-white/10 via-transparent to-white/30";
  }

  // Monogram embossing color styles
  const monogramStyles = {
    gold: {
      color: '#E0B543',
      textShadow: '0 1.5px 0.5px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.5)',
      fontFamily: 'Georgia, serif'
    },
    silver: {
      color: '#E2E8F0',
      textShadow: '0 1.5px 0.5px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.5)',
      fontFamily: 'Georgia, serif'
    },
    rose: {
      color: '#C8838F',
      textShadow: '0 1.5px 0.5px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.5)',
      fontFamily: 'Georgia, serif'
    },
    blind: {
      color: 'rgba(0,0,0,0.38)',
      textShadow: 'inset 1px 1px 1px rgba(0,0,0,0.6), 1px 1px 1px rgba(255,255,255,0.2)',
      fontFamily: 'Georgia, serif'
    }
  };

  return (
    <div 
      id="phone-case-renderer" 
      className={`relative ${sizeClasses[size]} select-none transition-all duration-500 ease-out flex items-center justify-center`}
    >
      {/* Outer Case Wrapper with Correct Shape Border */}
      <div 
        className={`relative w-full h-full ${frameRadius} flex items-center justify-center shadow-2xl transition-all duration-500 bg-transparent overflow-hidden`}
      >
        {/* Underlay Phone Case Image */}
        <img
          src={imageSrc}
          alt={`TPU Case for ${model}`}
          className="w-full h-full object-contain transition-all duration-500"
        />


        {/* MagSafe Compass Ring */}
        {magsafe && (
          <div className="absolute inset-0 flex items-center justify-center opacity-65 mix-blend-overlay pointer-events-none">
            <div className="relative flex items-center justify-center">
              {/* Main Ring */}
              <div className="w-20 h-20 rounded-full border-[2.5px] border-white"></div>
              {/* Align notch */}
              <div className="absolute top-[70px] w-2 h-5 bg-white"></div>
            </div>
          </div>
        )}

        {/* Monogram Label */}
        {monogramText.trim().length > 0 && (
          <div className="absolute bottom-12 inset-x-0 flex justify-center text-center z-25 pointer-events-none">
            <div 
              className="px-3 py-1 font-serif font-medium uppercase tracking-[0.25em] text-xs transition-all rounded"
              style={monogramStyles[monogramColor]}
            >
              {monogramText.substring(0, 4)}
            </div>
          </div>
        )}

        {/* Subtle Watermark Branding */}
        <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none z-10 opacity-20">
          <span className="text-[9px] font-mono tracking-widest text-neutral-350">YOGANTAK.</span>
        </div>
      </div>
    </div>
  );
}
