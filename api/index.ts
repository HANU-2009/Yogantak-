import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db, initSchema } from './db.js';
import { seedNeonDatabaseIfEmpty } from './seedProducts.js';
import { adminAuth, adminDb } from './firebase.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import https from 'https';

// Initialize DB schema on startup
initSchema();

// In-Memory Order and Refund cache for resilient operation across environments
export const inMemoryOrders = new Map<string, any>();
export const inMemoryRefunds = new Map<string, any>();

// ── Helper: decode a Firebase JWT payload without verifying signature (dev-mode fallback) ──
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return next();
  }
  try {
    let email: string | undefined;
    if (adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        email = decoded.email?.toLowerCase();
      } catch {
        const payload = decodeJwtPayload(token);
        if (payload && payload.email) email = payload.email.toLowerCase();
      }
    } else {
      const payload = decodeJwtPayload(token);
      if (payload && payload.email) email = payload.email.toLowerCase();
    }
    if (email) {
      const envAdmins = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
      const defaultAdmins = ['sonpureachintya@gmail.com', 'achintyasonpure69@gmail.com', 'archanasonpure1@gmail.com'];
      const isAdmin = envAdmins.includes(email) || defaultAdmins.includes(email);
      req.user = { id: email, email, role: isAdmin ? 'admin' : 'customer' };
    }
  } catch {}
  next();
}

// ── Shared helper: upsert user into DB and return user + cart ──
async function syncUserToDB(email: string, name: string): Promise<{ user: any; cart: any[] }> {
  // Determine if this user should be granted admin credentials
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : [];

  const defaultAdmins = [
    'sonpureachintya@gmail.com',
    'achintyasonpure69@gmail.com',
    'archanasonpure1@gmail.com'
  ];

  const isAdmin = envAdmins.includes(email.toLowerCase()) || defaultAdmins.includes(email.toLowerCase());
  const targetRole = isAdmin ? 'admin' : 'customer';

  // If Firebase Admin isn't initialized yet, return mock data
  if (!adminDb) {
    console.warn('[DEV MODE] Firebase not initialized. Using mock user data.');
    return {
      user: { id: email, email, fullName: name || email.split('@')[0], role: targetRole, shipping: null },
      cart: []
    };
  }

  try {
    const userRef = adminDb.collection('users').doc(email);
    const doc = await userRef.get();
    
    let user: any;
    let cart: any[] = [];

    if (!doc.exists) {
      const fullName = name || email.split('@')[0];
      user = {
        id: email, // Using email as the ID
        email: email,
        fullName: fullName,
        role: targetRole,
        createdAt: new Date().toISOString(),
        cart: []
      };
      await userRef.set(user);
    } else {
      user = doc.data();
      cart = user.cart || [];
      
      // If the user's role should be upgraded based on admin list
      if (user.role !== targetRole) {
        await userRef.update({ role: targetRole });
        user.role = targetRole;
      }
    }

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, shipping: user.shipping || null },
      cart
    };
  } catch (err) {
    console.warn('[DEV MODE] Firestore operation failed, falling back to local user state:', err);
    return {
      user: { id: email, email, fullName: name || email.split('@')[0], role: targetRole, shipping: null },
      cart: []
    };
  }
}

// ── Helper: parse JSON array column with fallback ──
function parseJsonField(val: any, defaultVal: any) {
  if (!val) return defaultVal;
  if (Array.isArray(val) || typeof val === 'object') {
    return (Array.isArray(val) && val.length === 0) ? defaultVal : val;
  }
  try {
    const parsed = JSON.parse(val);
    return (Array.isArray(parsed) && parsed.length === 0) ? defaultVal : parsed;
  } catch {
    return defaultVal;
  }
}

// ── Helper: format a product row from DB into the API response shape ──
function formatProduct(product: any) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: Number(product.price || 0),
    basePrice: Number(product.price || 0),        // backward compat alias
    stock: Number(product.stock ?? 0),
    category: product.category || 'general',
    rating: Number(product.rating ?? 5.0),
    reviewsCount: Number(product.reviews_count ?? 0),
    image: product.image_data || product.image_url || '',
    image_data: product.image_data || '',
    image_url: product.image_url || '',
    models: parseJsonField(product.models, ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'Samsung Galaxy S24 Ultra', 'Google Pixel 8 Pro']),
    materials: parseJsonField(product.materials, ['Smooth Liquid Silicone', 'Ultra-Tough Polycarbonate']),
    colors: parseJsonField(product.colors, [
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
      { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' }
    ]),
    tags: parseJsonField(product.tags, ['MagSafe Compatible', 'Premium Build']),
    features: parseJsonField(product.features, ['10ft Drop Protection', 'MagSafe Compatible', 'Scratch Resistant Coating']),
    magsafe: Boolean(product.magsafe),
    bestseller: Boolean(product.bestseller),
    ecoFriendly: Boolean(product.eco_friendly),
    createdAt: product.created_at
  };
}

const app = express();

// Increase body size limit to 50MB to support base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic Rate Limiting
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
app.use((req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const limitTime = 60 * 1000; // 1 minute
  const maxRequests = 200; // increased for image uploads

  let tracking = ipRequestCounts.get(ip);
  if (!tracking || now > tracking.resetTime) {
    tracking = { count: 1, resetTime: now + limitTime };
  } else {
    tracking.count++;
  }
  ipRequestCounts.set(ip, tracking);

  if (tracking.count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
});

// Auth Middleware
export interface AuthRequest extends Request {
  user?: any;
}

async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    let email: string | undefined;

    if (adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        email = decodedToken.email?.toLowerCase();
      } catch {
        const payload = decodeJwtPayload(token);
        if (payload && payload.email) {
          email = payload.email.toLowerCase();
        }
      }
    } else {
      // Development fallback — decode JWT without verifying signature
      const payload = decodeJwtPayload(token);
      if (payload) {
        email = (payload.email || '').toLowerCase();
      }
    }

    if (!email) {
      res.status(403).json({ error: 'Token missing email claim' });
      return;
    }

    const envAdmins = process.env.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
      : [];
    const defaultAdmins = [
      'sonpureachintya@gmail.com',
      'achintyasonpure69@gmail.com',
      'archanasonpure1@gmail.com'
    ];
    const isAdmin = envAdmins.includes(email.toLowerCase()) || defaultAdmins.includes(email.toLowerCase());
    const targetRole = isAdmin ? 'admin' : 'customer';

    // Look up the user in Firestore by email
    let user: any = null;
    if (adminDb) {
      try {
        const doc = await adminDb.collection('users').doc(email).get();
        if (doc.exists) {
          user = doc.data();
        }
      } catch (err) {
        console.warn('[DEV MODE] Firestore lookup skipped in authenticateToken:', err);
      }
    }

    if (!user) {
      // Auto-sync unknown user on token validation
      const { user: syncedUser } = await syncUserToDB(email, '');
      req.user = {
        id: syncedUser.id,
        email: syncedUser.email,
        role: syncedUser.role,
        fullName: syncedUser.fullName
      };
      return next();
    }

    req.user = {
      id: user.id || email,
      email: user.email || email,
      role: targetRole,
      fullName: user.fullName || ''
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin only' });
  }
  next();
}

// ==========================================
// 1. FIREBASE AUTHENTICATION SYNC
// ==========================================

// POST /api/auth/sync — Called after Firebase client-side sign-in with a Firebase ID token
app.post('/api/auth/sync', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    let email: string | undefined;
    let name: string | undefined;

    if (adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        email = decodedToken.email?.toLowerCase();
        name = decodedToken.name;
      } catch {
        const payload = decodeJwtPayload(token);
        if (payload && payload.email) {
          email = payload.email.toLowerCase();
          name = payload.name;
        }
      }
    } else {
      // Dev-mode fallback: decode JWT payload without signature verification
      console.warn('[DEV MODE] Firebase Admin SDK not available — using unverified JWT decode for /api/auth/sync');
      const payload = decodeJwtPayload(token);
      if (!payload) {
        res.status(400).json({ error: 'Could not decode token payload' });
        return;
      }
      email = (payload.email || '').toLowerCase();
      name = payload.name;
    }

    if (!email) {
      res.status(400).json({ error: 'Token missing email claim' });
      return;
    }

    const { user, cart } = await syncUserToDB(email, name || '');
    res.json({ user, cart });

  } catch (error) {
    console.error('Sync Error:', error);
    res.status(403).json({ error: 'Invalid or expired Firebase token' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const email = req.user.email;
  const { user, cart } = await syncUserToDB(email, req.user.name || '');
  res.json({ user, cart });
});

// POST /api/auth/google — Google OAuth callback handler
app.post('/api/auth/google', async (req, res) => {
  const { token, isMock, email: mockEmail, name: mockName } = req.body;

  try {
    let email: string;
    let name: string;

    if (isMock) {
      if (!mockEmail) {
        res.status(400).json({ error: 'Mock email is required' });
        return;
      }
      email = mockEmail.toLowerCase();
      name = mockName || 'Google User';
    } else if (token) {
      // Decode Google ID token payload
      const payload = decodeJwtPayload(token);
      if (!payload) {
        res.status(400).json({ error: 'Invalid Google credential token' });
        return;
      }
      email = (payload.email || '').toLowerCase();
      name = payload.name || '';
    } else {
      res.status(400).json({ error: 'No token or mock data provided' });
      return;
    }

    const { user, cart } = await syncUserToDB(email, name);
    const sessionToken = isMock
      ? Buffer.from(JSON.stringify({ email, name, iat: Date.now(), mock: true })).toString('base64')
      : token;

    res.json({ token: sessionToken, user, cart });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: error.message || 'Google auth failed' });
  }
});

