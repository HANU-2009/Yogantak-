export type PhoneModel = 
  | 'iPhone 15 Pro Max' 
  | 'iPhone 15 Pro' 
  | 'iPhone 15' 
  | 'Samsung Galaxy S24 Ultra' 
  | 'Samsung Galaxy S24+' 
  | 'Google Pixel 8 Pro'
  | 'Nothing Phone (2)'
  | 'OnePlus 12'
  | 'Samsung Galaxy Z Fold 5'
  | 'Motorola Edge';

export type CaseMaterial = 
  | 'Premium Pebble Leather'
  | 'Smooth Liquid Silicone'
  | 'Bio-Degradable Wheat Fiber'
  | 'Ultra-Tough Polycarbonate'
  | 'Aramid Carbon Fiber';

export type CaseColor = {
  id: string;
  name: string;
  value: string; // hex colour
  bgClass: string; // tailwind class
  textContrast: 'light' | 'dark';
};

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  rating: number;
  reviewsCount: number;
  models: PhoneModel[];
  materials: CaseMaterial[];
  colors: CaseColor[];
  image: string; // Fallback or key to CSS renderer
  tags: string[];
  features: string[];
  magsafe: boolean;
  bestseller?: boolean;
  ecoFriendly?: boolean;
}

export interface CustomCaseConfig {
  model: PhoneModel;
  material: CaseMaterial;
  color: CaseColor;
  monogramText: string;
  monogramColor: 'gold' | 'silver' | 'rose' | 'blind';
  magsafe: boolean;
  buttonColor: 'gold' | 'silver' | 'gunmetal' | 'matching';
}

export interface CartItem {
  id: string; // Unique ID (product_id + color_id + material_id + model_id + monogram hash)
  product: Product;
  quantity: number;
  selectedModel: PhoneModel;
  selectedMaterial: CaseMaterial;
  selectedColor: CaseColor;
  customConfig?: CustomCaseConfig;
  price: number;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface PaymentDetails {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  saveInfo: boolean;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  shipping: ShippingDetails;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

