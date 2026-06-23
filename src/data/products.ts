import { Product, PhoneModel, CaseMaterial, CaseColor } from '../types';

export const PHONE_MODELS: PhoneModel[] = [
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15',
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S24+',
  'Google Pixel 8 Pro',
  'Nothing Phone (2)',
  'OnePlus 12',
  'Samsung Galaxy Z Fold 5',
  'Motorola Edge'
];

export const COLORS: CaseColor[] = [
  { id: 'terracotta', name: 'Sienna Terracotta', value: '#C05C46', bgClass: 'bg-[#C05C46]', textContrast: 'light' },
  { id: 'forest', name: 'Verdant Forest', value: '#243D2D', bgClass: 'bg-[#243D2D]', textContrast: 'light' },
  { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
  { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' },
  { id: 'cobalt', name: 'Aegean Cobalt', value: '#213E60', bgClass: 'bg-[#213E60]', textContrast: 'light' },
  { id: 'plum', name: 'Deep Plum', value: '#43263E', bgClass: 'bg-[#43263E]', textContrast: 'light' },
  { id: 'glacier', name: 'Glacier Clear', value: '#DBE9EE', bgClass: 'bg-[#DBE9EE]', textContrast: 'dark' }
];

export const MATERIAL_DETAILS: Record<CaseMaterial, { description: string; pricePremium: number; tag: string }> = {
  'Premium Pebble Leather': {
    description: 'Sourced from gold-rated European tanneries. Soft pebble grain texture that patinas beautifully over time.',
    pricePremium: 15,
    tag: 'Premium'
  },
  'Smooth Liquid Silicone': {
    description: 'Extremely soft-to-touch shell with high-grip oil-resistant coating and soft microfiber fleece lining inside.',
    pricePremium: 0,
    tag: 'Popular'
  },
  'Bio-Degradable Wheat Fiber': {
    description: '100% compostable case formulated with organic wheat straw and bioplastics. Zero carbon footprint.',
    pricePremium: 5,
    tag: 'Eco-Friendly'
  },
  'Ultra-Tough Polycarbonate': {
    description: 'Fully transparent, scratch-resistant polycarbonate back-plate fused with impact-absorbent TPU cushions.',
    pricePremium: 0,
    tag: 'High Protection'
  },
  'Aramid Carbon Fiber': {
    description: 'Woven with genuine Grade-A aramid fiber. Aerospace-grade strength, extreme thinness, matte weave pattern.',
    pricePremium: 25,
    tag: 'Aerospace Class'
  }
};

export const PRODUCTS: Product[] = [
  {
    id: 'sienna-leather',
    name: 'Atelier pebble grain leather MagSafe case',
    description: 'Exquisite French full-grain pebbled leather wrapped snugly around a hard drop-shell. Over time, it gains a deep, personalized patina unique to your touch.',
    basePrice: 49,
    rating: 4.9,
    reviewsCount: 164,
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra'],
    materials: ['Premium Pebble Leather'],
    colors: [
      { id: 'terracotta', name: 'Sienna Terracotta', value: '#C05C46', bgClass: 'bg-[#C05C46]', textContrast: 'light' },
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
      { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' }
    ],
    image: 'leather',
    tags: ['MagSafe', 'Pebble Leather'],
    features: ['10ft Drop Protection', 'MagSafe Compatible', 'Italian Suede Interior Lining', 'Machined Aluminum Button Covers'],
    magsafe: true,
    bestseller: true
  },
  {
    id: 'bio-wheat',
    name: 'Terra bio-degradable wheat shell',
    description: 'An earth-first shielding case that will leave zero toxic trace. Crafted entirely from renewable wheat fiber and plant starches, maintaining a rugged and organic eggshell feel.',
    basePrice: 34,
    rating: 4.7,
    reviewsCount: 89,
    models: ['iPhone 15 Pro', 'iPhone 15', 'Samsung Galaxy S24+', 'Google Pixel 8 Pro', 'Nothing Phone (2)', 'OnePlus 12', 'Motorola Edge'],
    materials: ['Bio-Degradable Wheat Fiber'],
    colors: [
      { id: 'forest', name: 'Verdant Forest', value: '#243D2D', bgClass: 'bg-[#243D2D]', textContrast: 'light' },
      { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' }
    ],
    image: 'wheat',
    tags: ['100% Compostable', 'Eco-Conscious'],
    features: ['Biodegradable Material', '8ft Cushion Protection', 'Earth-tone Tactile Finish', 'Anti-Microbial Properties'],
    magsafe: false,
    ecoFriendly: true
  },
  {
    id: 'crystal-poly',
    name: 'Glacier optical-clear shock proof shield',
    description: 'Let your device design express itself. Engineered with high-index optical polycarbonate and an advanced UV-absorbing compound preventing the classic yellow hue.',
    basePrice: 39,
    rating: 4.6,
    reviewsCount: 194,
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24+', 'Google Pixel 8 Pro', 'Nothing Phone (2)', 'OnePlus 12', 'Samsung Galaxy Z Fold 5', 'Motorola Edge'],
    materials: ['Ultra-Tough Polycarbonate'],
    colors: [
      { id: 'glacier', name: 'Glacier Clear', value: '#DBE9EE', bgClass: 'bg-[#DBE9EE]', textContrast: 'dark' }
    ],
    image: 'clear',
    tags: ['Anti-Yellowing', 'Crystal Clear'],
    features: ['Advanced UV Guard Tech', 'Corner Anti-shock Airbags', 'High Scratch Resistance (4H Hardness)', 'Symmetric MagSafe Alignment Ring'],
    magsafe: true
  },
  {
    id: 'liquid-silicone',
    name: 'Nimbus matte liquid silicone case',
    description: 'The epitome of daily comfort. Form-fitting liquid silicone with a dust-resistant matte skin, wrapping around a robust 3-tier polycarbonate shell.',
    basePrice: 29,
    rating: 4.8,
    reviewsCount: 312,
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24+', 'Google Pixel 8 Pro', 'Nothing Phone (2)', 'OnePlus 12', 'Samsung Galaxy Z Fold 5', 'Motorola Edge'],
    materials: ['Smooth Liquid Silicone'],
    colors: [
      { id: 'terracotta', name: 'Sienna Terracotta', value: '#C05C46', bgClass: 'bg-[#C05C46]', textContrast: 'light' },
      { id: 'forest', name: 'Verdant Forest', value: '#243D2D', bgClass: 'bg-[#243D2D]', textContrast: 'light' },
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
      { id: 'cobalt', name: 'Aegean Cobalt', value: '#213E60', bgClass: 'bg-[#213E60]', textContrast: 'light' },
      { id: 'plum', name: 'Deep Plum', value: '#43263E', bgClass: 'bg-[#43263E]', textContrast: 'light' }
    ],
    image: 'silicone',
    tags: ['Super Grip', 'Best Value'],
    features: ['Inner Dense Microfiber Protection', 'Qi Wireless & MagSafe Compatible', 'Dust & Lint Proof Nano Coating', 'Tactile Edge Over-molds'],
    magsafe: true,
    bestseller: true
  },
  {
    id: 'stealth-aramid',
    name: 'Aether ultra-thin aramid weave case',
    description: 'The ultimate case for minimalists who despise bulk. Constructed with genuine synthetic fibers 5 times stronger than steel but as light as a feather.',
    basePrice: 59,
    rating: 4.9,
    reviewsCount: 145,
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra', 'Nothing Phone (2)', 'OnePlus 12'],
    materials: ['Aramid Carbon Fiber'],
    colors: [
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' }
    ],
    image: 'carbon',
    tags: ['0.8mm Profile', 'Indestructible'],
    features: ['Bulletproof Kevlar Aramid Fiber', 'Impossibly Thin (0.85mm)', 'MagSafe Coil Imbedded', 'Raised Camera Ring for Guarding Optics'],
    magsafe: true
  },
  {
    id: 'minimalist-wallet',
    name: 'Vanguard card sleeve MagSafe case',
    description: 'A structural, clean 2-in-1 setup. Combines the luxurious matte liquid silicone skin with a built-in stitched card compartment for an absolute card-carrying ease.',
    basePrice: 45,
    rating: 4.8,
    reviewsCount: 201,
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra'],
    materials: ['Smooth Liquid Silicone'],
    colors: [
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
      { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' }
    ],
    image: 'wallet',
    tags: ['Card Vault', 'MagSafe Secure'],
    features: ['2-Card Blind Sleeve Shielding', 'Secure Tap-to-Pay Compatible', 'Fleece Guarded Outer Layer', 'Drop Corner Fortification'],
    magsafe: true
  }
];
