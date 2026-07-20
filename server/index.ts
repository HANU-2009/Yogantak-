import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db, initSchema } from './db.js';
import { adminAuth, adminDb } from './firebase.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import https from 'https';

// --- Enterprise Backend ---
import { app as enterpriseApp } from './enterprise-backend/app';

// Initialize DB schema on startup
initSchema();

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

// ── Shared helper: upsert user into DB and return user + cart ──
async function syncUserToDB(email: string, name: string): Promise<{ user: any; cart: any[] }> {
  // Determine if this user should be granted admin credentials
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : [];

  const defaultAdmins = [
    'sonpureachintya@gmail.com'
  ];

  const isAdmin = envAdmins.includes(email.toLowerCase()) || defaultAdmins.includes(email.toLowerCase());
  const targetRole = isAdmin ? 'admin' : 'customer';

  // If Firebase Admin isn't initialized yet, return mock data
  if (!adminDb) {
    console.warn('[DEV MODE] Firebase not initialized. Using mock user data.');
    return {
      user: { id: email, email, fullName: name || email.split('@')[0], role: targetRole },
      cart: []
    };
  }

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
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    cart
  };
}

// ── Helper: format a product row from DB into the API response shape ──
function formatProduct(product: any) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: product.price,
    basePrice: product.price,        // backward compat alias
    stock: product.stock ?? 0,
    category: product.category || 'general',
    rating: product.rating ?? 5.0,
    reviewsCount: product.reviews_count ?? 0,
    image: product.image_data || product.image_url || '',
    image_data: product.image_data || '',
    image_url: product.image_url || '',
    // Legacy empty arrays so old cart/checkout components don't crash
    models: [],
    materials: [],
    colors: [],
    tags: [],
    features: [],
    magsafe: false,
    bestseller: false,
    ecoFriendly: false,
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
      // Production path — full Firebase token verification
      const decodedToken = await adminAuth.verifyIdToken(token);
      email = decodedToken.email?.toLowerCase();
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

    // Look up the user in Firestore by email
    let user: any = null;
    if (adminDb) {
      const doc = await adminDb.collection('users').doc(email).get();
      if (doc.exists) {
        user = doc.data();
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
      role: user.role || 'customer',
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

// Mount Enterprise Backend
app.use('/api/enterprise', enterpriseApp);

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
      // Production path — full Firebase Admin SDK verification
      const decodedToken = await adminAuth.verifyIdToken(token);
      email = decodedToken.email?.toLowerCase();
      name = decodedToken.name;
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
// 3. PERSISTENT CART & WISHLIST APIS
// ==========================================

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
    const { code } = req.params;
    const resDb = await db.query('SELECT * FROM coupons WHERE code = $1 AND active = 1', [code.toUpperCase()]);
    const coupon = resDb.rows[0] as any;
    if (!coupon) return res.status(404).json({ error: 'Invalid or inactive coupon' });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupon' });
  }
});

// ==========================================
// 5. SECURE ORDER PLACEMENT APIS
// ==========================================