// POST /api/auth/microsoft — Microsoft OAuth callback handler
app.post('/api/auth/microsoft', async (req, res) => {
  const { accessToken, isMock, email: mockEmail, name: mockName } = req.body;

  try {
    let email: string;
    let name: string;

    if (isMock) {
      if (!mockEmail) {
        res.status(400).json({ error: 'Mock email is required' });
        return;
      }
      email = mockEmail.toLowerCase();
      name = mockName || 'Microsoft User';
    } else if (accessToken) {
      // Fetch Microsoft Graph profile with the access token
      const msProfile = await new Promise<any>((resolve, reject) => {
        const options = {
          hostname: 'graph.microsoft.com',
          path: '/v1.0/me',
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` }
        };
        const msReq = https.request(options, (msRes) => {
          let data = '';
          msRes.on('data', (chunk: string) => data += chunk);
          msRes.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { reject(new Error('Invalid Microsoft profile response')); }
          });
        });
        msReq.on('error', reject);
        msReq.end();
      });
      email = (msProfile.mail || msProfile.userPrincipalName || '').toLowerCase();
      name = msProfile.displayName || '';
    } else {
      res.status(400).json({ error: 'No access token or mock data provided' });
      return;
    }

    const { user, cart } = await syncUserToDB(email, name);
    const sessionToken = Buffer.from(JSON.stringify({ email, name, iat: Date.now() })).toString('base64');
    res.json({ token: sessionToken, user, cart });

  } catch (error: any) {
    console.error('Microsoft auth error:', error);
    res.status(500).json({ error: error.message || 'Microsoft auth failed' });
  }
});

// ── OTP Authentication ──
const otpStore = new Map<string, { code: string; expiresAt: number }>();
const DEMO_OTP = '4821';

app.post('/api/auth/otp/send', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email.toLowerCase(), { code: DEMO_OTP, expiresAt });
  console.log(`[OTP] Code for ${email}: ${DEMO_OTP}`);
  res.json({ success: true, message: 'OTP sent successfully' });
});

app.post('/api/auth/otp/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: 'Email and OTP code are required' });
    return;
  }

  const storedOtp = otpStore.get(email.toLowerCase());
  if (!storedOtp) {
    res.status(400).json({ error: 'No OTP requested for this email. Please request a new one.' });
    return;
  }
  if (Date.now() > storedOtp.expiresAt) {
    otpStore.delete(email.toLowerCase());
    res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    return;
  }
  if (storedOtp.code !== code.trim()) {
    res.status(400).json({ error: `Invalid OTP code. Please enter ${DEMO_OTP}.` });
    return;
  }

  otpStore.delete(email.toLowerCase());
  const { user, cart } = await syncUserToDB(email.toLowerCase(), '');
  const sessionToken = Buffer.from(JSON.stringify({ email: email.toLowerCase(), iat: Date.now(), method: 'otp' })).toString('base64');
  res.json({ token: sessionToken, user, cart });
});

// ==========================================
// 2. PRODUCT CATALOG APIS (FLAT SCHEMA)
// ==========================================

// GET /api/products — Public product catalog
app.get('/api/products', async (req, res) => {
  try {
    const resDb = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    const products = resDb.rows as any[];
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product catalog' });
  }
});

// POST /api/admin/products/seed — Admin manual trigger to re-seed or sync default catalog
app.post('/api/admin/products/seed', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { force } = req.body || {};
    await seedNeonDatabaseIfEmpty(db, Boolean(force));
    const resDb = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    const products = resDb.rows as any[];
    res.json({ success: true, products: products.map(formatProduct) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed product catalog' });
  }
});

// GET /api/products/:id — Single product detail
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resDb = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    const product = resDb.rows[0] as any;
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Reviews fetch and post
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    if (!adminDb) return res.json([]);
    const snapshot = await adminDb.collection('reviews')
      .where('productId', '==', id)
      .orderBy('createdAt', 'desc')
      .get();
    const reviews = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/products/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { rating, comment, reviewerName } = req.body;

  if (!rating || !comment || !reviewerName) {
    return res.status(400).json({ error: 'Rating, comment and name are required' });
  }

  try {
    if (adminDb) {
      await adminDb.collection('reviews').add({
        productId: id,
        reviewerName,
        rating,
        comment,
        createdAt: new Date().toISOString()
      });
      
      // Calculate new average from Firestore
      const snapshot = await adminDb.collection('reviews').where('productId', '==', id).get();
      let sum = 0;
      snapshot.forEach((doc: any) => { sum += doc.data().rating; });
      const avg = snapshot.size > 0 ? (sum / snapshot.size).toFixed(1) : rating.toFixed(1);
      
      // Still update the summary stats on the product in Postgres
      await db.query(`
        UPDATE products
        SET rating = $1, reviews_count = $2
        WHERE id = $3
      `, [avg, snapshot.size, id]);
    }
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ==========================================
// 3. PERSISTENT CART, WISHLIST, & USER PROFILE APIS
// ==========================================

app.get('/api/user/shipping', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!adminDb) return res.json(null);
    const doc = await adminDb.collection('users').doc(req.user!.email).get();
    res.json(doc.data()?.shipping || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve shipping details' });
  }
});

app.post('/api/user/shipping', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const shipping = req.body;
    if (adminDb) {
      await adminDb.collection('users').doc(req.user!.email).update({
        shipping,
        updatedAt: new Date().toISOString()
      });
    }
    res.json({ success: true, shipping });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save shipping details' });
  }
});

app.get('/api/cart', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!adminDb) return res.json([]);
    const doc = await adminDb.collection('users').doc(req.user!.email).get();
    const data = doc.data();
    res.json(data?.cart || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

app.post('/api/cart', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (adminDb) {
      await adminDb.collection('users').doc(req.user!.email).update({
        cart: req.body.items,
        updatedAt: new Date().toISOString()
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save cart state' });
  }
});

app.get('/api/wishlist', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!adminDb) return res.json([]);
    const doc = await adminDb.collection('users').doc(req.user!.email).get();
    res.json(doc.data()?.wishlist || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
});

app.post('/api/wishlist', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.body;
    if (adminDb) {
      const userRef = adminDb.collection('users').doc(req.user!.email);
      const doc = await userRef.get();
      const wishlist = doc.data()?.wishlist || [];
      if (!wishlist.includes(productId)) {
        await userRef.update({ wishlist: [...wishlist, productId] });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

app.delete('/api/wishlist/:productId', authenticateToken, async (req: AuthRequest, res) => {
  const { productId } = req.params;
  try {
    if (adminDb) {
      const userRef = adminDb.collection('users').doc(req.user!.email);
      const doc = await userRef.get();
      let wishlist = doc.data()?.wishlist || [];
      wishlist = wishlist.filter((id: string) => id !== productId);
      await userRef.update({ wishlist });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete wishlist item' });
  }
});

// ==========================================
// 4. CHECKOUT & COUPON APIS
// ==========================================

app.get('/api/coupons/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    if (adminDb) {
      const doc = await adminDb.collection('coupons').doc(code).get();
      if (!doc.exists) return res.status(404).json({ error: 'Invalid or inactive coupon' });
      const coupon = doc.data();
      if (!coupon || !coupon.active) return res.status(404).json({ error: 'Invalid or inactive coupon' });
      return res.json(coupon);
    } else {
      const resDb = await db.query('SELECT * FROM coupons WHERE code = $1 AND active = 1', [code]);
      const coupon = resDb.rows[0] as any;
      if (!coupon) return res.status(404).json({ error: 'Invalid or inactive coupon' });
      return res.json(coupon);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupon' });
  }
});

// ==========================================
// 5. AUTHORITATIVE PRICING & ATOMIC INVENTORY ENGINE
// ==========================================

// Authoritatively calculate order totals and validated item metadata from database
async function calculateOrderTotals(
  rawItems: any[], 
  couponCode?: string | null
): Promise<{ 
  subtotal: number; 
  discount: number; 
  tax: number; 
  shippingCost: number; 
  total: number; 
  validatedItems: any[];
  appliedCoupon: any | null;
}> {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Cart is empty');
  }

  let subtotal = 0;
  const validatedItems: any[] = [];

  for (const item of rawItems) {
    const prodId = item.product?.id || item.productId;
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    
    if (!prodId) {
      throw new Error('Invalid item: missing product identifier');
    }

    // Retrieve authoritative price from PostgreSQL / DB
    let unitPrice = 0;
    let productName = item.product?.name || item.productName || 'Phone Case';
    let productImage = '';

    if (typeof prodId === 'string' && prodId.startsWith('bespoke-')) {
      // Bespoke monogram custom design base price
      unitPrice = 1499;
      productName = 'Bespoke Custom Phone Case';
    } else {
      const resDb = await db.query('SELECT * FROM products WHERE id = $1', [prodId]);
      const product = resDb.rows[0] as any;
      if (!product) {
        throw new Error(`Product with ID "${prodId}" no longer exists in catalog`);
      }
      unitPrice = Number(product.price) || 0;
      productName = product.name;
      productImage = product.image_data || product.image_url || '';
    }

    const itemTotal = unitPrice * quantity;
    subtotal += itemTotal;

    validatedItems.push({
      productId: prodId,
      productName: productName,
      image: productImage,
      quantity,
      price: unitPrice,
      selectedModel: item.selectedModel || item.customConfig?.model || 'Universal',
      selectedMaterial: item.selectedMaterial || item.customConfig?.material || 'Smooth Liquid Silicone',
      customConfig: item.customConfig || null
    });
  }

  // Authoritative Coupon Validation
  let discount = 0;
  let appliedCoupon: any = null;

  if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase();
    let coupon: any = null;

    if (adminDb) {
      const doc = await adminDb.collection('coupons').doc(cleanCode).get();
      if (doc.exists && doc.data()?.active) {
        coupon = doc.data();
      }
    } else {
      const resDb = await db.query('SELECT * FROM coupons WHERE code = $1 AND active = 1', [cleanCode]);
      coupon = resDb.rows[0];
    }

    if (coupon) {
      const minPurchase = Number(coupon.min_purchase) || 0;
      const isExpired = coupon.expires_at ? new Date(coupon.expires_at).getTime() < Date.now() : false;

      if (!isExpired && subtotal >= minPurchase) {
        if (coupon.discount_type === 'percentage') {
          discount = Math.round((subtotal * (Number(coupon.discount_value) || 0)) / 100);
        } else {
          discount = Math.min(subtotal, Number(coupon.discount_value) || 0);
        }
        appliedCoupon = {
          code: cleanCode,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount
        };
      }
    }
  }

  const tax = 0; // Tax-inclusive pricing model
  const shippingCost = 0; // Free express delivery standard
  const total = Math.max(0, subtotal - discount + tax + shippingCost);

  return {
    subtotal,
    discount,
    tax,
    shippingCost,
    total,
    validatedItems,
    appliedCoupon
  };
}

// Atomic stock deduction with automatic rollback on partial failure (prevents overselling race conditions)
async function deductStockAtomic(validatedItems: any[]): Promise<{ success: boolean; failedProduct?: string }> {
  const deductedItems: { id: string; quantity: number }[] = [];

  for (const item of validatedItems) {
    if (item.productId && typeof item.productId === 'string' && !item.productId.startsWith('bespoke-')) {
      try {
        const updateResult = await db.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
          [item.quantity, item.productId]
        );

        const affected = updateResult.rowCount !== undefined ? updateResult.rowCount : (updateResult.rows?.length || 0);

        if (affected === 0) {
          // Atomic conditional check failed: item has insufficient stock!
          // Rollback all previously deducted items in this transaction
          for (const d of deductedItems) {
            await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [d.quantity, d.id]).catch(() => {});
          }
          return { success: false, failedProduct: item.productName || item.productId };
        }

        deductedItems.push({ id: item.productId, quantity: item.quantity });
      } catch (err) {
        // Rollback
        for (const d of deductedItems) {
          await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [d.quantity, d.id]).catch(() => {});
        }
        return { success: false, failedProduct: item.productName || item.productId };
      }
    }
  }

  return { success: true };
}

// Atomic stock restoration helper for cancellations
async function restoreStockAtomic(items: any[]): Promise<void> {
  if (!items || !Array.isArray(items)) return;
  for (const item of items) {
    const prodId = item.product_id || item.productId || item.product?.id || item.id;
    const quantity = Number(item.quantity) || 1;
    if (prodId && typeof prodId === 'string' && !prodId.startsWith('bespoke-')) {
      try {
        await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, prodId]);
      } catch (err) {
        console.warn(`[STOCK RESTORE WARN] Failed to restore stock for product ${prodId}:`, err);
      }
    }
  }
}

// ==========================================
// 6. SECURE ORDER PLACEMENT APIS
// ==========================================

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { 
      userId, email, items,
      shippingName, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry, shippingPhone,
      couponCode, paymentId 
    } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Customer email is required.' } });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'CART_EMPTY', message: 'Cart items cannot be empty.' } });
    }

    // 0. Idempotency Check: Prevent duplicate order processing if already registered
    if (paymentId) {
      const existingOrderRes = await db.query('SELECT * FROM orders WHERE payment_id = $1', [paymentId]);
      if (existingOrderRes.rows && existingOrderRes.rows.length > 0) {
        const existingOrder = existingOrderRes.rows[0];
        const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [existingOrder.id]);
        return res.status(200).json({
          success: true,
          orderId: existingOrder.id,
          subtotal: existingOrder.subtotal,
          discount: existingOrder.discount,
          total: existingOrder.total,
          order: { ...existingOrder, items: itemsRes.rows || [] },
          isDuplicate: true
        });
      }
    }

    // 1. Authoritatively compute order pricing from DB records (ignores client-supplied prices)
    let orderCalculation;
    try {
      orderCalculation = await calculateOrderTotals(items, couponCode);
    } catch (calcErr: any) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ITEMS', message: calcErr.message } });
    }

    const { subtotal, discount, tax, shippingCost, total, validatedItems, appliedCoupon } = orderCalculation;

    // 2. Perform Atomic Stock Deduction
    const stockDeduction = await deductStockAtomic(validatedItems);
    if (!stockDeduction.success) {
      return res.status(409).json({ 
        success: false, 
        error: { 
          code: 'OUT_OF_STOCK', 
          message: `Insufficient stock available for "${stockDeduction.failedProduct}". Please adjust quantity or select another model.` 
        } 
      });
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const orderData = {
      id: orderId,
      userId: userId || email.toLowerCase(),
      email: email.toLowerCase(),
      status: 'processing',
      subtotal,
      discount,
      tax,
      shippingCost,
      total,
      shippingName: shippingName || '',
      shippingAddress: shippingAddress || '',
      shippingCity: shippingCity || '',
      shippingState: shippingState || '',
      shippingZip: shippingZip || '',
      shippingCountry: shippingCountry || 'India',
      shippingPhone: shippingPhone || null,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      paymentId: paymentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: validatedItems
    };

    // 3. Authoritative persistence in PostgreSQL Orders & Order Items Tables
    try {
      await db.query(
        `INSERT INTO orders (
          id, user_id, email, status, subtotal, discount, tax, shipping_cost, total,
          shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip,
          shipping_country, shipping_phone, coupon_code, payment_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          orderId, userId || email.toLowerCase(), email.toLowerCase(), 'processing',
          subtotal, discount, tax, shippingCost, total,
          shippingName || '', shippingAddress || '', shippingCity || '', shippingState || '', shippingZip || '',
          shippingCountry || 'India', shippingPhone || null, appliedCoupon ? appliedCoupon.code : null, paymentId || null
        ]
      );

      for (const item of validatedItems) {
        const itemId = `ITEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await db.query(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, price,
            selected_model, selected_material, custom_config, image_url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
          [
            itemId, orderId, item.productId, item.productName || 'Phone Case', item.quantity, item.price,
            item.selectedModel || null, item.selectedMaterial || null,
            item.customConfig ? JSON.stringify(item.customConfig) : null,
            item.image || item.imageUrl || ''
          ]
        );
      }
    } catch (dbErr) {
      console.error('[POSTGRES ORDER INSERT ERROR — ROLLING BACK INVENTORY]:', dbErr);
      await restoreStockAtomic(validatedItems);
      return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to record order in database. Inventory restored.' } });
    }

    // Always save to inMemoryOrders store
    inMemoryOrders.set(orderId, orderData);

    if (adminDb) {
      try {
        await adminDb.collection('orders').doc(orderId).set(orderData);

        // Sync shipping details & clear cart
        const userShipping = {
          fullName: shippingName,
          addressLine1: shippingAddress,
          city: shippingCity,
          state: shippingState,
          postalCode: shippingZip,
          country: shippingCountry,
          phone: shippingPhone || ''
        };

        await adminDb.collection('users').doc(email.toLowerCase()).set({ 
          cart: [],
          shipping: userShipping,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (firestoreErr) {
        console.warn('[FIRESTORE ORDER WRITE WARN] Order saved locally, Firestore sync skipped:', firestoreErr);
      }
    }

    console.log(`[ORDER CREATED] ID: ${orderId}, Total: ₹${total}, Email: ${email}, Payment: ${paymentId || 'None'}`);

    res.status(201).json({ 
      success: true, 
      orderId, 
      subtotal, 
      discount, 
      total,
      order: orderData 
    });

  } catch (err: any) {
    console.error('[ORDER ERROR]', err);
    res.status(500).json({ success: false, error: { code: 'ORDER_CREATION_FAILED', message: 'Failed to process order.' } });
  }
});

app.post('/api/orders/checkout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { shipping, cart, couponCode, paymentId } = req.body;
    const userEmail = req.user!.email;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'CART_EMPTY', message: 'Cart items cannot be empty.' } });
    }

    // 0. Idempotency Check: Prevent duplicate order processing if already registered
    if (paymentId) {
      const existingOrderRes = await db.query('SELECT * FROM orders WHERE payment_id = $1', [paymentId]);
      if (existingOrderRes.rows && existingOrderRes.rows.length > 0) {
        const existingOrder = existingOrderRes.rows[0];
        const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [existingOrder.id]);
        return res.status(200).json({
          success: true,
          orderId: existingOrder.id,
          subtotal: existingOrder.subtotal,
          discount: existingOrder.discount,
          total: existingOrder.total,
          order: { ...existingOrder, items: itemsRes.rows || [] },
          isDuplicate: true
        });
      }
    }

    // Authoritative price computation
    const { subtotal, discount, tax, shippingCost, total, validatedItems, appliedCoupon } = await calculateOrderTotals(cart, couponCode);

    // Atomic Stock Deduction
    const stockDeduction = await deductStockAtomic(validatedItems);
    if (!stockDeduction.success) {
      return res.status(409).json({ 
        success: false, 
        error: { 
          code: 'OUT_OF_STOCK', 
          message: `Insufficient stock available for "${stockDeduction.failedProduct}".` 
        } 
      });
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const orderData = {
      id: orderId,
      userId: userEmail,
      email: userEmail,
      status: 'processing',
      subtotal,
      discount,
      tax,
      shippingCost,
      total,
      shippingName: shipping?.fullName || shipping?.name || '',
      shippingAddress: shipping?.addressLine1 || shipping?.address || '',
      shippingCity: shipping?.city || '',
      shippingState: shipping?.state || '',
      shippingZip: shipping?.postalCode || shipping?.zip || '',
      shippingCountry: shipping?.country || 'India',
      shippingPhone: shipping?.phone || null,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      paymentId: paymentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: validatedItems
    };

    // Authoritative persistence in PostgreSQL
    try {
      await db.query(
        `INSERT INTO orders (
          id, user_id, email, status, subtotal, discount, tax, shipping_cost, total,
          shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip,
          shipping_country, shipping_phone, coupon_code, payment_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          orderId, userEmail, userEmail, 'processing',
          subtotal, discount, tax, shippingCost, total,
          shipping?.fullName || shipping?.name || '',
          shipping?.addressLine1 || shipping?.address || '',
          shipping?.city || '', shipping?.state || '',
          shipping?.postalCode || shipping?.zip || '',
          shipping?.country || 'India', shipping?.phone || null,
          appliedCoupon ? appliedCoupon.code : null, paymentId || null
        ]
      );

      for (const item of validatedItems) {
        const itemId = `ITEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await db.query(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, price,
            selected_model, selected_material, custom_config, image_url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
          [
            itemId, orderId, item.productId, item.productName || 'Phone Case', item.quantity, item.price,
            item.selectedModel || null, item.selectedMaterial || null,
            item.customConfig ? JSON.stringify(item.customConfig) : null,
            item.image || item.imageUrl || ''
          ]
        );
      }
    } catch (dbErr) {
      console.error('[POSTGRES CHECKOUT INSERT ERROR — ROLLING BACK INVENTORY]:', dbErr);
      await restoreStockAtomic(validatedItems);
      return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to record order in database. Inventory restored.' } });
    }

    inMemoryOrders.set(orderId, orderData);

    if (adminDb) {
      try {
        await adminDb.collection('orders').doc(orderId).set(orderData);
        await adminDb.collection('users').doc(userEmail).set({
          shipping,
          cart: [],
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (firestoreErr) {
        console.warn('[FIRESTORE CHECKOUT WRITE WARN]', firestoreErr);
      }
    }

    console.log(`[AUTHENTICATED CHECKOUT SUCCESS] ID: ${orderId}, Total: ₹${total}, User: ${userEmail}`);

    res.status(201).json({ success: true, orderId, subtotal, discount, total, order: orderData });
  } catch (err: any) {
    console.error('[CHECKOUT ERROR]', err);
    res.status(500).json({ success: false, error: { code: 'CHECKOUT_FAILED', message: err.message || 'Failed to complete checkout.' } });
  }
});

// ==========================================
// 7. RAZORPAY PAYMENT GATEWAY & SIGNATURE VERIFICATION
// ==========================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// POST /api/create-order & POST /api/payments/razorpay/order
const handleCreateRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt, items, couponCode } = req.body;

    let finalAmountPaise = 0;

    // If items are passed, calculate authoritative amount server-side
    if (items && Array.isArray(items) && items.length > 0) {
      const calculation = await calculateOrderTotals(items, couponCode);
      finalAmountPaise = Math.round(calculation.total * 100);
    } else if (amount && typeof amount === 'number' && amount >= 100) {
      finalAmountPaise = Math.round(amount);
    } else {
      return res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Valid amount or cart items required.' } });
    }

    const hasKeys = process.env.RAZORPAY_KEY_ID &&
                    process.env.RAZORPAY_KEY_SECRET &&
                    process.env.RAZORPAY_KEY_ID !== 'YOUR_KEY_ID' &&
                    process.env.RAZORPAY_KEY_SECRET !== 'YOUR_KEY_SECRET';

    if (!hasKeys) {
      const mockId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      return res.json({
        id: mockId,
        order_id: mockId,
        amount: finalAmountPaise,
        currency,
        entity: 'order',
        isMock: true
      });
    }

    const order = await razorpay.orders.create({
      amount: finalAmountPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`
    });

    res.json({
      id: (order as any).id,
      order_id: (order as any).id,
      amount: (order as any).amount,
      currency: (order as any).currency,
      entity: (order as any).entity,
      isMock: false
    });

  } catch (err: any) {
    console.error('[RAZORPAY CREATE ORDER ERROR]', err);
    res.status(500).json({ success: false, error: { code: 'PAYMENT_GATEWAY_ERROR', message: err.message || 'Razorpay order creation failed.' } });
  }
};

app.post('/api/create-order', handleCreateRazorpayOrder);
app.post('/api/payments/razorpay/order', handleCreateRazorpayOrder);

// Single authoritative HMAC SHA-256 signature verification endpoint
const handleVerifyRazorpayPayment = (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ 
      success: false, 
      verified: false, 
      error: { code: 'MISSING_FIELDS', message: 'Order ID and Payment ID are required.' } 
    });
  }

  // Allow test / mock transactions in sandbox mode
  if (razorpay_order_id.startsWith('order_mock_') || razorpay_payment_id.startsWith('pay_mock_')) {
    return res.json({ success: true, verified: true, isMock: true, message: 'Mock payment accepted for development.' });
  }

  if (!razorpay_signature) {
    return res.status(400).json({ 
      success: false, 
      verified: false, 
      error: { code: 'MISSING_SIGNATURE', message: 'Payment cryptographic signature is required.' } 
    });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!keySecret || keySecret === 'YOUR_KEY_SECRET') {
      console.warn('[RAZORPAY SECURITY WARNING] RAZORPAY_KEY_SECRET is not configured. Allowing test verification.');
      return res.json({ success: true, verified: true, isMock: true });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');

    if (expectedSignature === razorpay_signature) {
      console.log(`[PAYMENT VERIFIED] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);
      return res.json({ success: true, verified: true, message: 'Payment signature verified successfully.' });
    } else {
      console.error(`[PAYMENT VERIFICATION FAILED] Signature mismatch for order: ${razorpay_order_id}`);
      return res.status(400).json({ 
        success: false, 
        verified: false, 
        error: { code: 'INVALID_SIGNATURE', message: 'Cryptographic signature verification failed. Fraud attempt blocked.' } 
      });
    }
  } catch (err: any) {
    console.error('[SIGNATURE VERIFY ERROR]', err);
    return res.status(500).json({ success: false, verified: false, error: { code: 'VERIFICATION_ERROR', message: err.message } });
  }
};

app.post('/api/verify-payment', handleVerifyRazorpayPayment);
app.post('/api/payments/razorpay/verify', handleVerifyRazorpayPayment);

// ==========================================
// 8. RAZORPAY WEBHOOKS & ASYNC PAYMENT / REFUND EVENT INGESTION
// ==========================================

const processedWebhookEvents = new Set<string>();

app.post('/api/webhooks/razorpay', async (req: Request, res: Response) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
  const webhookSignature = req.headers['x-razorpay-signature'] as string;

  if (webhookSecret && webhookSecret !== 'YOUR_KEY_SECRET') {
    if (!webhookSignature) {
      return res.status(400).json({ error: 'Missing webhook signature header' });
    }
    const rawBody = JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (expectedSignature !== webhookSignature) {
      console.error('[WEBHOOK SIGNATURE MISMATCH] Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  const event = req.body?.event;
  const eventId = (req.headers['x-razorpay-event-id'] as string) || `${event}_${Date.now()}`;

  // Prevent duplicate processing
  if (processedWebhookEvents.has(eventId)) {
    return res.json({ status: 'already_processed' });
  }
  processedWebhookEvents.add(eventId);

  console.log(`[RAZORPAY WEBHOOK RECEIVED] Event: ${event}, Event ID: ${eventId}`);

  try {
    const paymentEntity = req.body?.payload?.payment?.entity;
    const refundEntity = req.body?.payload?.refund?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      console.log(`[WEBHOOK PAYMENT CAPTURED] Payment ID: ${paymentEntity.id}, Amount: ₹${paymentEntity.amount / 100}`);
    } else if (event === 'payment.failed' && paymentEntity) {
      console.warn(`[WEBHOOK PAYMENT FAILED] Payment ID: ${paymentEntity.id}, Reason: ${paymentEntity.error_description}`);
    } else if (event === 'refund.processed' && refundEntity) {
      console.log(`[WEBHOOK REFUND PROCESSED] Refund ID: ${refundEntity.id}, Payment: ${refundEntity.payment_id}, Amount: ₹${refundEntity.amount / 100}`);
      await db.query(
        `UPDATE refunds SET status = 'REFUNDED', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE razorpay_refund_id = $1 OR payment_id = $2 OR id = $1`,
        [refundEntity.id, refundEntity.payment_id]
      );
    } else if (event === 'refund.created' || event === 'refund.speed_changed') {
      console.log(`[WEBHOOK REFUND CREATED/SPEED_CHANGED] Refund ID: ${refundEntity.id}`);
      await db.query(
        `UPDATE refunds SET status = 'REFUND_PENDING', updated_at = CURRENT_TIMESTAMP WHERE razorpay_refund_id = $1 OR payment_id = $2 OR id = $1`,
        [refundEntity.id, refundEntity.payment_id]
      );
    } else if (event === 'refund.failed' && refundEntity) {
      console.warn(`[WEBHOOK REFUND FAILED] Refund ID: ${refundEntity.id}, Reason: ${refundEntity.error_description}`);
      await db.query(
        `UPDATE refunds SET status = 'REFUND_FAILED', gateway_error = $1, updated_at = CURRENT_TIMESTAMP WHERE razorpay_refund_id = $2 OR payment_id = $3 OR id = $2`,
        [refundEntity.error_description || 'Bank gateway rejected refund', refundEntity.id, refundEntity.payment_id]
      );
    }

    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[WEBHOOK PROCESSING ERROR]', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ==========================================
// 9. SERVER-SIDE RAZORPAY REFUND SERVICE
// ==========================================

export interface RazorpayRefundOptions {
  orderId: string;
  userEmail?: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface RazorpayRefundResult {
  success: boolean;
  id: string;
  refundId: string;
  orderId: string;
  razorpayRefundId: string;
  amount: number;
  status: 'REFUND_REQUESTED' | 'REFUND_PENDING' | 'REFUNDED' | 'REFUND_FAILED';
  refundMethod: string;
  gatewayError: string | null;
  idempotencyKey: string;
  createdAt: string;
  completedAt: string | null;
}

export async function createRazorpayRefund(options: RazorpayRefundOptions): Promise<RazorpayRefundResult> {
  const { orderId, reason } = options;
  const idempotencyKey = options.idempotencyKey || `idem_rfnd_${orderId}_${Date.now()}`;

  // 1. Idempotency Check: Retrieve existing refund if one has already been created
  const existingRefunds = await db.query(
    'SELECT * FROM refunds WHERE order_id = $1 OR idempotency_key = $2 ORDER BY created_at DESC LIMIT 1',
    [orderId, idempotencyKey]
  );
  if (existingRefunds.rows && existingRefunds.rows.length > 0) {
    const existing = existingRefunds.rows[0];
    if (['REFUNDED', 'REFUND_PENDING', 'REFUND_REQUESTED', 'completed', 'processed'].includes(existing.status)) {
      return {
        success: true,
        id: existing.id,
        refundId: existing.id,
        orderId: existing.order_id || orderId,
        razorpayRefundId: existing.razorpay_refund_id || existing.id,
        amount: Number(existing.amount) || 0,
        status: (existing.status === 'completed' || existing.status === 'processed') ? 'REFUNDED' : existing.status,
        refundMethod: existing.refund_method || 'Razorpay Gateway',
        gatewayError: existing.gateway_error || null,
        idempotencyKey: existing.idempotency_key || idempotencyKey,
        createdAt: existing.created_at,
        completedAt: existing.completed_at
      };
    }
  }

  // 2. Fetch authoritative order from DB to calculate refund amount and payment reference
  const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = orderRes.rows && orderRes.rows[0];
  if (!order) {
    throw new Error(`Order "${orderId}" not found in database.`);
  }

  const refundAmountRupees = Number(order.total) || 0;
  const refundAmountPaise = Math.round(refundAmountRupees * 100);
  const paymentId = order.payment_id || order.paymentId;
  const userEmail = options.userEmail || order.email || '';

  const internalRefundId = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let razorpayRefundId = internalRefundId;
  let status: 'REFUND_REQUESTED' | 'REFUND_PENDING' | 'REFUNDED' | 'REFUND_FAILED' = 'REFUNDED';
  let refundMethod = paymentId ? 'Original Payment Source (Razorpay UPI / Bank)' : 'Instant Store Credit / Direct Bank Transfer';
  let gatewayError: string | null = null;
  let completedAt: string | null = new Date().toISOString();

  // 3. Real Razorpay Refund API Invocation
  const hasRazorpayKeys = process.env.RAZORPAY_KEY_ID &&
                          process.env.RAZORPAY_KEY_SECRET &&
                          process.env.RAZORPAY_KEY_ID !== 'YOUR_KEY_ID' &&
                          process.env.RAZORPAY_KEY_SECRET !== 'YOUR_KEY_SECRET';

  if (paymentId && typeof paymentId === 'string' && (paymentId.startsWith('pay_mock_') || paymentId.startsWith('mock_'))) {
    // Sandbox / Test Mode with Mock Gateway
    razorpayRefundId = `rfnd_mock_${Date.now()}`;
    status = 'REFUNDED';
    refundMethod = 'Razorpay Gateway (Test Mode / Instant)';
    completedAt = new Date().toISOString();
  } else if (paymentId && typeof paymentId === 'string' && paymentId.startsWith('pay_')) {
    if (hasRazorpayKeys) {
      try {
        // Step 3a: Verify payment status from Razorpay before initiating refund
        let isEligible = true;
        try {
          const paymentEntity = await (razorpay.payments as any).fetch(paymentId);
          if (paymentEntity) {
            if (paymentEntity.status !== 'captured' && !paymentEntity.captured) {
              isEligible = false;
              gatewayError = `Payment is not in captured state (status: ${paymentEntity.status})`;
              status = 'REFUND_FAILED';
              completedAt = null;
            }
          }
        } catch (fetchErr: any) {
          console.warn('[RAZORPAY PAYMENT FETCH NOTICE]:', fetchErr?.message || fetchErr);
        }

        if (isEligible) {
          const rzpRefund = await (razorpay.payments as any).refund(paymentId, {
            amount: refundAmountPaise,
            speed: 'optimum',
            receipt: idempotencyKey,
            notes: {
              orderId: order.id,
              customerEmail: userEmail,
              reason: reason || 'Customer requested order cancellation'
            }
          });

          if (rzpRefund && rzpRefund.id) {
            razorpayRefundId = rzpRefund.id;
            refundMethod = 'Razorpay Gateway (Direct Refund to Source)';
            if (rzpRefund.status === 'processed') {
              status = 'REFUNDED';
              completedAt = new Date().toISOString();
            } else if (rzpRefund.status === 'pending') {
              status = 'REFUND_PENDING';
              completedAt = null;
            } else if (rzpRefund.status === 'failed') {
              status = 'REFUND_FAILED';
              completedAt = null;
              gatewayError = 'Razorpay marked refund as failed';
            } else {
              status = 'REFUND_REQUESTED';
              completedAt = null;
            }
            console.log(`[RAZORPAY REFUND SUCCESS] Payment: ${paymentId}, Refund ID: ${razorpayRefundId}, Status: ${status}`);
          }
        }
      } catch (rzpErr: any) {
        console.error('[RAZORPAY REFUND API ERROR]', rzpErr?.message || rzpErr);
        gatewayError = rzpErr?.error?.description || rzpErr?.message || 'Gateway refund invocation error';
        status = 'REFUND_FAILED';
        completedAt = null;
      }
    } else {
      // Sandbox / Test Mode with Mock Gateway
      razorpayRefundId = `rfnd_mock_${Date.now()}`;
      status = 'REFUNDED';
      refundMethod = 'Razorpay Gateway (Test Mode / Instant)';
      completedAt = new Date().toISOString();
    }
  } else {
    // Non-gateway payment source (Store Credit / Manual)
    refundMethod = 'Instant Store Credit / Direct Bank Transfer';
    status = 'REFUNDED';
    completedAt = new Date().toISOString();
  }

  // 4. Persist to PostgreSQL refunds table
  const refundData = {
    id: internalRefundId,
    orderId: order.id,
    userEmail,
    amount: refundAmountRupees,
    paymentId: paymentId || `PAY-MOCK-${Date.now()}`,
    razorpayRefundId,
    status,
    reason: reason || 'Customer requested order cancellation',
    gatewayError,
    refundMethod,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    completedAt
  };

  try {
    await db.query(
      `INSERT INTO refunds (
        id, order_id, user_email, amount, payment_id, razorpay_refund_id,
        status, reason, gateway_error, refund_method, idempotency_key,
        created_at, completed_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, $12, CURRENT_TIMESTAMP)`,
      [
        internalRefundId, order.id, userEmail, refundAmountRupees,
        paymentId || `PAY-MOCK-${Date.now()}`, razorpayRefundId, status,
        reason || 'Customer requested order cancellation', gatewayError, refundMethod,
        idempotencyKey, completedAt
      ]
    );
  } catch (dbErr) {
    console.error('[POSTGRES REFUND INSERT ERROR]:', dbErr);
  }

  inMemoryRefunds.set(internalRefundId, refundData);
  if (razorpayRefundId) inMemoryRefunds.set(razorpayRefundId, refundData);

  return {
    success: status !== 'REFUND_FAILED',
    id: internalRefundId,
    refundId: internalRefundId,
    orderId: order.id,
    razorpayRefundId,
    amount: refundAmountRupees,
    status,
    refundMethod,
    gatewayError,
    idempotencyKey,
    createdAt: refundData.createdAt,
    completedAt
  };
}

// ==========================================
// 10. ORDER LIFECYCLE, HISTORY, & ROBUST REFUND PIPELINE
// ==========================================

app.get('/api/orders/history', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userEmail = req.user?.email;
    let ordersList: any[] = [];

    if (userEmail) {
      const ordersRes = await db.query('SELECT * FROM orders WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC', [userEmail]);
      ordersList = ordersRes.rows || [];
    }

    // If PostgreSQL had no orders, try inMemory
    if (ordersList.length === 0) {
      const allMem = Array.from(inMemoryOrders.values());
      ordersList = userEmail 
        ? allMem.filter(o => o.email?.toLowerCase() === userEmail.toLowerCase() || o.userId === userEmail)
        : allMem;
    }

    const enrichedOrders = [];
    
    for (let order of ordersList) {
      const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      const refundRes = await db.query('SELECT * FROM refunds WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [order.id]);

      const rawItems = (itemsRes.rows && itemsRes.rows.length > 0) ? itemsRes.rows : (order.items || []);
      const enrichedItems = [];
      for (let item of rawItems) {
        const prodId = item.product_id || item.productId;
        const prodName = item.product_name || item.productName || 'Phone Case';
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        const image = item.image_url || item.image || '';

        let customConfig = item.custom_config || item.customConfig || null;
        if (typeof customConfig === 'string') {
          try { customConfig = JSON.parse(customConfig); } catch {}
        }

        let finalProduct = {
          id: prodId,
          name: prodName,
          image,
          price
        };

        if (prodId && !prodId.startsWith('bespoke-')) {
          const productDb = await db.query('SELECT * FROM products WHERE id = $1', [prodId]);
          const product = productDb.rows[0] as any;
          if (product) {
            finalProduct = formatProduct(product);
          }
        }

        enrichedItems.push({
          id: prodId,
          productId: prodId,
          productName: prodName,
          product: finalProduct,
          quantity,
          price,
          selectedModel: item.selected_model || item.selectedModel,
          selectedMaterial: item.selected_material || item.selectedMaterial,
          customConfig
        });
      }

      const refundRecord = (refundRes.rows && refundRes.rows[0]) || order.refund || null;

      enrichedOrders.push({
        id: order.id,
        date: new Date(order.created_at || order.createdAt).toLocaleDateString() + ' at ' + new Date(order.created_at || order.createdAt).toLocaleTimeString(),
        status: order.status,
        delayReason: order.delay_reason || order.delayReason || null,
        estimatedDelivery: order.estimated_delivery || order.estimatedDelivery || null,
        refund: refundRecord ? {
          id: refundRecord.id,
          orderId: refundRecord.order_id || refundRecord.orderId,
          amount: Number(refundRecord.amount) || Number(order.total) || 0,
          status: refundRecord.status,
          refundMethod: refundRecord.refund_method || refundRecord.refundMethod || 'Razorpay Gateway',
          gatewayError: refundRecord.gateway_error || refundRecord.gatewayError || null,
          razorpayRefundId: refundRecord.razorpay_refund_id || refundRecord.razorpayRefundId || refundRecord.id,
          createdAt: refundRecord.created_at || refundRecord.createdAt,
          completedAt: refundRecord.completed_at || refundRecord.completedAt
        } : null,
        subtotal: Number(order.subtotal) || 0,
        discount: Number(order.discount) || 0,
        tax: Number(order.tax) || 0,
        total: Number(order.total) || 0,
        shipping: {
          fullName: order.shipping_name || order.shippingName || '',
          addressLine1: order.shipping_address || order.shippingAddress || '',
          city: order.shipping_city || order.shippingCity || '',
          state: order.shipping_state || order.shippingState || '',
          postalCode: order.shipping_zip || order.shippingZip || '',
          country: order.shipping_country || order.shippingCountry || 'India'
        },
        items: enrichedItems
      });
    }

    res.json(enrichedOrders);
  } catch (err) {
    console.error('[ORDER HISTORY ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

app.get('/api/orders/:id', optionalAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    let orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    let order = orderRes.rows && orderRes.rows[0];

    if (!order) {
      order = inMemoryOrders.get(id);
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Verify ownership if user is authenticated
    if (req.user && req.user.role !== 'admin' && order.email && order.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'Permission denied: Cannot view another customer’s order.' });
    }

    const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    const items = itemsRes.rows || order.items || [];
    const refundRes = await db.query('SELECT * FROM refunds WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [id]);

    res.json({ ...order, items, refund: refundRes.rows && refundRes.rows[0] ? refundRes.rows[0] : null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Secure, Idempotent Customer Order Cancellation & Razorpay Refund
app.post('/api/orders/:id/cancel', optionalAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason, idempotencyKey } = req.body || {};

  try {
    let orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    let order = orderRes.rows && orderRes.rows[0];

    if (!order) {
      order = inMemoryOrders.get(id);
    }

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ORDER_NOT_FOUND', message: `Order with ID "${id}" was not found in database.` } 
      });
    }

    // 1. Verify ownership if token was provided
    if (req.user && req.user.role !== 'admin' && order.email && order.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED_CANCELLATION', message: 'You are not authorized to cancel this order.' } 
      });
    }

    // 2. Idempotency check: if order is already cancelled, return existing refund record
    if (order.status === 'cancelled') {
      const existingRefund = await db.query('SELECT * FROM refunds WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [id]);
      const ref = existingRefund.rows[0] || order.refund || null;
      return res.json({ 
        success: true, 
        message: 'Order is already cancelled.', 
        refund: ref ? {
          id: ref.id,
          refundId: ref.id,
          orderId: ref.order_id || ref.orderId || id,
          amount: Number(ref.amount) || Number(order.total) || 0,
          status: ref.status,
          refundMethod: ref.refund_method || ref.refundMethod || 'Razorpay Gateway',
          gatewayError: ref.gateway_error || ref.gatewayError || null,
          razorpayRefundId: ref.razorpay_refund_id || ref.razorpayRefundId || ref.id,
          createdAt: ref.created_at || ref.createdAt,
          completedAt: ref.completed_at || ref.completedAt
        } : null
      });
    }

    // 3. State transition guard: CANNOT cancel dispatched, shipped, or delivered orders
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'ORDER_DISPATCHED', 
          message: `Order cannot be cancelled because it is already ${order.status.toUpperCase()}. You may request a Return/Exchange once delivered.` 
        } 
      });
    }

    // 4. Execute Server-side Razorpay Refund with Idempotency
    const refundResult = await createRazorpayRefund({
      orderId: id,
      userEmail: order.email,
      reason: reason || 'Customer requested order cancellation',
      idempotencyKey: idempotencyKey || `cancel_${id}_${Date.now()}`
    });

    // 5. Update Order Status in PostgreSQL
    await db.query(`UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

    // Update in-memory cache
    const updatedOrder = {
      ...order,
      status: 'cancelled',
      refund: refundResult,
      cancelledAt: new Date().toISOString()
    };
    inMemoryOrders.set(id, updatedOrder);

    // Sync Firestore if connected
    if (adminDb) {
      try {
        await adminDb.collection('orders').doc(id).update({ 
          status: 'cancelled',
          refund: refundResult,
          cancelledAt: new Date().toISOString()
        });
      } catch (fsErr) {
        console.warn('[FIRESTORE ORDER CANCEL SYNC WARN]:', fsErr);
      }
    }

    // 6. Atomically Restore Inventory Stock in PostgreSQL (executed exactly once)
    const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    const itemsToRestore = (itemsRes.rows && itemsRes.rows.length > 0) ? itemsRes.rows : (order.items || []);
    await restoreStockAtomic(itemsToRestore);

    console.log(`[ORDER CANCELLED & REFUND PROCESSED] Order: ${id}, Refund ID: ${refundResult.razorpayRefundId}, Status: ${refundResult.status}`);

    res.json({ success: true, refund: refundResult });
  } catch (err: any) {
    console.error('[CANCEL & REFUND EXCEPTION]', err);
    res.status(500).json({ success: false, error: { code: 'CANCELLATION_FAILED', message: err?.message || 'Failed to cancel order.' } });
  }
});

// ==========================================
// 7. ADMIN DASHBOARD APIS
// ==========================================

app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    let totalRevenue = 0;
    let ordersCount = 0;
    let customersCount = 0;
    let salesHistory: any[] = [];
    
    // Authoritative calculation from PostgreSQL
    const ordersRes = await db.query("SELECT * FROM orders WHERE status != 'cancelled'");
    const allOrders = ordersRes.rows || [];
    ordersCount = allOrders.length;
    totalRevenue = allOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
    const uniqueCustomers = new Set(allOrders.map((o: any) => o.email?.toLowerCase()).filter(Boolean));
    customersCount = uniqueCustomers.size;

    const dailyMap: Record<string, number> = {};
    allOrders.forEach((o: any) => {
      if (o.created_at) {
        const d = new Date(o.created_at).toISOString().split('T')[0];
        dailyMap[d] = (dailyMap[d] || 0) + (Number(o.total) || 0);
      }
    });
    salesHistory = Object.entries(dailyMap)
      .map(([date, daily_total]) => ({ date, daily_total }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    const lowStockItemsDb = await db.query("SELECT COUNT(id) as count FROM products WHERE stock <= 5");
    const lowStockItems = lowStockItemsDb.rows[0] as any;

    const lowStockListDb = await db.query(`
      SELECT id, name, stock, price, image_url
      FROM products
      WHERE stock <= 5
      ORDER BY stock ASC
      LIMIT 10
    `);
    const lowStockList = lowStockListDb.rows as any[];

    res.json({
      stats: {
        totalRevenue: totalRevenue || 0.0,
        ordersCount: ordersCount || 0,
        customersCount: customersCount || 0,
        lowStockAlerts: lowStockItems?.count || 0
      },
      salesHistory,
      lowStockList: lowStockList.map(formatProduct)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate dashboard metrics' });
  }
});

// GET /api/admin/products — Admin full product list with stock
app.get('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resDb = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    const products = resDb.rows as any[];
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product list' });
  }
});

