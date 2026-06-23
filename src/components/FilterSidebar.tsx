import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react';
import { CaseMaterial, CaseColor } from '../types';
import { COLORS, PHONE_MODELS, PRODUCTS } from '../data/products';

interface FilterSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedModels: string[];
  setSelectedModels: (models: string[] | ((prev: string[]) => string[])) => void;
  selectedCaseTypes: string[];
  setSelectedCaseTypes: (types: string[] | ((prev: string[]) => string[])) => void;
  selectedMaterials: CaseMaterial[];
  setSelectedMaterials: (materials: CaseMaterial[] | ((prev: CaseMaterial[]) => CaseMaterial[])) => void;
  selectedColors: string[];
  toggleColor: (colorId: string) => void;
  minPrice: number;
  setMinPrice: (price: number) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  magsafeFilter: boolean;
  setMagsafeFilter: (val: boolean) => void;
  wirelessFilter: boolean;
  setWirelessFilter: (val: boolean) => void;
  inStockFilter: boolean;
  setInStockFilter: (val: boolean) => void;
  resetAll: () => void;
  productsCount: number;
}

export default function FilterSidebar({
  searchQuery,
  setSearchQuery,
  selectedModels,
  setSelectedModels,
  selectedCaseTypes,
  setSelectedCaseTypes,
  selectedMaterials,
  setSelectedMaterials,
  selectedColors,
  toggleColor,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  magsafeFilter,
  setMagsafeFilter,
  wirelessFilter,
  setWirelessFilter,
  inStockFilter,
  setInStockFilter,
  resetAll,
  productsCount
}: FilterSidebarProps) {
  // Accordion states
  const [openSections, setOpenSections] = useState({
    device: true,
    caseType: true,
    material: true,
    color: true,
    price: true
  });

  const [showAllDevices, setShowAllDevices] = useState(false);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper classifiers for product counts
  const getProductCaseTypes = (product: any): string[] => {
    const types: string[] = ['All Types'];
    if (product.magsafe) types.push('MagSafe Case');
    if (product.materials.includes('Ultra-Tough Polycarbonate')) {
      types.push('Clear Case');
      types.push('Tough Case');
    }
    if (product.materials.includes('Aramid Carbon Fiber')) {
      types.push('Slim Case');
      types.push('Tough Case');
    }
    if (product.materials.includes('Smooth Liquid Silicone')) {
      types.push('Slim Case');
    }
    if (product.id.includes('wallet') || product.name.toLowerCase().includes('wallet')) {
      types.push('Wallet Case');
    }
    return types;
  };

  const getModelCount = (model: string) => {
    return PRODUCTS.filter(p => p.models.includes(model as any)).length;
  };

  const getCaseTypeCount = (type: string) => {
    return PRODUCTS.filter(p => getProductCaseTypes(p).includes(type)).length;
  };

  const getMaterialCount = (material: CaseMaterial) => {
    return PRODUCTS.filter(p => p.materials.includes(material)).length;
  };

  const handleDeviceChange = (model: string) => {
    setSelectedModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const handleCaseTypeChange = (type: string) => {
    setSelectedCaseTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleMaterialChange = (material: CaseMaterial) => {
    setSelectedMaterials(prev =>
      prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]
    );
  };

  // Filter models list based on input search
  const filteredModels = PHONE_MODELS.filter(m =>
    m.toLowerCase().includes(deviceSearchQuery.toLowerCase())
  );

  const visibleModels = showAllDevices ? filteredModels : filteredModels.slice(0, 5);

  const materialsList: { label: string; value: CaseMaterial }[] = [
    { label: 'Leather', value: 'Premium Pebble Leather' },
    { label: 'Silicone', value: 'Smooth Liquid Silicone' },
    { label: 'Polycarbonate', value: 'Ultra-Tough Polycarbonate' },
    { label: 'Carbon Fiber', value: 'Aramid Carbon Fiber' },
    { label: 'Wheat Fiber', value: 'Bio-Degradable Wheat Fiber' }
  ];

  const caseTypesList = ['Slim Case', 'Tough Case', 'Clear Case', 'Wallet Case', 'MagSafe Case'];

  const hasActiveFilters = 
    searchQuery ||
    selectedModels.length > 0 ||
    selectedCaseTypes.length > 0 ||
    selectedMaterials.length > 0 ||
    selectedColors.length > 0 ||
    minPrice > 20 ||
    maxPrice < 100 ||
    magsafeFilter ||
    wirelessFilter ||
    inStockFilter;

  return (
    <div className="w-full bg-[#11151d] text-white p-6 rounded-3xl border border-neutral-800 shadow-xl font-sans">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <span className="text-lg font-bold tracking-tight">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-xs text-[#a5b4fc] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        
        {/* SECTION 1: DEVICE (Size) Accordion */}
        <div className="border-b border-neutral-800/60 pb-5">
          <button
            onClick={() => toggleSection('device')}
            className="w-full flex items-center justify-between text-sm font-bold tracking-wide uppercase text-neutral-350 hover:text-white transition-colors focus:outline-none"
          >
            <span>Device</span>
            {openSections.device ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {openSections.device && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {/* Device Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search device..."
                  value={deviceSearchQuery}
                  onChange={(e) => setDeviceSearchQuery(e.target.value)}
                  className="w-full bg-[#171c26] border border-neutral-850 text-white rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-[#6366f1] transition-colors placeholder-neutral-500"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Checkboxes List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {visibleModels.map((model) => {
                  const isChecked = selectedModels.includes(model);
                  const count = getModelCount(model);
                  return (
                    <label key={model} className="flex items-center justify-between text-xs text-neutral-300 hover:text-white cursor-pointer select-none">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDeviceChange(model)}
                          className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-[#6366f1] focus:ring-[#6366f1] cursor-pointer"
                        />
                        <span>{model}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">({count})</span>
                    </label>
                  );
                })}

                {filteredModels.length === 0 && (
                  <p className="text-xs text-neutral-500 text-center py-2 font-mono">No devices found</p>
                )}
              </div>

              {/* Show More toggle */}
              {filteredModels.length > 5 && (
                <button
                  onClick={() => setShowAllDevices(!showAllDevices)}
                  className="text-xs font-semibold text-[#a5b4fc] hover:underline hover:text-white cursor-pointer mt-1"
                >
                  {showAllDevices ? 'Show Less' : `+ Show More (${filteredModels.length - 5})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: CASE TYPE Accordion */}
        <div className="border-b border-neutral-800/60 pb-5">
          <button
            onClick={() => toggleSection('caseType')}
            className="w-full flex items-center justify-between text-sm font-bold tracking-wide uppercase text-neutral-350 hover:text-white transition-colors focus:outline-none"
          >
            <span>Case Type</span>
            {openSections.caseType ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openSections.caseType && (
            <div className="mt-4 space-y-2 animate-fade-in">
              {caseTypesList.map((type) => {
                const isChecked = selectedCaseTypes.includes(type);
                const count = getCaseTypeCount(type);
                return (
                  <label key={type} className="flex items-center justify-between text-xs text-neutral-300 hover:text-white cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCaseTypeChange(type)}
                        className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-[#6366f1] focus:ring-[#6366f1] cursor-pointer"
                      />
                      <span>{type}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">({count})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: MATERIAL Accordion */}
        <div className="border-b border-neutral-800/60 pb-5">
          <button
            onClick={() => toggleSection('material')}
            className="w-full flex items-center justify-between text-sm font-bold tracking-wide uppercase text-neutral-350 hover:text-white transition-colors focus:outline-none"
          >
            <span>Material</span>
            {openSections.material ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openSections.material && (
            <div className="mt-4 space-y-2 animate-fade-in">
              {materialsList.map((mat) => {
                const isChecked = selectedMaterials.includes(mat.value);
                const count = getMaterialCount(mat.value);
                return (
                  <label key={mat.value} className="flex items-center justify-between text-xs text-neutral-300 hover:text-white cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleMaterialChange(mat.value)}
                        className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-[#6366f1] focus:ring-[#6366f1] cursor-pointer"
                      />
                      <span>{mat.label}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">({count})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 4: COLOR Accordion */}
        <div className="border-b border-neutral-800/60 pb-5">
          <button
            onClick={() => toggleSection('color')}
            className="w-full flex items-center justify-between text-sm font-bold tracking-wide uppercase text-neutral-350 hover:text-white transition-colors focus:outline-none"
          >
            <span>Color</span>
            {openSections.color ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openSections.color && (
            <div className="mt-4 animate-fade-in">
              <div className="grid grid-cols-5 gap-2.5">
                {COLORS.map((col) => {
                  const isSelected = selectedColors.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => toggleColor(col.id)}
                      title={col.name}
                      className={`w-8 h-8 rounded-full border transition-all cursor-pointer hover:scale-110 flex items-center justify-center ${
                        isSelected 
                          ? 'border-white ring-2 ring-[#a5b4fc]/50 scale-105 shadow-md' 
                          : 'border-neutral-800 hover:border-neutral-500'
                      } ${col.bgClass}`}
                    >
                      {isSelected && (
                        <span className={`w-1.5 h-1.5 rounded-full ${col.textContrast === 'light' ? 'bg-white' : 'bg-black'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: PRICE RANGE Accordion */}
        <div className="border-b border-neutral-800/60 pb-5">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-sm font-bold tracking-wide uppercase text-neutral-350 hover:text-white transition-colors focus:outline-none"
          >
            <span>Price Range</span>
            {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openSections.price && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Range Slider */}
              <div className="px-1">
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full custom-slider"
                />
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-1">
                  <span>Min: $20</span>
                  <span>Max Limit: $100</span>
                </div>
              </div>

              {/* Price Range Input Boxes */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Min</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-bold font-mono">$</span>
                    <input
                      type="number"
                      min="20"
                      max={maxPrice}
                      value={minPrice}
                      onChange={(e) => setMinPrice(Math.max(20, parseInt(e.target.value) || 20))}
                      className="w-full bg-[#171c26] border border-neutral-850 rounded-xl py-2 pl-7 pr-3 text-xs text-white focus:outline-none focus:border-[#6366f1] font-mono"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Max</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-bold font-mono">$</span>
                    <input
                      type="number"
                      min={minPrice}
                      max="100"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.min(100, parseInt(e.target.value) || 100))}
                      className="w-full bg-[#171c26] border border-neutral-850 rounded-xl py-2 pl-7 pr-3 text-xs text-white focus:outline-none focus:border-[#6366f1] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: TOGGLES / SWITCHES */}
        <div className="space-y-4 pt-1">
          {/* Toggle 1: MagSafe */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">MagSafe Compatible</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Filter magnetic accessories</span>
            </div>
            <label className="custom-switch">
              <input
                type="checkbox"
                checked={magsafeFilter}
                onChange={(e) => setMagsafeFilter(e.target.checked)}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          {/* Toggle 2: Wireless Charging */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">Wireless Charging</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Filter Qi charging shells</span>
            </div>
            <label className="custom-switch">
              <input
                type="checkbox"
                checked={wirelessFilter}
                onChange={(e) => setWirelessFilter(e.target.checked)}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          {/* Toggle 3: In Stock Only */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold block">In Stock Only</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Filter available drop-guards</span>
            </div>
            <label className="custom-switch">
              <input
                type="checkbox"
                checked={inStockFilter}
                onChange={(e) => setInStockFilter(e.target.checked)}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>

        {/* SECTION 7: APPLY FILTERS button */}
        <div className="pt-2">
          <button
            onClick={() => {
              // Smooth scroll products list into view on mobile
              const listElement = document.getElementById('phone-case-renderer')?.closest('.lg\\:col-span-3');
              if (listElement) {
                listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="w-full py-3 bg-[#6366f1] hover:bg-[#5558e6] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer hover:shadow-indigo-500/20 active:scale-[0.98]"
          >
            Apply Filters
          </button>
        </div>

      </div>

    </div>
  );
}
