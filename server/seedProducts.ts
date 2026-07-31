export const DEFAULT_PRODUCTS_SEED = [
  {
    id: 'sienna-leather',
    name: 'Atelier pebble grain leather MagSafe case',
    description: 'Exquisite French full-grain pebbled leather wrapped snugly around a hard drop-shell. Over time, it gains a deep, personalized patina unique to your touch.',
    price: 3999,
    stock: 50,
    category: 'leather',
    rating: 4.9,
    reviews_count: 164,
    image_url: 'leather',
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra'],
    materials: ['Premium Pebble Leather'],
    colors: [
      { id: 'terracotta', name: 'Sienna Terracotta', value: '#C05C46', bgClass: 'bg-[#C05C46]', textContrast: 'light' },
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
      { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' }
    ],
    tags: ['MagSafe', 'Pebble Leather'],
    features: ['10ft Drop Protection', 'MagSafe Compatible', 'Italian Suede Interior Lining', 'Machined Aluminum Button Covers'],
    magsafe: 1,
    bestseller: 1,
    eco_friendly: 0
  },
  {
    id: 'bio-wheat',
    name: 'Terra bio-degradable wheat shell',
    description: 'An earth-first shielding case that will leave zero toxic trace. Crafted entirely from renewable wheat fiber and plant starches, maintaining a rugged and organic eggshell feel.',
    price: 2799,
    stock: 80,
    category: 'eco',
    rating: 4.7,
    reviews_count: 89,
    image_url: 'wheat',
    models: ['iPhone 15 Pro', 'iPhone 15', 'Samsung Galaxy S24+', 'Google Pixel 8 Pro', 'Nothing Phone (2)', 'OnePlus 12', 'Motorola Edge'],
    materials: ['Bio-Degradable Wheat Fiber'],
    colors: [
      { id: 'forest', name: 'Verdant Forest', value: '#243D2D', bgClass: 'bg-[#243D2D]', textContrast: 'light' },
      { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' }
    ],
    tags: ['100% Compostable', 'Eco-Conscious'],
    features: ['Biodegradable Material', '8ft Cushion Protection', 'Earth-tone Tactile Finish', 'Anti-Microbial Properties'],
    magsafe: 0,
    bestseller: 0,
    eco_friendly: 1
  },
  {
    id: 'crystal-poly',
    name: 'Glacier optical-clear shock proof shield',
    description: 'Let your device design express itself. Engineered with high-index optical polycarbonate and an advanced UV-absorbing compound preventing the classic yellow hue.',
    price: 3199,
    stock: 120,
    category: 'clear',
    rating: 4.6,
    reviews_count: 194,
    image_url: 'clear',
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24+', 'Google Pixel 8 Pro', 'Nothing Phone (2)', 'OnePlus 12', 'Samsung Galaxy Z Fold 5', 'Motorola Edge'],
    materials: ['Ultra-Tough Polycarbonate'],
    colors: [
      { id: 'glacier', name: 'Glacier Clear', value: '#DBE9EE', bgClass: 'bg-[#DBE9EE]', textContrast: 'dark' }
    ],
    tags: ['Anti-Yellowing', 'Crystal Clear'],
    features: ['Advanced UV Guard Tech', 'Corner Anti-shock Airbags', 'High Scratch Resistance (4H Hardness)', 'Symmetric MagSafe Alignment Ring'],
    magsafe: 1,
    bestseller: 0,
    eco_friendly: 0
  },
  {
    id: 'liquid-silicone',
    name: 'Nimbus matte liquid silicone case',
    description: 'The epitome of daily comfort. Form-fitting liquid silicone with a dust-resistant matte skin, wrapping around a robust 3-tier polycarbonate shell.',
    price: 2399,
    stock: 200,
    category: 'silicone',
    rating: 4.8,
    reviews_count: 312,
    image_url: 'silicone',
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24+', 'Google Pixel 8 Pro', 'Nothing Phone (2)', 'OnePlus 12', 'Samsung Galaxy Z Fold 5', 'Motorola Edge'],
    materials: ['Smooth Liquid Silicone'],
    colors: [
      { id: 'terracotta', name: 'Sienna Terracotta', value: '#C05C46', bgClass: 'bg-[#C05C46]', textContrast: 'light' },
      { id: 'forest', name: 'Verdant Forest', value: '#243D2D', bgClass: 'bg-[#243D2D]', textContrast: 'light' },
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
      { id: 'cobalt', name: 'Aegean Cobalt', value: '#213E60', bgClass: 'bg-[#213E60]', textContrast: 'light' },
      { id: 'plum', name: 'Deep Plum', value: '#43263E', bgClass: 'bg-[#43263E]', textContrast: 'light' }
    ],
    tags: ['Super Grip', 'Best Value'],
    features: ['Inner Dense Microfiber Protection', 'Qi Wireless & MagSafe Compatible', 'Dust & Lint Proof Nano Coating', 'Tactile Edge Over-molds'],
    magsafe: 1,
    bestseller: 1,
    eco_friendly: 0
  },
  {
    id: 'stealth-aramid',
    name: 'Aether ultra-thin aramid weave case',
    description: 'The ultimate case for minimalists who despise bulk. Constructed with genuine synthetic fibers 5 times stronger than steel but as light as a feather.',
    price: 4999,
    stock: 30,
    category: 'armor',
    rating: 4.9,
    reviews_count: 145,
    image_url: 'carbon',
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra', 'Nothing Phone (2)', 'OnePlus 12'],
    materials: ['Aramid Carbon Fiber'],
    colors: [
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' }
    ],
    tags: ['0.8mm Profile', 'Indestructible'],
    features: ['Bulletproof Kevlar Aramid Fiber', 'Impossibly Thin (0.85mm)', 'MagSafe Coil Imbedded', 'Raised Camera Ring for Guarding Optics'],
    magsafe: 1,
    bestseller: 0,
    eco_friendly: 0
  },
  {
    id: 'minimalist-wallet',
    name: 'Vanguard card sleeve MagSafe case',
    description: 'A structural, clean 2-in-1 setup. Combines the luxurious matte liquid silicone skin with a built-in stitched card compartment for an absolute card-carrying ease.',
    price: 3699,
    stock: 75,
    category: 'wallet',
    rating: 4.8,
    reviews_count: 201,
    image_url: 'wallet',
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra'],
    materials: ['Smooth Liquid Silicone'],
    colors: [
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
      { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' }
    ],
    tags: ['Card Vault', 'MagSafe Secure'],
    features: ['2-Card Blind Sleeve Shielding', 'Secure Tap-to-Pay Compatible', 'Fleece Guarded Outer Layer', 'Drop Corner Fortification'],
    magsafe: 1,
    bestseller: 0,
    eco_friendly: 0
  }
];

export async function seedNeonDatabaseIfEmpty(db: any, force = false): Promise<boolean> {
  try {
    const countRes = await db.query('SELECT COUNT(*) as count FROM products');
    const count = Number(countRes.rows[0]?.count || 0);
    if (count > 0 && !force) {
      console.log('[POSTGRES] Neon database already contains', count, 'products. Skipping auto-seed.');
      return false;
    }

    console.log('[POSTGRES] Seeding Neon database with default luxury catalog...');
    for (const p of DEFAULT_PRODUCTS_SEED) {
      const modelsJson = JSON.stringify(p.models);
      const materialsJson = JSON.stringify(p.materials);
      const colorsJson = JSON.stringify(p.colors);
      const tagsJson = JSON.stringify(p.tags);
      const featuresJson = JSON.stringify(p.features);

      await db.query(`
        INSERT INTO products (
          id, name, description, price, stock, category, image_data, image_url,
          rating, reviews_count, models, materials, colors, tags, features,
          magsafe, bestseller, eco_friendly
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          stock = EXCLUDED.stock,
          category = EXCLUDED.category,
          image_url = EXCLUDED.image_url,
          models = EXCLUDED.models,
          materials = EXCLUDED.materials,
          colors = EXCLUDED.colors,
          tags = EXCLUDED.tags,
          features = EXCLUDED.features,
          magsafe = EXCLUDED.magsafe,
          bestseller = EXCLUDED.bestseller,
          eco_friendly = EXCLUDED.eco_friendly
      `, [
        p.id, p.name, p.description, p.price, p.stock, p.category, '', p.image_url,
        p.rating, p.reviews_count, modelsJson, materialsJson, colorsJson, tagsJson, featuresJson,
        p.magsafe, p.bestseller, p.eco_friendly
      ]);
    }

    console.log('[POSTGRES] Successfully seeded default products into Neon database.');
    return true;
  } catch (error) {
    console.error('[POSTGRES] Failed to seed Neon database:', error);
    return false;
  }
}