// POST /api/admin/products — Admin adds a new product (with image upload)
app.post('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name, description, price, stock, category, image_data, image_url,
      models, materials, colors, tags, features, magsafe, bestseller, ecoFriendly
    } = req.body;

    if (!name || price === undefined || price < 0) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const modelsJson = JSON.stringify(models || ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'Samsung Galaxy S24 Ultra', 'Google Pixel 8 Pro']);
    const materialsJson = JSON.stringify(materials || ['Smooth Liquid Silicone', 'Ultra-Tough Polycarbonate']);
    const colorsJson = JSON.stringify(colors || [
      { id: 'charcoal', name: 'Midnight Charcoal', value: '#1A1B1C', bgClass: 'bg-[#1A1B1C]', textContrast: 'light' },
      { id: 'sand', name: 'Alabaster Sand', value: '#DFD3C3', bgClass: 'bg-[#DFD3C3]', textContrast: 'dark' }
    ]);
    const tagsJson = JSON.stringify(tags || ['MagSafe Compatible', 'Premium Build']);
    const featuresJson = JSON.stringify(features || ['10ft Drop Protection', 'MagSafe Compatible', 'Scratch Resistant Coating']);

    await db.query(`
      INSERT INTO products (
        id, name, description, price, stock, category, image_data, image_url,
        models, materials, colors, tags, features, magsafe, bestseller, eco_friendly
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      id, name.trim(), description || '', Number(price), Number(stock) || 0, category || 'general', image_data || '', image_url || '',
      modelsJson, materialsJson, colorsJson, tagsJson, featuresJson,
      magsafe ? 1 : 0, bestseller ? 1 : 0, ecoFriendly ? 1 : 0
    ]);

    const resDb = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    const created = resDb.rows[0] as any;
    res.status(201).json({ success: true, product: formatProduct(created) });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id — Admin updates product details (including image)
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, price, category, image_data, image_url,
      models, materials, colors, tags, features, magsafe, bestseller, ecoFriendly
    } = req.body;

    if (!name || price === undefined || Number(price) < 0) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    fieldsToUpdate.push(`name = $${paramIdx++}`); values.push(name.trim());
    fieldsToUpdate.push(`description = $${paramIdx++}`); values.push(description || '');
    fieldsToUpdate.push(`price = $${paramIdx++}`); values.push(Number(price));
    fieldsToUpdate.push(`category = $${paramIdx++}`); values.push(category || 'general');
    fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);

    if (image_data !== undefined) {
      fieldsToUpdate.push(`image_data = $${paramIdx++}`);
      values.push(image_data);
    }
    if (image_url !== undefined) {
      fieldsToUpdate.push(`image_url = $${paramIdx++}`);
      values.push(image_url);
    }
    if (models !== undefined) { fieldsToUpdate.push(`models = $${paramIdx++}`); values.push(JSON.stringify(models)); }
    if (materials !== undefined) { fieldsToUpdate.push(`materials = $${paramIdx++}`); values.push(JSON.stringify(materials)); }
    if (colors !== undefined) { fieldsToUpdate.push(`colors = $${paramIdx++}`); values.push(JSON.stringify(colors)); }
    if (tags !== undefined) { fieldsToUpdate.push(`tags = $${paramIdx++}`); values.push(JSON.stringify(tags)); }
    if (features !== undefined) { fieldsToUpdate.push(`features = $${paramIdx++}`); values.push(JSON.stringify(features)); }
    if (magsafe !== undefined) { fieldsToUpdate.push(`magsafe = $${paramIdx++}`); values.push(magsafe ? 1 : 0); }
    if (bestseller !== undefined) { fieldsToUpdate.push(`bestseller = $${paramIdx++}`); values.push(bestseller ? 1 : 0); }
    if (ecoFriendly !== undefined) { fieldsToUpdate.push(`eco_friendly = $${paramIdx++}`); values.push(ecoFriendly ? 1 : 0); }

    values.push(id);
    await db.query(`UPDATE products SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramIdx}`, values);

    const resDb = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    const updated = resDb.rows[0] as any;
    res.json({ success: true, product: formatProduct(updated) });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PUT /api/admin/products/:id/stock — Admin restocks a product
app.put('/api/admin/products/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  if (stock === undefined || Number(stock) < 0) {
    return res.status(400).json({ error: 'Valid stock quantity required' });
  }

  try {
    await db.query('UPDATE products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [Number(stock), id]);

    const resDb = await db.query('SELECT id, name, stock FROM products WHERE id = $1', [id]);
    const updated = resDb.rows[0] as any;
    res.json({ success: true, id, stock: updated?.stock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// DELETE /api/admin/products/:id — Admin deletes a product
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const resDb = await db.query('SELECT id FROM products WHERE id = $1', [id]);
    const product = resDb.rows[0];
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// GET /api/admin/orders — All orders from authoritative database
app.get('/api/admin/orders', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const ordersRes = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    const ordersList = ordersRes.rows || [];

    const enrichedOrders = [];
    for (const order of ordersList) {
      const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      const refundRes = await db.query('SELECT * FROM refunds WHERE order_id = $1', [order.id]);

      const items = (itemsRes.rows || []).map((item: any) => {
        let customConfig = null;
        if (item.custom_config) {
          try {
            customConfig = typeof item.custom_config === 'string' ? JSON.parse(item.custom_config) : item.custom_config;
          } catch {}
        }
        return {
          id: item.product_id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: item.price,
          selectedModel: item.selected_model,
          selectedMaterial: item.selected_material,
          customConfig,
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            image: item.image_url
          }
        };
      });

      enrichedOrders.push({
        id: order.id,
        userId: order.user_id,
        email: order.email,
        status: order.status,
        subtotal: order.subtotal,
        discount: order.discount || 0,
        tax: order.tax,
        shippingCost: order.shipping_cost || 0,
        total: order.total,
        shippingName: order.shipping_name,
        shippingAddress: order.shipping_address,
        shippingCity: order.shipping_city,
        shippingState: order.shipping_state,
        shippingZip: order.shipping_zip,
        shippingCountry: order.shipping_country,
        shippingPhone: order.shipping_phone,
        couponCode: order.coupon_code,
        paymentId: order.payment_id,
        delayReason: order.delay_reason,
        estimatedDelivery: order.estimated_delivery,
        refund: refundRes.rows && refundRes.rows[0] ? refundRes.rows[0] : null,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items
      });
    }

    if (enrichedOrders.length === 0 && inMemoryOrders.size > 0) {
      return res.json(Array.from(inMemoryOrders.values()));
    }

    res.json(enrichedOrders);
  } catch (err) {
    console.error('[ADMIN ORDERS GET ERROR]', err);
    res.status(500).json({ error: 'Failed to retrieve orders from database' });
  }
});

// PUT /api/admin/orders/:id/status — Update order status (with PostgreSQL inventory sync & delay notes)
app.put('/api/admin/orders/:id/status', optionalAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, delayReason, estimatedDelivery } = req.body;

  if (!status) return res.status(400).json({ error: 'Status required' });

  try {
    const prevOrderRes = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    const prevOrder = prevOrderRes.rows && prevOrderRes.rows[0];
    const prevStatus = prevOrder?.status;

    // Update in PostgreSQL
    await db.query(
      `UPDATE orders SET status = $1, delay_reason = $2, estimated_delivery = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [status, delayReason || null, estimatedDelivery || null, id]
    );

    // Inventory Synchronization Logic:
    // 1. If changing to 'cancelled' from another status -> restore inventory stock & initiate refund
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
      const itemsToRestore = (itemsRes.rows && itemsRes.rows.length > 0) ? itemsRes.rows : [];
      await restoreStockAtomic(itemsToRestore);

      // Execute Razorpay refund via createRazorpayRefund service
      await createRazorpayRefund({
        orderId: id,
        userEmail: prevOrder?.email || '',
        reason: delayReason || 'Order cancelled by Store Administrator',
        idempotencyKey: `admin_cancel_${id}_${Date.now()}`
      });
    } 
    // 2. If re-instating from 'cancelled' to active status -> deduct inventory stock
    else if (prevStatus === 'cancelled' && status !== 'cancelled') {
      const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
      if (itemsRes.rows) {
        for (const item of itemsRes.rows) {
          if (item.product_id && !item.product_id.startsWith('bespoke-')) {
            await db.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [item.quantity || 1, item.product_id]);
          }
        }
      }
    }

    // Sync inMemoryOrders
    const memOrder = inMemoryOrders.get(id);
    if (memOrder) {
      memOrder.status = status;
      if (delayReason) memOrder.delayReason = delayReason;
      if (estimatedDelivery) memOrder.estimatedDelivery = estimatedDelivery;
      inMemoryOrders.set(id, memOrder);
    }

    // Sync Firestore if connected
    if (adminDb) {
      try {
        await adminDb.collection('orders').doc(id).update({
          status,
          delayReason: delayReason || null,
          estimatedDelivery: estimatedDelivery || null,
          updatedAt: new Date().toISOString()
        });
      } catch {}
    }

    res.json({ success: true, status, delayReason, estimatedDelivery });
  } catch (err: any) {
    console.error('[ADMIN ORDER STATUS ERROR]', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/admin/refunds — Retrieve all refund transactions from PostgreSQL
app.get('/api/admin/refunds', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const refundsRes = await db.query('SELECT * FROM refunds ORDER BY created_at DESC');
    let list = (refundsRes.rows || []).map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      userEmail: r.user_email,
      amount: r.amount,
      paymentId: r.payment_id,
      razorpayRefundId: r.razorpay_refund_id || r.id,
      status: r.status,
      reason: r.reason,
      gatewayError: r.gateway_error,
      refundMethod: r.refund_method,
      idempotencyKey: r.idempotency_key,
      createdAt: r.created_at,
      completedAt: r.completed_at
    }));

    if (list.length === 0 && inMemoryRefunds.size > 0) {
      list = Array.from(inMemoryRefunds.values());
    }

    res.json(list);
  } catch (err) {
    console.error('[GET REFUNDS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

// POST /api/admin/refunds/:id/process — Update refund status
app.post('/api/admin/refunds/:id/process', optionalAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, refundMethod } = req.body;
  try {
    await db.query(
      `UPDATE refunds SET status = $1, refund_method = COALESCE($2, refund_method), completed_at = CURRENT_TIMESTAMP WHERE id = $3 OR razorpay_refund_id = $3`,
      [status || 'REFUNDED', refundMethod || null, id]
    );

    if (adminDb) {
      try {
        const ref = adminDb.collection('refunds').doc(id);
        await ref.update({
          status: status || 'REFUNDED',
          completedAt: new Date().toISOString()
        });
      } catch {}
    }

    res.json({ success: true, refundId: id, status: status || 'REFUNDED' });
  } catch (err) {
    console.error('[PROCESS REFUND ERROR]', err);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// GET /api/admin/coupons — All coupons
app.get('/api/admin/coupons', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (adminDb) {
      const snapshot = await adminDb.collection('coupons').get();
      const coupons = snapshot.docs.map((doc: any) => doc.data());
      return res.json(coupons);
    } else {
      const resDb = await db.query('SELECT * FROM coupons ORDER BY code ASC');
      return res.json(resDb.rows);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/admin/coupons — Create new coupon
app.post('/api/admin/coupons', authenticateToken, requireAdmin, async (req, res) => {
  const { code, discount_type, discount_value, min_purchase, expires_at } = req.body;
  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: 'Code, type, and discount value required' });
  }

  const couponCode = code.toUpperCase();
  const couponData = {
    code: couponCode,
    discount_type,
    discount_value: Number(discount_value),
    min_purchase: Number(min_purchase) || 0,
    expires_at: expires_at || null,
    active: 1,
    updatedAt: new Date().toISOString()
  };

  try {
    if (adminDb) {
      await adminDb.collection('coupons').doc(couponCode).set(couponData, { merge: true });
    }
    await db.query(`
      INSERT INTO coupons (code, discount_type, discount_value, min_purchase, expires_at, active)
      VALUES ($1, $2, $3, $4, $5, 1)
      ON CONFLICT(code) DO UPDATE SET discount_type = EXCLUDED.discount_type, discount_value = EXCLUDED.discount_value, min_purchase = EXCLUDED.min_purchase, expires_at = EXCLUDED.expires_at, active = 1
    `, [couponCode, discount_type, Number(discount_value), Number(min_purchase) || 0, expires_at || null]).catch(() => {});

    res.status(201).json({ success: true, coupon: couponData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// DELETE /api/admin/coupons/:code — Delete coupon
app.delete('/api/admin/coupons/:code', authenticateToken, requireAdmin, async (req, res) => {
  const couponCode = req.params.code.toUpperCase();
  try {
    if (adminDb) {
      await adminDb.collection('coupons').doc(couponCode).delete();
    }
    await db.query('DELETE FROM coupons WHERE code = $1', [couponCode]).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Newsletter Subscriber
app.post('/api/newsletter/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    if (adminDb) {
      await adminDb.collection('newsletter_subscribers').doc(email.toLowerCase()).set({
        email: email.toLowerCase(),
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// ==========================================
// 8. STATIC FILES SERVING & ROUTING (PRODUCTION)
// ==========================================

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('Serving production-built assets from:', distPath);
  app.use(express.static(distPath));

  // SPA Fallback: serve index.html for non-api routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  console.log('Static directory dist/ does not exist. Frontend dev proxy server active.');
}

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[YOGANTAK API SERVER] listening on http://localhost:${PORT}`);
  });
}

// ==========================================
// 9. GLOBAL ERROR HANDLER
// ==========================================
// Ensures that PayloadTooLargeError and SyntaxError return JSON instead of HTML stack traces
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large. Please upload a smaller image.' });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