app.post('/api/orders/checkout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { shipping, cart, subtotal, tax, total, couponCode, paymentId } = req.body;

    if (!cart || cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    // Enforce stock logic
    for (const item of cart) {
      const resDb = await db.query('SELECT stock FROM products WHERE id = $1', [item.product?.id]);
      const prod = resDb.rows[0] as any;
      if (!prod || prod.stock < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${item.product?.name}` });
      }
    }

    // Deduct stock
    for (const item of cart) {
      await db.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [item.quantity, item.product?.id]);
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const orderData = {
      id: orderId,
      userId: req.user!.email,
      email: req.user!.email,
      status: 'processing',
      subtotal,
      tax,
      total,
      shippingName: shipping.name,
      shippingAddress: shipping.address,
      shippingCity: shipping.city,
      shippingState: shipping.state,
      shippingZip: shipping.zip,
      shippingCountry: shipping.country,
      couponCode: couponCode || null,
      paymentId: paymentId || null,
      createdAt: new Date().toISOString(),
      items: cart.map((item: any) => ({
        productId: item.product?.id,
        productName: item.product?.name,
        quantity: item.quantity,
        price: item.product?.price,
        customConfig: item.customConfig || null
      }))
    };

    if (adminDb) {
      // Save order to Firestore
      await adminDb.collection('orders').doc(orderId).set(orderData);

      // Clear cart
      await adminDb.collection('users').doc(req.user!.email).update({ cart: [] });
    }

    res.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

app.get('/api/orders/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!adminDb) return res.json([]);
    const snapshot = await adminDb.collection('orders')
      .where('email', '==', req.user!.email)
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = snapshot.docs.map((doc: any) => doc.data());
    const enrichedOrders = [];
    
    for (let order of orders) {
      const enrichedItems = [];
      for (let item of order.items) {
        // Fetch product metadata from Postgres
        const productDb = await db.query('SELECT * FROM products WHERE id = $1', [item.productId]);
        const product = productDb.rows[0] as any;
        let finalProduct = product ? formatProduct(product) : {
          id: item.productId,
          name: item.productName || 'Product',
          image: '',
          price: item.price
        };

        enrichedItems.push({
          id: item.productId,
          product: finalProduct,
          quantity: item.quantity,
          price: item.price,
          customConfig: item.customConfig
        });
      }

      enrichedOrders.push({
        id: order.id,
        date: new Date(order.createdAt).toLocaleDateString() + ' at ' + new Date(order.createdAt).toLocaleTimeString(),
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        shipping: {
          fullName: order.shippingName,
          addressLine1: order.shippingAddress,
          city: order.shippingCity,
          state: order.shippingState,
          postalCode: order.shippingZip,
          country: order.shippingCountry
        },
        items: enrichedItems
      });
    }

    res.json(enrichedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

app.get('/api/orders/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    if (!adminDb) return res.status(404).json({ error: 'Order not found' });
    const doc = await adminDb.collection('orders').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    
    const order = doc.data();

    // Verify ownership
    if (order.email !== req.user!.email && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

app.post('/api/orders/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    if (!adminDb) return res.status(404).json({ error: 'Order not found' });
    const orderRef = adminDb.collection('orders').doc(id);
    const doc = await orderRef.get();
    
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });
    const order = doc.data();

    // Verify ownership
    if (order.email !== req.user!.email && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    await orderRef.update({ status: 'cancelled' });

    // Restore stock in Postgres
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.productId?.startsWith('bespoke-')) continue;
        await db.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.productId]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// ==========================================
// 6. RAZORPAY PAYMENT GATEWAY
// ==========================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

app.post('/api/payments/razorpay/order', async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const amountPaise = Number(amount);
    if (isNaN(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise (₹1)' });
    }

    const hasKeys = process.env.RAZORPAY_KEY_ID &&
                    process.env.RAZORPAY_KEY_SECRET &&
                    process.env.RAZORPAY_KEY_ID !== 'YOUR_KEY_ID' &&
                    process.env.RAZORPAY_KEY_SECRET !== 'YOUR_KEY_SECRET';

    if (!hasKeys) {
      return res.json({
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        order_id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: amountPaise,
        currency: currency || 'INR',
        entity: 'order',
        isMock: true
      });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: currency || 'INR',
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
    console.error('Razorpay order creation failure:', err);
    res.status(500).json({ error: err.message || 'Razorpay order creation failed' });
  }
});

app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (razorpay_signature === 'mock_signature') {
    return res.json({ verified: true, message: 'Mock payment signature accepted' });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment fields' });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Invalid payment signature' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Signature verification error' });
  }
});

// Alias for CheckoutModal compatibility
app.post('/api/create-order', async (req: Request, res: Response) => {
  const { amount, currency = 'INR', receipt } = req.body;
  if (!amount || typeof amount !== 'number' || amount < 100) {
    return res.status(400).json({ error: 'Amount must be a number >= 100 paise (₹1)' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    } as any);

    res.json({
      order_id: (order as any).id,
      id: (order as any).id,
      amount: (order as any).amount,
      currency: (order as any).currency
    });
  } catch (err: any) {
    console.error('[RAZORPAY] Create order failed:', err);
    res.status(500).json({ error: err?.error?.description || err?.message || 'Failed to create Razorpay order' });
  }
});

app.post('/api/verify-payment', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment verification fields' });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body.toString()).digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.json({ verified: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ verified: false, error: 'Invalid payment signature' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ==========================================
// 7. ADMIN DASHBOARD APIS
// ==========================================

app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let totalRevenue = 0;
    let ordersCount = 0;
    let customersCount = 0;
    let salesHistory: any[] = [];
    
    if (adminDb) {
      // Calculate from Firestore orders
      const ordersSnapshot = await adminDb.collection('orders').where('status', '!=', 'cancelled').get();
      ordersCount = ordersSnapshot.size;
      ordersSnapshot.forEach((doc: any) => {
        totalRevenue += doc.data().total || 0;
      });

      const usersSnapshot = await adminDb.collection('users').where('role', '==', 'customer').get();
      customersCount = usersSnapshot.size;
      
      // Compute daily sales history locally from the snapshot (last 7 days approx)
      const dailyMap: Record<string, number> = {};
      ordersSnapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.createdAt) {
          const d = new Date(data.createdAt).toISOString().split('T')[0];
          dailyMap[d] = (dailyMap[d] || 0) + (data.total || 0);
        }
      });
      salesHistory = Object.entries(dailyMap)
        .map(([date, daily_total]) => ({ date, daily_total }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7);
    }

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
        lowStockAlerts: lowStockItems.count || 0
      },
      salesHistory,
      lowStockList
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
    const { name, description, price, stock, category, image_data, image_url } = req.body;

    if (!name || price === undefined || price < 0) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    await db.query(`
      INSERT INTO products (id, name, description, price, stock, category, image_data, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, name.trim(), description || '', Number(price), Number(stock) || 0, category || 'general', image_data || '', image_url || '']);

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
    const { name, description, price, category, image_data, image_url } = req.body;

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

// GET /api/admin/orders — All orders
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const snapshot = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
    const orders = snapshot.docs.map((doc: any) => doc.data());
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// PUT /api/admin/orders/:id/status — Update order status
app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Status required' });

  try {
    if (adminDb) {
      await adminDb.collection('orders').doc(id).update({ status });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/admin/coupons — All coupons
app.get('/api/admin/coupons', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resDb = await db.query('SELECT * FROM coupons ORDER BY code ASC');
    res.json(resDb.rows);
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

  try {
    await db.query(`
      INSERT INTO coupons (code, discount_type, discount_value, min_purchase, expires_at, active)
      VALUES ($1, $2, $3, $4, $5, 1)
      ON CONFLICT(code) DO UPDATE SET discount_type = EXCLUDED.discount_type, discount_value = EXCLUDED.discount_value, min_purchase = EXCLUDED.min_purchase, expires_at = EXCLUDED.expires_at, active = 1
    `, [code.toUpperCase(), discount_type, Number(discount_value), Number(min_purchase) || 0, expires_at || null]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// DELETE /api/admin/coupons/:code — Delete coupon
app.delete('/api/admin/coupons/:code', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM coupons WHERE code = $1', [req.params.code.toUpperCase()]);
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
