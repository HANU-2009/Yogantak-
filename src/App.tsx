import { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Order, PhoneModel, CaseMaterial, CaseColor } from './types';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from './components/Navbar';
import BentoHeroSection from './components/BentoHeroSection';
import FilterSidebar from './components/FilterSidebar';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import ProductVisualizer from './components/ProductVisualizer';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrdersList from './components/OrdersList';
import ScrollVideoHeader from './components/ScrollVideoHeader';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import ReturnsPolicy from './components/ReturnsPolicy';
import CancellationRefund from './components/CancellationRefund';
import ShippingExchange from './components/ShippingExchange';
import { Sparkles, HelpCircle, ShieldAlert, BadgeCheck, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Cases' },
  { id: 'magsafe', label: 'MagSafe' },
  { id: 'clear', label: 'Clear' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'leather', label: 'Leather' },
  { id: 'rugged', label: 'Rugged' },
  { id: 'designer', label: 'Designer' }
];

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

export default function App() {
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'catalog' | 'lab' | 'orders' | 'about' | 'contact' | 'privacy' | 'terms' | 'returns'>('catalog');
  
  // Products, Auth, and Admin states
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('yogantak_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // Listen to Firebase Auth state change and sync to server
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('yogantak_token', idToken);
          
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setToken(null);
            setUser(null);
            localStorage.removeItem('yogantak_token');
          }
        } catch (err) {
          console.error('Error syncing auth state:', err);
          setToken(null);
          setUser(null);
          localStorage.removeItem('yogantak_token');
        }
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('yogantak_token');
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle SEO Metadata when tab changes
  useEffect(() => {
    let title = "Yogantak | Premium Phone Cases";
    let metaDesc = "Discover bespoke, highly durable premium phone cases at Yogantak. Meticulous casing shells built on durability and tactile beauty.";
    
    switch (activeTab) {
      case 'about':
        title = "About Us | Yogantak";
        metaDesc = "Learn about Yogantak's mission, values, and our commitment to premium sustainable phone cases.";
        break;
      case 'contact':
        title = "Contact Us | Yogantak";
        metaDesc = "Get in touch with the Yogantak concierge team for support, bespoke orders, and general inquiries.";
        break;
      case 'privacy':
        title = "Privacy Policy | Yogantak";
        metaDesc = "Read our Privacy Policy to understand how we securely collect, use, and handle your data in compliance with Indian laws.";
        break;
      case 'terms':
        title = "Terms & Conditions | Yogantak";
        metaDesc = "Our terms and conditions outlining website use, secure payments, and liability.";
        break;
      case 'returns':
        title = "Returns & Refunds Policy | Yogantak";
        metaDesc = "Learn about our 7-day hassle-free return and refund policy for premium phone cases.";
        break;
      case 'catalog':
        title = "Catalog | Yogantak Premium Cases";
        break;
      case 'lab':
        title = "Personalization Lab | Yogantak";
        break;
    }
    
    document.title = title;
    let metaTag = document.querySelector('meta[name="description"]');
    if (metaTag) {
      metaTag.setAttribute('content', metaDesc);
    } else {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'description');
      metaTag.setAttribute('content', metaDesc);
      document.head.appendChild(metaTag);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products from database — no static fallback; admin adds products via dashboard
  useEffect(() => {
    setProductsLoading(true);
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Error fetching products from database:', err);
        setProducts([]);
      })
      .finally(() => setProductsLoading(false));
  }, []);


  // Fetch wishlists and cart sync when logged in
  useEffect(() => {
    if (user && token) {
      // Wishlist sync
      fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSavedProductIds(data);
        })
        .catch(err => console.error(err));

      // Orders sync
      fetch('/api/orders/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrders(data);
        })
        .catch(err => console.error(err));
    }
  }, [user, token]);

  // Cart, Orders & Wishlist (with LocalStorage & API synchronizations)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('corecase_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('corecase_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('corecase_saved');
    return saved ? JSON.parse(saved) : ['sienna-leather', 'liquid-silicone']; // defaults
  });

  // Slide drawers & modals visibility
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [activeDetailsProduct, setActiveDetailsProduct] = useState<Product | null>(null);

  // Loaded presets inside Detail Modals
  const [chosenDetailModel, setChosenDetailModel] = useState<PhoneModel>('iPhone 15 Pro Max');
  const [chosenDetailColor, setChosenDetailColor] = useState<CaseColor>({ id: 'default', name: 'Default', value: '#111827', bgClass: 'bg-gray-900', textContrast: 'light' });
  const [chosenDetailMaterial, setChosenDetailMaterial] = useState<CaseMaterial>('Premium Pebble Leather');

  // Personalization Lab Preset Arguments
  const [labPreset, setLabPreset] = useState<{
    product: Product;
    model: PhoneModel;
    color: CaseColor;
    material: CaseMaterial;
  } | undefined>(undefined);

  // Filter Systems State coordinates
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedCaseTypes, setSelectedCaseTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<CaseMaterial[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [magsafeFilter, setMagsafeFilter] = useState<boolean>(false);
  const [wirelessFilter, setWirelessFilter] = useState<boolean>(false);
  const [inStockFilter, setInStockFilter] = useState<boolean>(false);

  // Category & Layout states
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [gridView, setGridView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 6;


  // Ref container for catalog scroll target jumping
  const catalogRef = useRef<HTMLDivElement>(null);

  // Save changes to LocalStorage and API reactive loops
  useEffect(() => {
    localStorage.setItem('corecase_cart', JSON.stringify(cart));
    if (user && token) {
      fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: cart })
      }).catch(err => console.error('Failed to sync cart to database:', err));
    }
  }, [cart, user, token]);

  useEffect(() => {
    localStorage.setItem('corecase_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('corecase_saved', JSON.stringify(savedProductIds));
  }, [savedProductIds]);

  // Wishlisting triggers
  const handleToggleSaved = (productId: string) => {
    const isSaved = savedProductIds.includes(productId);
    setSavedProductIds((prev) => 
      isSaved 
        ? prev.filter(p => p !== productId) 
        : [...prev, productId]
    );

    if (user && token) {
      const url = isSaved ? `/api/wishlist/${productId}` : '/api/wishlist';
      const method = isSaved ? 'DELETE' : 'POST';
      fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: isSaved ? undefined : JSON.stringify({ productId })
      }).catch(err => console.error('Failed to sync wishlist to database:', err));
    }
  };

  // Color selection helper
  const toggleColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId)
        ? prev.filter((c) => c !== colorId)
        : [...prev, colorId]
    );
  };

  // Filter list of cases using the criteria (simplified for flat product schema)
  const getFilteredProducts = () => {
    let filtered = [...products];

    // Search query matching
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    // Category filter (using product.category field)
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p =>
        (p.category || '').toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    // In Stock filter
    if (inStockFilter) {
      filtered = filtered.filter(p => (p.stock ?? 0) > 0);
    }

    // Price range filtering
    filtered = filtered.filter(p => (p.price ?? p.basePrice ?? 0) >= minPrice && (p.price ?? p.basePrice ?? 0) <= maxPrice);

    // Sorting
    const getPrice = (p: Product) => p.price ?? p.basePrice ?? 0;
    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating ?? 5) - (a.rating ?? 5));
    }

    return filtered;
  };

  // Clean form coordinates resetting
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedModels([]);
    setSelectedCaseTypes([]);
    setSelectedMaterials([]);
    setSelectedColors([]);
    setMinPrice(0);
    setMaxPrice(10000);
    setSortBy('featured');
    setMagsafeFilter(false);
    setWirelessFilter(false);
    setInStockFilter(false);
    setActiveCategory('all');
    setCurrentPage(1);
  };

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setCurrentPage(1);
    
    // Set appropriate sidebar filters when top categories are clicked
    if (catId === 'all') {
      setSelectedMaterials([]);
      setSelectedCaseTypes([]);
      setMagsafeFilter(false);
    } else if (catId === 'magsafe') {
      setSelectedCaseTypes(['MagSafe Case']);
      setMagsafeFilter(true);
    } else if (catId === 'clear') {
      setSelectedMaterials(['Ultra-Tough Polycarbonate']);
    } else if (catId === 'wallet') {
      setSelectedCaseTypes(['Wallet Case']);
    } else if (catId === 'rugged') {
      setSelectedMaterials(['Aramid Carbon Fiber']);
    } else if (catId === 'designer') {
      setSelectedMaterials(['Bio-Degradable Wheat Fiber']);
    }
  };

  // Pagination helpers
  const totalPages = Math.ceil(getFilteredProducts().length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const getCurrentPageProducts = () => {
    return getFilteredProducts().slice(startIndex, endIndex);
  };


  // Add product to shopping cart
  const handleAddToCart = (product: Product, quantity: number, model: PhoneModel, color: CaseColor, material: CaseMaterial) => {
    setCart((prev) => {
      const uniqueItemId = `${product.id}-${(model || 'default').replace(/\s+/g, '')}-${(material || 'default').replace(/\s+/g, '')}-${color?.id || 'default'}`;

      const existingIdx = prev.findIndex(item => item.id === uniqueItemId);

      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      } else {
        const newItem: CartItem = {
          id: uniqueItemId,
          product,
          quantity,
          selectedModel: model,
          selectedMaterial: material,
          selectedColor: color,
          price: product.price ?? product.basePrice ?? 0
        };
        return [...prev, newItem];
      }
    });

    setIsCartOpen(true);
  };

  // Quick additive handler for the catalog listings cards
  const handleQuickAdd = (product: Product, model: PhoneModel, color: CaseColor, material: CaseMaterial) => {
    handleAddToCart(product, 1, model, color, material);
  };

  // Direct custom bespoke visualizer items handler
  const handleAddCustomCase = (config: any, price: number) => {
    setCart((prev) => {
      // Create a bespoke product representation under global standards
      const customProductPlaceholder: Product = {
        id: `bespoke-${Date.now()}`,
        name: `Bespoke Engraved Case Studio`,
        description: `Bespoke tailored ${config.material} matching case built inside the Personalization Laboratory. Featuring dynamic initial engravings inside secure hot stamp foil.`,
        price: price,
        basePrice: price,
        stock: 999,
        rating: 5.0,
        reviewsCount: 1,
        models: [config.model],
        materials: [config.material],
        colors: [config.color],
        image: 'custom',
        tags: ['Studio Handcrafted', 'Personalized'],
        features: ['Precision laser monogramming', 'MagSafe enabled', 'Anodized Button caps'],
        magsafe: config.magsafe
      };

      const monogramHash = config.monogramText ? `-${config.monogramText}-${config.monogramColor}` : '';
      const uniqueItemId = `custom-${config.model.replace(/\s+/g, '')}-${config.material.replace(/\s+/g, '')}-${config.color.id}${monogramHash}-${config.buttonColor}`;

      const existingIdx = prev.findIndex(item => item.id === uniqueItemId);

      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      } else {
        const newItem: CartItem = {
          id: uniqueItemId,
          product: customProductPlaceholder,
          quantity: 1,
          selectedModel: config.model,
          selectedMaterial: config.material,
          selectedColor: config.color,
          customConfig: config,
          price: price
        };
        return [...prev, newItem];
      }
    });
  };

  // Quantities adjusters
  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
    } else {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    }
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Checkout transitions
  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderConfirmed = (finalOrder: Order) => {
    setOrders(prev => [finalOrder, ...prev]);
    setCart([]); // purge cart upon authorization clearance
    setTimeout(() => {
      setActiveTab('orders'); // Jump directly to logistics view!
    }, 1000);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
  };

  // Quick navigation routing modifiers
  const handleSetupLabPreset = (product: Product, model: PhoneModel, color: CaseColor, material: CaseMaterial) => {
    setLabPreset({
      product,
      model,
      color,
      material
    });
    setActiveTab('lab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToCatalog = () => {
    setActiveTab('catalog');
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleScrollPastVideo = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  const handleOpenDetails = (product: Product, model: PhoneModel, color: CaseColor, material: CaseMaterial) => {
    setChosenDetailModel(model);
    setChosenDetailColor(color);
    setChosenDetailMaterial(material);
    setActiveDetailsProduct(product);
  };

  if (isAdminView) {
    return <AdminDashboard token={token} onClose={() => setIsAdminView(false)} />;
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-[#f4f5f1] font-sans antialiased text-neutral-900 relative overflow-x-hidden"
    >
      
      {/* Primary header navbar controls */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        savedCount={savedProductIds.length}
        user={user}
        onAccountClick={() => setIsAuthModalOpen(true)}
      />

      {/* Bento Box Hero Display - Only active under core Catalog overview */}
      {activeTab === 'catalog' && (
        <BentoHeroSection
          onExploreClick={handleScrollToCatalog}
          onStudioClick={() => {
            setLabPreset(undefined);
            setActiveTab('lab');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Main Content Sections */}
      <main className="flex-grow">
        
        {/* TAB 1: CURATED GALLERY GRID */}
        {activeTab === 'catalog' && (
          <div ref={catalogRef} className="bg-transparent text-[#e4e2e4] py-12 border-t border-neutral-900/60 scroll-mt-28 md:scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Title Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-neutral-200 pb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-neutral-900 headline-lg">
                    Mobile Cases
                  </h1>
                  <p className="text-neutral-500 text-sm mt-1.5 font-medium">
                    Style meets protection. Find the perfect case for your device.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-500 shrink-0">
                  <span className="font-bold text-neutral-900">{getFilteredProducts().length} Products</span>
                  <div className="h-4 w-px bg-neutral-300" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-bold">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-neutral-200 text-neutral-900 rounded-full px-4 py-1.5 font-bold focus:outline-none focus:border-neutral-400 cursor-pointer text-xs shadow-sm"
                    >
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Popularity</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Pills Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-neutral-200">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-900/85 backdrop-blur-sm text-white shadow-md'
                          : 'bg-white/70 backdrop-blur-sm border border-neutral-200/50 text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 shadow-sm'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Main Content: Full-width Product Grid */}
              <div className="flex flex-col gap-8">
                  {/* Grid header row */}
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      {getFilteredProducts().length} products found
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setGridView('grid')} 
                        className={`p-1.5 rounded transition-all cursor-pointer ${gridView === 'grid' ? 'bg-neutral-100/70 backdrop-blur-sm text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-900'}`}
                        title="Grid View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      </button>
                      <button 
                        onClick={() => setGridView('list')} 
                        className={`p-1.5 rounded transition-all cursor-pointer ${gridView === 'list' ? 'bg-neutral-100/70 backdrop-blur-sm text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-900'}`}
                        title="List View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Grid / List of products */}
                  {productsLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4 text-neutral-400">
                      <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                      <p className="text-sm font-bold">Loading catalog...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="bg-white border border-neutral-200 rounded-[2rem] py-24 text-center space-y-4 shadow-sm">
                      <svg className="w-14 h-14 text-neutral-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <div className="space-y-1.5">
                        <h3 className="text-base font-extrabold tracking-tight text-neutral-900">No Products Yet</h3>
                        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                          The catalog is empty. Log in as admin to add products.
                        </p>
                      </div>
                    </div>
                  ) : getFilteredProducts().length === 0 ? (
                    <div className="bg-white border border-neutral-200 rounded-[2rem] py-24 text-center space-y-4 shadow-sm">
                      <Sliders className="w-10 h-10 text-neutral-300 mx-auto" />
                      <div className="space-y-1.5">
                        <h3 className="text-base font-extrabold tracking-tight text-neutral-900">No matching cases found</h3>
                        <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                          Ease your filter constraints or reset preferences to discover our core collection.
                        </p>
                      </div>
                      <button
                        onClick={handleResetFilters}
                        className="px-6 py-3 bg-[#cfff71]/80 backdrop-blur-sm text-neutral-900 hover:bg-[#cfff71] text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className={gridView === 'grid'
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                      : "flex flex-col gap-4"
                    }>
                      {getCurrentPageProducts().map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isSaved={savedProductIds.includes(product.id)}
                          onToggleSaved={handleToggleSaved}
                          onOpenDetails={handleOpenDetails}
                          onCustomizeClick={handleSetupLabPreset}
                          onQuickAdd={handleQuickAdd}
                        />
                      ))}
                    </div>
                  )}


                  {/* Pagination control */}
                  {getFilteredProducts().length > productsPerPage && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200 pt-6 mt-4">
                      <span className="text-xs text-neutral-500 font-bold">
                        Showing {startIndex + 1}-{Math.min(endIndex, getFilteredProducts().length)} of {getFilteredProducts().length} products
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1));
                            window.scrollTo({ top: catalogRef.current?.offsetTop || 0, behavior: 'smooth' });
                          }}
                          className="p-2 border border-neutral-200 bg-white rounded-lg hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          const isCurrent = currentPage === pageNum;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                setCurrentPage(pageNum);
                                window.scrollTo({ top: catalogRef.current?.offsetTop || 0, behavior: 'smooth' });
                              }}
                              className={`w-9 h-9 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-neutral-900/85 backdrop-blur-sm border-neutral-900 text-white shadow-sm shadow-neutral-900/20'
                                  : 'bg-white/70 backdrop-blur-sm border-neutral-200/50 text-neutral-600 hover:bg-white hover:text-neutral-900 shadow-sm'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => {
                            setCurrentPage(prev => Math.min(totalPages, prev + 1));
                            window.scrollTo({ top: catalogRef.current?.offsetTop || 0, behavior: 'smooth' });
                          }}
                          className="p-2 border border-neutral-200 bg-white rounded-lg hover:bg-neutral-50 text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              {/* Bottom Features Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 border-t border-neutral-200 pt-12">
                {[
                  { title: 'Free Shipping', desc: 'On orders over $50', icon: '🚚' },
                  { title: '30-Day Returns', desc: 'Hassle-free returns', icon: '🔄' },
                  { title: 'Secure Payment', desc: '100% secure checkout', icon: '🔒' },
                  { title: '24/7 Support', desc: "We're here to help", icon: '📞' }
                ].map((feat) => (
                  <div key={feat.title} className="bg-white border border-neutral-200 rounded-[1.5rem] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-3xl leading-none">{feat.icon}</span>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm leading-tight">{feat.title}</h4>
                      <p className="text-neutral-500 text-xs mt-1 leading-normal">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE CUSTOMIZER LABORATORY */}
        {activeTab === 'lab' && (
          <ProductVisualizer
            onAddCustomCase={handleAddCustomCase}
            initialPreset={labPreset}
          />
        )}

        {/* TAB 3: LOGISTICS HISTORY / ORDER TRACKING */}
        {activeTab === 'orders' && (
          <OrdersList orders={orders} onCancelOrder={handleCancelOrder} />
        )}

        {/* TAB 4: ABOUT US */}
        {activeTab === 'about' && <AboutUs />}

        {/* TAB 5: CONTACT US */}
        {activeTab === 'contact' && <ContactUs />}

        {/* TAB 6: PRIVACY POLICY */}
        {activeTab === 'privacy' && <PrivacyPolicy />}

        {/* TAB 7: TERMS & CONDITIONS */}
        {activeTab === 'terms' && <TermsConditions />}

        {/* TAB 8: RETURNS POLICY */}
        {activeTab === 'returns' && <ReturnsPolicy />}

        {/* TAB 9: CANCELLATION & REFUND */}
        {activeTab === 'cancellation' && <CancellationRefund />}

        {/* TAB 10: SHIPPING & EXCHANGE */}
        {activeTab === 'shipping' && <ShippingExchange />}

      </main>

      {/* Persistent global modular slide-overs and checkout containers */}
      
      {/* 1. Sliding Shopping cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleProceedToCheckout}
      />

      {/* 2. Step-by-step secure Payment checkout popover portal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onOrderConfirmed={handleOrderConfirmed}
        user={user}
      />

      {/* 3. Product Details informative layout screen drawer */}
      <ProductDetailsModal
        product={activeDetailsProduct}
        chosenModel={chosenDetailModel}
        chosenColor={chosenDetailColor}
        chosenMaterial={chosenDetailMaterial}
        isOpen={activeDetailsProduct !== null}
        onClose={() => setActiveDetailsProduct(null)}
        onAddToCart={handleAddToCart}
        onToggleSaved={handleToggleSaved}
        isSaved={activeDetailsProduct ? savedProductIds.includes(activeDetailsProduct.id) : false}
      />

      {/* Elegant aesthetic bottom footnote */}
      <footer className="bg-white text-neutral-600 py-16 border-t border-neutral-200 mt-16 font-sans text-[13px] rounded-t-[3rem] shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-3">
            <span className="font-sans text-xl font-black tracking-tight text-neutral-900 block italic">YOGANTAK.</span>
            <p className="text-neutral-500 leading-relaxed font-sans text-xs">
              Meticulous casing shells built on durability, tactile beauty, and eco-sustainable accountability. Protecting global devices with certified military drop-guards of absolute elite form-factors.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-neutral-900 font-bold block uppercase tracking-wider text-xs">SECURE LOGISTICS</span>
            <div className="flex flex-col gap-1 text-neutral-500 text-xs">
              <span>PCI-DSS direct security certified</span>
              <span>AES-256 Bit double handshakes active</span>
              <span>Complimentary expedited shipping worldwide</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-neutral-900 font-bold block uppercase tracking-wider text-xs">CLIENT RELATIONS</span>
            <div className="flex flex-col gap-1 text-neutral-500 text-xs">
              <span>Email: concierge@yogantak.com</span>
              <span>Support Desk: 1-800-YOGANTAK</span>
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 font-bold text-[11px]">
                <button onClick={() => setActiveTab('about')} className="hover:text-neutral-900 transition-colors cursor-pointer">About Us</button>
                <button onClick={() => setActiveTab('contact')} className="hover:text-neutral-900 transition-colors cursor-pointer">Contact Us</button>
                <button onClick={() => setActiveTab('terms')} className="hover:text-neutral-900 transition-colors cursor-pointer">Terms & Conditions</button>
                <button onClick={() => setActiveTab('privacy')} className="hover:text-neutral-900 transition-colors cursor-pointer">Privacy Policy</button>
                <button onClick={() => setActiveTab('cancellation')} className="hover:text-neutral-900 transition-colors cursor-pointer">Cancellation & Refund</button>
                <button onClick={() => setActiveTab('shipping')} className="hover:text-neutral-900 transition-colors cursor-pointer">Shipping & Exchange</button>
                <button onClick={() => setActiveTab('returns')} className="hover:text-neutral-900 transition-colors cursor-pointer">Returns Policy</button>
              </div>
              <span className="mt-2 text-neutral-400 text-xs">Designed in minimalist creative workspaces. All rights reserved. • 2026</span>
            </div>
          </div>

        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        setUser={setUser}
        token={token}
        setToken={setToken}
        setCart={setCart}
        onOpenAdmin={() => setIsAdminView(true)}
      />

    </div>
  );
}
