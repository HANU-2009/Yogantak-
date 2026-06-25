import { useState, useEffect } from 'react';
import { Product, PhoneModel, CaseMaterial, CaseColor } from '../types';
import PhoneCaseRenderer from './PhoneCaseRenderer';
import { MATERIAL_DETAILS } from '../data/products';
import { 
  Star, 
  X, 
  Check, 
  Plus, 
  Minus, 
  Heart, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product | null;
  chosenModel: PhoneModel;
  chosenColor: CaseColor;
  chosenMaterial: CaseMaterial;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, model: PhoneModel, color: CaseColor, material: CaseMaterial) => void;
  onToggleSaved: (id: string) => void;
  isSaved: boolean;
}

// Creative image/texture mapping for each product design lines
const CREATIVE_ASSETS: Record<string, {
  thumbnails: string[];
  specs: string[];
  craftsmanshipText: string;
  benefitText: string;
  landscapeLifestyle: string;
}> = {
  'sienna-leather': {
    thumbnails: [
      'case-renderer', // standard renderer
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400&auto=format&fit=crop', // Workshop
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400&auto=format&fit=crop', // Handsome in leather coat
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop'  // Textures
    ],
    specs: ['10g Ultra-Light', 'French Pebble Leather', 'MagSafe Guard', 'Certified Europe Audit'],
    craftsmanshipText: 'Sourced directly from gold-rated tanneries in southern France. Each hide is hand-selected and meticulously stretched over our ultra-durable drop cores. Natural pebbled grain develops a rich, personalized patina unique to your natural oils over months of active handling.',
    benefitText: 'Lined with soft genuine micro-suede interiors to completely safeguard glass phone backplates from fine micro-abrasions. Reinforced corner airbags protect physical logic boards and camera lenses from severe impact up to 10 feet.',
    landscapeLifestyle: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' // Woman smiling
  },
  'bio-wheat': {
    thumbnails: [
      'case-renderer',
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=400&auto=format&fit=crop', // Wheat fields
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=400&auto=format&fit=crop', // Organic forest leaf
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop'  // Smiling natural portrait
    ],
    specs: ['100% Biodegradable', 'Zero Toxic Carbon', 'Expedited Compost', 'Eggshell Raw Touch'],
    craftsmanshipText: 'Formulated completely from agricultural byproduct streams and organic plant starch. Wheat straw fibers create a mesmerizing speckled eggshell finish. When discarded, our entire chassis decomposes safely in local biological composts in 180 days with absolutely zero heavy microplastic trace.',
    benefitText: 'Naturally flexible structural composite material with robust high-tension stretch bounds. Features dynamic anti-microbial outer coatings that actively degrade 99.9% of daily device bacteria buildup on contacts.',
    landscapeLifestyle: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop'
  },
  'liquid-silicone': {
    thumbnails: [
      'case-renderer',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop', // Pastel sheets
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop', // Stylist client portrait
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'  // Velvet wave
    ],
    specs: ['Nanotech Lint-Proof', 'Matte Velvet Touch', '3-Tier Hard Core', '100% Non-Toxic Silica'],
    craftsmanshipText: 'Extremely soft-to-touch liquid silicone fortified with an advanced anti-static surface treatment that blocks pocket lint, grease, and fingerprint stains. Constructed with an integrated inner honeycomb polycarbonate structure to shield heavy corner drops.',
    benefitText: 'Precision physical molding with tight responsive action button overmolds. Offers comprehensive raised lip guards around dynamic lenses and front display glass plates with seamless MagSafe compatibility.',
    landscapeLifestyle: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop'
  },
  'crystal-poly': {
    thumbnails: [
      'case-renderer',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop', // Glass refraction
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400&auto=format&fit=crop', // Modern girl checking phone
      'https://images.unsplash.com/photo-1516912403149-7f47a7371980?q=80&w=400&auto=format&fit=crop'  // Pure structured ice
    ],
    specs: ['Optic Non-Yellowing', '4H Anti-Scratch', 'Symmetric MagSafe', 'Crystal Double Gloss'],
    craftsmanshipText: 'Fabricated with premium, high-density optical grade polycarbonate infused with an advanced UV-absorbing inhibitor compound preventing classic environmental yellowing from sunlight. Totally clear backplate emphasizes your device details.',
    benefitText: 'Reinforced with thick shock-damping TPU bumpers fused along the physical frames. Engineered corner impact cushions absorb 95% of direct kinetic drops to ground targets gracefully.',
    landscapeLifestyle: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop'
  },
  'stealth-aramid': {
    thumbnails: [
      'case-renderer',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400&auto=format&fit=crop'
    ],
    specs: ['0.85mm Ultra Profile', '5x Steel Strength', 'Premium Kevlar Weave', 'Aerospace Material'],
    craftsmanshipText: 'Woven with ultra-premium Grade-A aramid synthetic fibers, normally reserved for military body armor and high-velocity aerospace projects. Completely hand-lasered camera slots with a subtle soft matte texture providing superb tactical grips.',
    benefitText: 'Provides armor-like protection with literally zero extra thickness. Embedded MagSafe coil allows effortless device snaps with absolute alignment accuracy.',
    landscapeLifestyle: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop'
  },
  'minimalist-wallet': {
    thumbnails: [
      'case-renderer',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop'
    ],
    specs: ['Integrated Card Vault', 'Slim Pocket Profile', 'Soft Matte Coating', 'Tactile Buttons'],
    craftsmanshipText: 'Expertly designed 2-in-1 hybrid layout featuring an integrated leather/silicone card vault pocket holding up to 2 active credit cards. Lined internally with RFID shields blocking contactless remote skimming signals.',
    benefitText: 'Thick perimeter shield structures defend the physical display when placed face down on desks. MagSafe compatibility built tightly inside the deep case cores.',
    landscapeLifestyle: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'
  }
};

