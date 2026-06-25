import { useState, useEffect } from 'react';
import { PhoneModel, CaseMaterial, CaseColor, CustomCaseConfig, Product } from '../types';
import PhoneCaseRenderer from './PhoneCaseRenderer';
import { PHONE_MODELS, COLORS, MATERIAL_DETAILS, PRODUCTS } from '../data/products';
import { Sparkles, ShoppingBag, ShieldCheck, HelpCircle, Check, Info } from 'lucide-react';

interface ProductVisualizerProps {
  onAddCustomCase: (config: CustomCaseConfig, price: number) => void;
  initialPreset?: {
    product: Product;
    model: PhoneModel;
    color: CaseColor;
    material: CaseMaterial;
  };
}

export default function ProductVisualizer({
  onAddCustomCase,
  initialPreset
}: ProductVisualizerProps) {
  
  // Customizer active parameters
  const [selectedModel, setSelectedModel] = useState<PhoneModel>(PHONE_MODELS[0]);
  const [selectedMaterial, setSelectedMaterial] = useState<CaseMaterial>('Smooth Liquid Silicone');
  const [selectedColor, setSelectedColor] = useState<CaseColor>(COLORS[0]);
  const [monogramText, setMonogramText] = useState<string>('');
  const [monogramColor, setMonogramColor] = useState<'gold' | 'silver' | 'rose' | 'blind'>('gold');
  const [magsafe, setMagsafe] = useState<boolean>(true);
  const [buttonColor, setButtonColor] = useState<'gold' | 'silver' | 'gunmetal' | 'matching'>('matching');
  const [addFeedback, setAddFeedback] = useState<boolean>(false);

  // Apply preset coordinates if users came from catalog "engrave" button
  useEffect(() => {
    if (initialPreset) {
      setSelectedModel(initialPreset.model);
      setSelectedColor(initialPreset.color);
      setSelectedMaterial(initialPreset.material);
      setMagsafe(initialPreset.product.magsafe);
    }
  }, [initialPreset]);

  // Live price estimation
  const getCustomPrice = () => {
    const basePrice = 2399; // baseline for smooth silicone
    const materialPremium = MATERIAL_DETAILS[selectedMaterial]?.pricePremium || 0;
    const monogramPremium = monogramText.trim().length > 0 ? 800 : 0;
    const magSafePremium = magsafe ? 400 : 0;
    return basePrice + materialPremium + monogramPremium + magSafePremium;
  };

  const handleAddToCart = () => {
    const customConfig: CustomCaseConfig = {
      model: selectedModel,
      material: selectedMaterial,
      color: selectedColor,
      monogramText: monogramText.toUpperCase(),
      monogramColor,
      magsafe,
      buttonColor
    };

    onAddCustomCase(customConfig, getCustomPrice());
    setAddFeedback(true);
    setTimeout(() => {
      setAddFeedback(false);
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10">
      
      {/* Title block */}
      <div className="text-center max-w-xl mx-auto space-y-3 mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-none border border-black text-[10px] font-mono tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>BESPOKE TAILORING STUDIO</span>
        </div>
        <h2 className="font-sans text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase italic">
          Customize Your Shell
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 font-mono uppercase tracking-widest">
          Choose materials, accents, and monogramming
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-start">
        
        {/* Left pane: Dynamic full rendering frame */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-8 min-h-[360px] sm:min-h-[460px] border border-gray-100 relative overflow-hidden group">
          
          <div className="absolute top-4 left-4 font-mono text-[9px] text-gray-400 uppercase tracking-widest">
            REAL-TIME LAB VIEW
          </div>

          <div className="transform scale-[0.72] sm:scale-100 transition-transform duration-500 hover:rotate-2">
            <PhoneCaseRenderer
              model={selectedModel}
              material={selectedMaterial}
              color={selectedColor}
              monogramText={monogramText}
              monogramColor={monogramColor}
              magsafe={magsafe}
              buttonColor={buttonColor}
              size="xl"
            />
          </div>

          {/* Quick specs badge */}
          <div className="mt-4 sm:mt-8 space-y-1 text-center bg-white/60 px-3 sm:px-4 py-2 border border-gray-200 text-[10px] sm:text-xs font-mono text-slate-600 max-w-xs break-words">
            <div>DEVICE: {selectedModel}</div>
            <div>COMPOSITION: {selectedMaterial}</div>
            {monogramText.trim().length > 0 && (
              <div className="text-black font-bold">MONOGRAM: "{monogramText.toUpperCase()}" ({monogramColor} foil)</div>
            )}
          </div>
        </div>

        {/* Right pane: Full configuration interactive controls */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8 bg-white p-4 sm:p-8 border border-gray-100">
          
          {/* Step 1: Select Model */}
          <div className="space-y-3">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-400 font-bold">
              1. COMPATIBLE DEVICE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {PHONE_MODELS.map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`px-3 py-2.5 text-[11px] font-mono border text-left rounded-none transition-all relative cursor-pointer min-h-12 ${
                    selectedModel === model
                      ? 'border-black bg-gray-50 text-black font-bold'
                      : 'border-gray-100 bg-transparent text-gray-400 hover:border-black hover:text-black'
                  }`}
                >
                  {selectedModel === model && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-black"></span>
                  )}
                  <span className="block pr-3 leading-snug">{model}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Materials */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                2. MATERIAL CONFIGURATION
              </label>
              {MATERIAL_DETAILS[selectedMaterial]?.pricePremium > 0 && (
                <span className="text-[11px] font-mono text-black font-bold">
                  + ₹{MATERIAL_DETAILS[selectedMaterial].pricePremium.toLocaleString('en-IN')} PREMIUM
                </span>
              )}
            </div>
            <div className="space-y-2">
              {(Object.keys(MATERIAL_DETAILS) as CaseMaterial[]).map((material) => (
                <button
                  key={material}
                  onClick={() => setSelectedMaterial(material)}
                  className={`w-full p-3.5 border text-left rounded-none transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative cursor-pointer ${
                    selectedMaterial === material
                      ? 'border-black bg-gray-50 text-black'
                      : 'border-gray-100 bg-transparent text-gray-400 hover:border-black hover:text-black'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold block">{material}</span>
                    <span className="text-[10px] text-gray-400 block max-w-md">{MATERIAL_DETAILS[material].description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-slate-600 text-[9px] font-mono uppercase">
                      {MATERIAL_DETAILS[material].tag}
                    </span>
                    {selectedMaterial === material && (
                      <Check className="w-4 h-4 text-black" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Base Swatch Options */}
          <div className="space-y-3">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-400 font-bold">
              3. COLOR OUTLINE
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {COLORS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedColor(col)}
                  className={`flex items-center gap-1.5 px-3 py-2 border transition-all rounded-none cursor-pointer ${
                    selectedColor.id === col.id
                      ? 'border-black bg-gray-50 ring-1 ring-offset-1 ring-black'
                      : 'border-gray-100 bg-transparent'
                  }`}
                >
                  <span className={`w-4.5 h-4.5 rounded-full ${col.bgClass} inline-block border border-black/10`}></span>
                  <span className="text-[11px] font-mono text-slate-600">{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Metallic hardware buttons & MagSafe Ring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-150">
            {/* Left: Button Accent */}
            <div className="space-y-3">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                4A. METALLIC BUTTON COVERS
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {([
                  { id: 'matching', label: 'Matching Color' },
                  { id: 'gold', label: 'Anodized Gold' },
                  { id: 'silver', label: 'Polished Chrome' },
                  { id: 'gunmetal', label: 'Midnight Grey' }
                ] as const).map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setButtonColor(btn.id)}
                    className={`py-2 border transition-colors cursor-pointer ${
                      buttonColor === btn.id
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-transparent border-gray-100 text-gray-400 hover:border-black'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: MagSafe Toggle */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                  4B. MAGNETIC INTEGRITY
                </label>
                <span className="text-[10px] font-mono text-black font-bold">+ ₹400 INC.</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setMagsafe(true)}
                  className={`py-2 border transition-colors cursor-pointer ${
                    magsafe
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-transparent border-gray-100 text-gray-400 hover:border-black'
                  }`}
                >
                  MagSafe Ring Added
                </button>
                <button
                  onClick={() => setMagsafe(false)}
                  className={`py-2 border transition-colors cursor-pointer ${
                    !magsafe
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-transparent border-gray-100 text-gray-400 hover:border-black'
                  }`}
                >
                  Standard Case (No Ring)
                </button>
              </div>
            </div>
          </div>

          {/* Step 5: Hot stamp monogramming customized initials */}
          <div className="space-y-3 pt-4 border-t border-gray-150">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                5. PERSONALIZED HOT MONOGRAM
              </label>
              <span className="text-[10px] font-mono text-black font-bold">+ ₹800 EMBELLISHMENT</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <input
                  type="text"
                  maxLength={4}
                  value={monogramText}
                  onChange={(e) => setMonogramText(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 4))}
                  placeholder="INITIALS (e.g., A.S)"
                  className="w-full bg-white border border-gray-100 px-4 py-3 text-xs font-mono text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors uppercase"
                />
                <span className="text-[10px] font-mono text-gray-400 mt-1 block">Maximum 4 classic alphabetical characters</span>
              </div>

              <div className="md:col-span-7 space-y-1.5">
                <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">Stamp Foil Leaf:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
                  {([
                    { id: 'gold', label: '24k Gold' },
                    { id: 'silver', label: 'Silver' },
                    { id: 'rose', label: 'Rose Gold' },
                    { id: 'blind', label: 'De-bossed' }
                  ] as const).map((foil) => (
                    <button
                      key={foil.id}
                      disabled={monogramText.trim().length === 0}
                      onClick={() => setMonogramColor(foil.id)}
                      className={`py-2 border transition-all text-center cursor-pointer ${
                        monogramColor === foil.id && monogramText.trim().length > 0
                          ? 'bg-black text-white border-black font-bold'
                          : 'bg-transparent border-gray-100 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-black'
                      }`}
                    >
                      {foil.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary Box and Checkout Activation */}
          <div className="bg-gray-50 p-5 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Bespoke Design Pricing:</span>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="font-mono text-3xl font-bold text-black">₹{getCustomPrice().toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Shipping Included</span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className={`w-full sm:w-auto px-8 py-4 font-mono text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 relative rounded-none cursor-pointer ${
                addFeedback 
                  ? 'bg-black text-white' 
                  : 'bg-black text-white hover:opacity-80'
              }`}
            >
              {addFeedback ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  <span>Added To Shopping Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add To Cart Studio</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