const DEFAULT_ASSETS = {
  thumbnails: [
    'case-renderer',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop'
  ],
  specs: ['Highly Durable', 'Premium Finish', 'Full Compatible', 'Tested Protection'],
  craftsmanshipText: 'Each bespoke casing shell is manufactured under expert engineering guidelines. We blend durable polymer composites with clean, premium coatings to create a tactile surface that resists staining, lint, and drops.',
  benefitText: 'Provides comprehensive tactile defensive structures around screen bezels and vulnerable camera rings. Fully certified for drops from standard desktop height limits.',
  landscapeLifestyle: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'
};

const BUNDLE_OPTIONS = [
  { id: '1-case', name: '1 CASE', multiplier: 1, discount: 0, tag: 'Standard' },
  { id: '2-cases', name: '2 BOXES', multiplier: 1.7, discount: 15, tag: 'Popular (Save 15%)' },
  { id: '3-cases', name: '3 BOXES', multiplier: 2.4, discount: 20, tag: 'Family Pack (Save 20%)' },
  { id: '6-cases', name: '6 BOXES', multiplier: 4.2, discount: 30, tag: 'Collector Set (Save 30%)' }
];

export default function ProductDetailsModal({
  product,
  chosenModel,
  chosenColor,
  chosenMaterial,
  isOpen,
  onClose,
  onAddToCart,
  onToggleSaved,
  isSaved
}: ProductDetailsModalProps) {
  
  if (!isOpen || !product) return null;

  // Active selections
  const [activeModel, setActiveModel] = useState<PhoneModel>(chosenModel);
  const [activeColor, setActiveColor] = useState<CaseColor>(chosenColor);
  const [activeMaterial, setActiveMaterial] = useState<CaseMaterial>(chosenMaterial);
  
  // Custom interactive states to match CRUX chocolates layout and mechanics
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState<number>(0);
  const [activeBundleIndex, setActiveBundleIndex] = useState<number>(0);
  const [purchaseType, setPurchaseType] = useState<'onetime' | 'subscribe'>('onetime');
  const [deliveryFrequency, setDeliveryFrequency] = useState<string>('Every 1 Month');
  
  // Accordion active toggles matching the image "Ingredients" and "Product Benefit" panels
  const [isIngredientsOpen, setIsIngredientsOpen] = useState<boolean>(true);
  const [isBenefitsOpen, setIsBenefitsOpen] = useState<boolean>(false);
  
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Sync state whenever product loads
  useEffect(() => {
    setActiveModel(chosenModel);
    setActiveColor(chosenColor);
    setActiveMaterial(chosenMaterial);
    setActiveThumbnailIndex(0);
    setActiveBundleIndex(0);
    setPurchaseType('onetime');
    setIsAdded(false);
  }, [product, chosenModel, chosenColor, chosenMaterial]);

  const activeAssets = CREATIVE_ASSETS[product.id] || DEFAULT_ASSETS;

  // Pricing engine calculations
  const selectedBundle = BUNDLE_OPTIONS[activeBundleIndex];
  const bundleBasePrice = Math.round(product.basePrice * selectedBundle.multiplier);
  const finalPrice = purchaseType === 'subscribe' 
    ? Math.round(bundleBasePrice * 0.85) // 15% off Subscription
    : bundleBasePrice;

  const handleAddToCart = () => {
    // Add custom bundle text into the cart items dynamically
    const stylizedProductName = purchaseType === 'subscribe'
      ? `${product.name} [${selectedBundle.name} - Subscribe & Save (${deliveryFrequency})]`
      : `${product.name} [${selectedBundle.name} Double-Pack]`;

    // Map adding to standard cart
    const qty = activeBundleIndex === 0 ? 1 : activeBundleIndex === 1 ? 2 : activeBundleIndex === 2 ? 3 : 6;
    onAddToCart({ ...product, name: stylizedProductName, basePrice: Math.round(finalPrice / qty) }, qty, activeModel, activeColor, activeMaterial);
    
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="product-details-backdrop">
      
      {/* Dark warm overlay backdrop */}
      <div 
        className="fixed inset-0 bg-[#35251B]/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      <div className="flex min-h-screen items-start sm:items-center justify-center p-2 sm:p-6 lg:p-10">
        
        {/* Core Product Details aesthetic cream tablet */}
        <div className="relative w-full max-w-[1050px] bg-[#FAF7F0] border-2 border-[#E5DEC9] rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden text-[#2B1B15] font-sans">
          
          {/* CRUX ESTABLISHED HEADER BAR REPLICATED */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-10 py-4 sm:py-5 bg-[#FAF7F0] border-b border-[#EBE3CD] select-none">
            
            {/* Logo in gorgeous high-contrast red-orange serif font */}
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.05em] text-[#C24B35] italic uppercase">
                YOGANTAK
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-[#8F7D6D] uppercase hidden sm:inline-block pl-2">
                // CRUX EDITION
              </span>
            </div>

            {/* Menu options exactly mirroring the photo query */}
            <div className="hidden md:flex items-center gap-8 font-sans text-xs font-bold uppercase tracking-wider text-[#4E3D34]">
              <span className="hover:text-[#C24B35] cursor-pointer transition-colors pb-0.5 border-b border-transparent">
                Shop
              </span>
              <span className="hover:text-[#C24B35] cursor-pointer transition-colors pb-0.5 border-b border-transparent">
                Bundle
              </span>
              <span className="hover:text-[#C24B35] cursor-pointer transition-colors pb-0.5 border-b border-transparent text-[#C24B35]">
                Subscribe
              </span>
              <span className="hover:text-[#C24B35] cursor-pointer transition-colors pb-0.5 border-b border-transparent">
                Our Story
              </span>
            </div>

            {/* Right Header Navigation Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Toggle Save design */}
              <button
                onClick={() => onToggleSaved(product.id)}
                className={`p-2 rounded-full border border-[#E1D8BE] hover:bg-[#EBE3CD] transition-colors cursor-pointer ${
                  isSaved ? 'text-[#C24B35]' : 'text-[#8F7D6D]'
                }`}
                title="Wishlist product"
                id="wishlistBtn"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#C24B35]' : ''}`} />
              </button>

              {/* Shopping Bag Trigger */}
              <div className="relative p-2 rounded-full border border-[#E1D8BE] bg-white text-[#2B1B15]">
                <ShoppingBag className="w-4 h-4" />
              </div>

              {/* Close Button X with circular outline */}
              <button
                onClick={onClose}
                className="p-2 bg-[#C24B35] border border-[#C24B35] text-white hover:bg-[#A93E28] transition-colors rounded-full cursor-pointer ml-1"
                title="Close modal"
                id="closeModalBtn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Main Workspace Frame container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 p-4 sm:p-10 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">
            
            {/* LEFT BLOCK: Thumbnail bar, main preview frame and model lifestyle image splits (Col-6.5) */}
            <div className="lg:col-span-7 flex flex-col gap-6 select-none">
              
              <div className="flex flex-col-reverse md:flex-row gap-4 items-stretch">
                
                {/* 1. Symmetrical Vertical Thumbnail gallery strip */}
                <div className="flex flex-row md:flex-col gap-2 sm:gap-3 flex-shrink-0 justify-center md:justify-start overflow-x-auto pb-1 md:pb-0">
                  {activeAssets.thumbnails.map((thumbUrl, idx) => {
                    const isSelected = activeThumbnailIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveThumbnailIndex(idx)}
                        className={`w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl overflow-hidden border-2 transition-all p-1 flex items-center justify-center cursor-pointer flex-shrink-0 ${
                          isSelected ? 'border-[#C24B35] ring-2 ring-[#C24B35]/20 scale-102 shadow-sm' : 'border-[#E3DAC0] hover:border-[#2B1B15]/40'
                        }`}
                        id={`thumbBtn-${idx}`}
                      >
                        {thumbUrl === 'case-renderer' ? (
                          <div className="origin-center scale-[0.27] h-12 w-12 flex items-center justify-center">
                            <PhoneCaseRenderer
                              model={activeModel}
                              material={activeMaterial}
                              color={activeColor}
                              size="sm"
                              magsafe={product.magsafe}
                            />
                          </div>
                        ) : (
                          <img 
                            src={thumbUrl} 
                            alt={`Thumbnail preview ${idx}`} 
                            className="w-full h-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 2. Main Large Square Preview Window displaying selected thumbnail */}
                <div className="flex-1 bg-[#FAF7F0] rounded-2xl relative border-2 border-[#EADFCE] flex flex-col items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[350px] md:min-h-[420px] shadow-sm">
                  
                  {/* "Best seller" badge matching CRUX layout position */}
                  {product.bestseller && (
                    <div className="absolute top-5 left-5 bg-[#F9D949] border-2 border-[#2B1B15]/90 text-[#2B1B15] text-[10px] uppercase tracking-widest px-3.5 py-1.5 rounded-full font-bold shadow-sm z-10">
                      Best seller
                    </div>
                  )}

                  <div className="hidden sm:block absolute top-5 right-5 font-mono text-[9px] text-[#A69584] uppercase tracking-widest font-bold">
                    PRESET LINE // {activeColor.name}
                  </div>

                  {/* Render based on selected index */}
                  {activeThumbnailIndex === 0 ? (
                    <div className="transform scale-[0.65] sm:scale-[0.78] hover:scale-[0.82] transition-transform duration-500 py-4 flex items-center justify-center">
                      <PhoneCaseRenderer
                        model={activeModel}
                        material={activeMaterial}
                        color={activeColor}
                        size="lg"
                        magsafe={product.magsafe}
                      />
                    </div>
                  ) : activeThumbnailIndex === 1 ? (
                    <div className="w-full h-full absolute inset-0 py-6 px-10 flex flex-col justify-between items-center text-center">
                      <img 
                        src={activeAssets.thumbnails[1]} 
                        alt="Macro visual" 
                        className="w-full h-64 object-cover rounded-xl shadow-md border border-[#E3DAC0]"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-[#8F7D6D] block">CRAFT MANUAL</span>
                        <h4 className="font-serif font-bold text-base text-[#2B1B15]">Meticulous material grain inspection</h4>
                      </div>
                    </div>
                  ) : activeThumbnailIndex === 2 ? (
                    <div className="w-full h-full absolute inset-0 py-6 px-10 flex flex-col justify-between items-center text-center">
                      <img 
                        src={activeAssets.thumbnails[2]} 
                        alt="Lifestyle close" 
                        className="w-full h-64 object-cover rounded-xl shadow-md border border-[#E3DAC0]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-[#8F7D6D] block">COMMUNITY PORTRAIT</span>
                        <h4 className="font-serif font-bold text-base text-[#2B1B15]">{activeModel} Shielding fit case</h4>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full absolute inset-0 py-6 px-10 flex flex-col justify-between items-center text-center bg-[#EFECE1]">
                      <img 
                        src={activeAssets.thumbnails[3]} 
                        alt="Texture closeup" 
                        className="w-full h-64 object-cover rounded-xl shadow-md border border-[#E3DAC0]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-[#8F7D6D] block">PRESET DETAILS</span>
                        <h4 className="font-serif font-bold text-base text-[#2B1B15]">{activeMaterial} layer grain overview</h4>
                      </div>
                    </div>
                  )}

                  {/* Elegant available color tones dot panel */}
                  <div className="absolute bottom-5 inset-x-0 flex gap-2 items-center justify-center">
                    <span className="text-[10px] font-mono font-medium text-[#8F7D6D] uppercase">Tones:</span>
                    <div className="flex gap-2.5 bg-white/70 backdrop-blur-xs border border-[#E3DAC0] px-3 py-1.5 rounded-full shadow-xs">
                      {product.colors.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveColor(c);
                            setActiveThumbnailIndex(0); // Jump back to case display
                          }}
                          className={`w-4 h-4 rounded-full ${c.bgClass} border border-black/15 transition-all ${
                            activeColor.id === c.id ? 'ring-2 ring-[#C24B35] ring-offset-1 scale-115' : 'opacity-80 hover:opacity-100'
                          }`}
                          title={c.name}
                          id={`colorBtn-${c.id}`}
                        ></button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* 3. LIFESTYLE BANNER PIC BELOW MAIN PREVIEW (Girls/Guys with phone smiling) */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#E1D8BE] aspect-[21/9] hidden md:block bg-neutral-100 shadow-sm leading-none group">
                <img 
                  src={activeAssets.landscapeLifestyle} 
                  alt="Organic design community" 
                  className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Vintage overlay texture */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#35251B]/80 via-[#35251B]/20 to-transparent z-1" />
                
                {/* Caption overlay */}
                <div className="absolute bottom-4 left-5 z-10">
                  <span className="text-[9px] font-mono tracking-[0.25em] text-[#EADFCE] uppercase block font-extrabold pb-0.5">
                    DESIGN TEAM COLLECTION
                  </span>
                  <p className="font-serif text-white text-base tracking-wide italic leading-snug">
                    "Precision engineered armor elements curated with structural aesthetic beauty."
                  </p>
                </div>
              </div>

            </div>

            {/* RIGHT BLOCK: Title, badges, selectors, purchase widgets, accordions (Col-5.5) */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
              
              {/* Product title & ratings stack */}
              <div className="space-y-1 mt-1">
                
                {/* Ratings */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex text-[#C24B35]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C24B35] text-[#C24B35]" />
                    ))}
                  </div>
                  <strong className="text-xs font-mono font-bold text-[#2B1B15] pl-1">(5.0)</strong>
                  <span className="text-[10.5px] font-mono text-[#8F7D6D] uppercase tracking-wider pl-1 font-semibold">
                    1.2k verified reviews
                  </span>
                </div>

                {/* Main Product Name (rendered using Serif Cormorant font) */}
                <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-[#2B1B15] leading-[1.08] capitalize">
                  {product.name.replace(/case.*/i, 'Case')}
                </h1>

                {/* Subtitle tag */}
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-[#8F7D6D] uppercase tracking-widest">
                  <Smartphone className="w-3.5 h-3.5 text-[#C24B35]" />
                  <span>Tailored for {activeModel.split(' ')[0]} flagships</span>
                </div>

              </div>

              {/* Product detail paragraph */}
              <p className="text-[13.5px] leading-relaxed text-[#514339]">
                {product.description}
              </p>

              {/* Composition Specifications (Represents "Nutrition" badges in the screenshot) */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8F7D6D] block">
                  Specifications
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeAssets.specs.map((spec, index) => (
                    <span 
                      key={index}
                      className="bg-[#EBE3CD]/60 text-[#2B1B15] text-[10.5px] px-3.5 py-1.5 rounded-full font-bold font-mono tracking-wide uppercase select-none border border-[#DECFA9]/40"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Device Selector */}
              <div className="space-y-2 border-t border-[#EFECE1] pt-4.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8F7D6D] block">
                  Device Compatibility:
                </span>
                <div className="relative">
                  <select
                    value={activeModel}
                    onChange={(e) => setActiveModel(e.target.value as PhoneModel)}
                    className="w-full bg-[#FAF7F0] border-2 border-[#E1D8BE] text-xs font-mono py-2.5 px-3.5 text-[#2B1B15] rounded-xl focus:outline-none focus:border-[#C24B35] cursor-pointer appearance-none shadow-xs"
                    id="compatibilitySelect"
                  >
                    {product.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#C24B35]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Bundle Selector exactly mirroring the photo query */}
              <div className="space-y-2 border-t border-[#EFECE1] pt-4.5">
                
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8F7D6D]">
                    Bundle Config
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#C24B35] tracking-widest">
                    {selectedBundle.tag}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUNDLE_OPTIONS.map((val, idx) => {
                    const isSelected = activeBundleIndex === idx;
                    return (
                      <button
                        key={val.id}
                        onClick={() => setActiveBundleIndex(idx)}
                        className={`py-2 px-1 rounded-xl text-center font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                          isSelected 
                            ? 'bg-[#412F26] border-[#412F26] text-[#FAF7F0] shadow-sm' 
                            : 'bg-[#FAF7F0] border-[#E1D8BE] text-[#3B2D25] hover:bg-[#EBE3CD]'
                        }`}
                        id={`bundleBtn-${val.id}`}
                      >
                        {val.name}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Purchase Options Container Box (One-time vs Subscribe with 15% discount) */}
              <div className="border-2 border-[#E1D8BE] rounded-2xl bg-[#FAF7F0] overflow-hidden divide-y divide-[#E1D8BE]">
                
                {/* 1. ONE TIME PURCHASE tab */}
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                    purchaseType === 'onetime' ? 'bg-[#EFECE1]/55' : 'hover:bg-[#EFECE1]/30'
                  }`}
                  onClick={() => setPurchaseType('onetime')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      purchaseType === 'onetime' ? 'border-[#C24B35]' : 'border-[#8F7D6D]'
                    }`}>
                      {purchaseType === 'onetime' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#C24B35]" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#2B1B15] tracking-wide">
                      One time purchase
                    </span>
                  </div>
                  <strong className="text-sm font-mono text-[#2B1B15]">
                    ₹{bundleBasePrice.toLocaleString('en-IN')}
                  </strong>
                </div>

                {/* 2. SUBSCRIBE & SAVE tab */}
                <div 
                  className={`p-4 flex flex-col gap-3 transition-colors cursor-pointer ${
                    purchaseType === 'subscribe' ? 'bg-[#EFECE1]/55' : 'hover:bg-[#EFECE1]/30'
                  }`}
                  onClick={() => setPurchaseType('subscribe')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        purchaseType === 'subscribe' ? 'border-[#C24B35]' : 'border-[#8F7D6D]'
                      }`}>
                        {purchaseType === 'subscribe' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#C24B35]" />
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-xs sm:text-sm font-bold text-[#2B1B15] tracking-wide">
                          Subscribe & Save 15%
                        </span>
                        <span className="bg-[#C24B35]/10 text-[#C24B35] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider w-fit">
                          ✦ VIP Club
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                      <span className="text-[10px] font-mono text-[#8F7D6D] line-through">
                        ₹{bundleBasePrice.toLocaleString('en-IN')}
                      </span>
                      <strong className="text-sm font-mono text-[#C24B35]">
                        ₹{finalPrice.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Frequency Option Select - rendered only when subscription active */}
                  {purchaseType === 'subscribe' && (
                    <div className="relative mt-1" onClick={(e) => e.stopPropagation()}>
                      <select 
                        value={deliveryFrequency}
                        onChange={(e) => setDeliveryFrequency(e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#C24B35]/30 text-xs font-mono py-2 px-3 rounded-lg text-[#2B1B15] focus:outline-none focus:ring-1 focus:ring-[#C24B35] appearance-none cursor-pointer"
                        id="subscribeFrequencySelect"
                      >
                        <option value="Every 1 Month">Every 1 Month (Most common)</option>
                        <option value="Every 2 Months">Every 2 Months</option>
                        <option value="Every 3 Months">Every 3 Months (Standard)</option>
                      </select>
                      <div className="absolute right-3 top-2.5 pointer-events-none text-[#C24B35]/70 text-[9.5px] font-bold uppercase tracking-wider font-mono hidden sm:block">
                        Select delivery frequency
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Main solid terracotta "Add To Cart" button */}
              <div className="pt-2">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-4 text-center font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2.5 bg-[#C24B35] hover:bg-[#A93E28] text-white shadow-xl ${
                    isAdded ? 'opacity-90' : ''
                  }`}
                  id="addToCartBtn"
                >
                  <Check className={`w-4 h-4 text-white transition-all ${isAdded ? 'scale-110' : 'scale-0 w-0'}`} />
                  <span>{isAdded ? 'SUCCESSFULLY ADDED' : `Add To Cart — ₹${finalPrice.toLocaleString('en-IN')}`}</span>
                </button>
              </div>

              {/* CRUX ESTABLISHED EXPANSION ACCORDIONS (Ingredients & Product Benefit counterparts) */}
              <div className="border-t border-[#EFECE1] pt-4.5 space-y-3">
                
                {/* Accordion 1: Craftsmanship & Composition (Ingredients counterpart) */}
                <div className="border-b border-[#E1D8BE] pb-3" id="ingredients-accordion">
                  <button
                    onClick={() => setIsIngredientsOpen(!isIngredientsOpen)}
                    className="w-full flex items-center justify-between text-left font-serif text-base font-bold text-[#2B1B15] py-2 cursor-pointer hover:text-[#C24B35] transition-colors"
                  >
                    <span>Craftsmanship & Elements</span>
                    <span className="font-mono text-lg font-normal text-[#8F7D6D]">
                      {isIngredientsOpen ? '×' : '+'}
                    </span>
                  </button>
                  {isIngredientsOpen && (
                    <p className="text-xs text-[#514339] leading-relaxed pt-2 pb-1 font-sans font-light">
                      {activeAssets.craftsmanshipText}
                    </p>
                  )}
                </div>

                {/* Accordion 2: Protective Cushion Guard (Product Benefit counterpart) */}
                <div className="border-b border-[#E1D8BE] pb-3" id="benefits-accordion">
                  <button
                    onClick={() => setIsBenefitsOpen(!isBenefitsOpen)}
                    className="w-full flex items-center justify-between text-left font-serif text-base font-bold text-[#2B1B15] py-2 cursor-pointer hover:text-[#C24B35] transition-colors"
                  >
                    <span>Shield & Drop Protection Benefit</span>
                    <span className="font-mono text-lg font-normal text-[#8F7D6D]">
                      {isBenefitsOpen ? '×' : '+'}
                    </span>
                  </button>
                  {isBenefitsOpen && (
                    <p className="text-xs text-[#514339] leading-relaxed pt-2 pb-1 font-sans font-light">
                      {activeAssets.benefitText}
                    </p>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
