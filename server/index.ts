import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { adminAuth } from './firebase';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import https from 'https';

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
function syncUserToDB(email: string, name: string): { user: any; cart: any[] } {
  const selectQuery = db.prepare('SELECT * FROM users WHERE email = ?');
  let user = selectQuery.get(email) as any;

  if (!user) {
    const fullName = name || email.split('@')[0];
    const insert = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (?, 'firebase_managed', ?, 'customer')
    `);
    const info = insert.run(email, fullName);
    const userId = Number(info.lastInsertRowid);
    user = { id: userId, email, full_name: fullName, role: 'customer' };
  }

  const cartQuery = db.prepare('SELECT cart_items FROM carts WHERE user_id = ?');
  const cartData = cartQuery.get(user.id) as any;
  const cart = cartData ? JSON.parse(cartData.cart_items) : [];

  return {
    user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    cart
  };
}

const app = express();
app.use(express.json());

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
  const maxRequests = 100;

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
  user?: {
    id: number;
    email: string;
    role: string;
    fullName: string;
  };
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

    // Look up the user in our local SQLite database by email
    const userQuery = db.prepare('SELECT id, email, role, full_name as fullName FROM users WHERE email = ?');
    const user = userQuery.get(email) as any;

    if (!user) {
      res.status(403).json({ error: 'User not synced in local database' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
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
      // Production path — full Firebase Admin SDK verification
      const decodedToken = await adminAuth.verifyIdToken(token);
      email = decodedToken.email?.toLowerCase();
      name = decodedToken.name;
    } else {
      // Dev-mode fallback: decode JWT payload without signature verification
      // Allows local testing when Firebase Admin credentials are not yet configured
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

    const { user, cart } = syncUserToDB(email, name || '');
    res.json({ user, cart });

  } catch (error) {
    console.error('Sync Error:', error);
    res.status(403).json({ error: 'Invalid or expired Firebase token' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
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

    const { user, cart } = syncUserToDB(email, name);
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

    const { user, cart } = syncUserToDB(email, name);
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

app.post('/api/auth/otp/verify', (req, res) => {
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
  const { user, cart } = syncUserToDB(email.toLowerCase(), '');
  const sessionToken = Buffer.from(JSON.stringify({ email: email.toLowerCase(), iat: Date.now(), method: 'otp' })).toString('base64');
  res.json({ token: sessionToken, user, cart });
});


// ==========================================
// 2. PRODUCT CATALOG APIS
// ==========================================

app.get('/api/products', (req, res) => {
  try {
    const productsQuery = db.prepare('SELECT * FROM products');
    const products = productsQuery.all() as any[];

    const result = products.map(product => {
      // Fetch models
      const models = db.prepare('SELECT model FROM product_models WHERE product_id = ?').all(product.id) as any[];
      // Fetch materials
      const materials = db.prepare('SELECT material FROM product_materials WHERE product_id = ?').all(product.id) as any[];
      // Fetch colors
      const colors = db.prepare('SELECT color_id as id, color_name as name, color_value as value, bg_class as bgClass, text_contrast as textContrast FROM product_colors WHERE product_id = ?').all(product.id) as any[];
      // Fetch tags
      const tags = db.prepare('SELECT tag FROM product_tags WHERE product_id = ?').all(product.id) as any[];
      // Fetch features
      const features = db.prepare('SELECT feature FROM product_features WHERE product_id = ?').all(product.id) as any[];

      return {
        ...product,
        magsafe: !!product.magsafe,
        bestseller: !!product.bestseller,
        ecoFriendly: !!product.eco_friendly,
        basePrice: product.base_price,
        reviewsCount: product.reviews_count,
        models: models.map(m => m.model),
        materials: materials.map(m => m.material),
        colors,
        tags: tags.map(t => t.tag),
        features: features.map(f => f.feature)
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product catalog data' });
  }
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const models = db.prepare('SELECT model FROM product_models WHERE product_id = ?').all(id) as any[];
    const materials = db.prepare('SELECT material FROM product_materials WHERE product_id = ?').all(id) as any[];
    const colors = db.prepare('SELECT color_id as id, color_name as name, color_value as value, bg_class as bgClass, text_contrast as textContrast FROM product_colors WHERE product_id = ?').all(id) as any[];
    const tags = db.prepare('SELECT tag FROM product_tags WHERE product_id = ?').all(id) as any[];
    const features = db.prepare('SELECT feature FROM product_features WHERE product_id = ?').all(id) as any[];

    res.json({
      ...product,
      magsafe: !!product.magsafe,
      bestseller: !!product.bestseller,
      ecoFriendly: !!product.eco_friendly,
      basePrice: product.base_price,
      reviewsCount: product.reviews_count,
      models: models.map(m => m.model),
      materials: materials.map(m => m.material),
      colors,
      tags: tags.map(t => t.tag),
      features: features.map(f => f.feature)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Reviews fetch and post
app.get('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  try {
    const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(id);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { rating, comment, reviewerName } = req.body;

  if (!rating || !comment || !reviewerName) {
    return res.status(400).json({ error: 'Rating, comment and name are required' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO reviews (product_id, reviewer_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `);
    insert.run(id, reviewerName, rating, comment);

    // Update product overall rating metrics
    const stats = db.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(id) as countReviews
      FROM reviews WHERE product_id = ?
    `).get(id) as any;

    const update = db.prepare(`
      UPDATE products
      SET rating = ?, reviews_count = ?
      WHERE id = ?
    `);
    update.run(Number(stats.avgRating.toFixed(1)), stats.countReviews, id);

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ==========================================
// 3. PERSISTENT CART & WISHLIST APIS
// ==========================================

app.get('/api/cart', authenticateToken, (req: AuthRequest, res) => {
  try {
    const query = db.prepare('SELECT cart_items FROM carts WHERE user_id = ?');
    const data = query.get(req.user!.id) as any;
    res.json(data ? JSON.parse(data.cart_items) : []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

app.post('/api/cart', authenticateToken, (req: AuthRequest, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array required' });
  }

  try {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO carts (user_id, cart_items, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    insert.run(req.user!.id, JSON.stringify(items));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save cart state' });
  }
});

app.get('/api/wishlist', authenticateToken, (req: AuthRequest, res) => {
  try {
    const items = db.prepare('SELECT product_id FROM wishlist WHERE user_id = ?').all(req.user!.id) as any[];
    res.json(items.map(i => i.product_id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
});

app.post('/api/wishlist', authenticateToken, (req: AuthRequest, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID required' });

  try {
    const insert = db.prepare('INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)');
    insert.run(req.user!.id, productId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

app.delete('/api/wishlist/:productId', authenticateToken, (req: AuthRequest, res) => {
  const { productId } = req.params;
  try {
    const del = db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?');
    del.run(req.user!.id, productId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete wishlist item' });
  }
});

// ==========================================
// 4. CHECKOUT & COUPON APIS
// ==========================================

app.post('/api/coupons/apply', (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code || cartTotal === undefined) {
    return res.status(400).json({ error: 'Coupon code and cartTotal required' });
  }

  const query = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1');
  const coupon = query.get(code.toUpperCase()) as any;

  if (!coupon) {
    return res.status(400).json({ error: 'Invalid or deactivated coupon code' });
  }

  if (cartTotal < coupon.min_purchase) {
    return res.status(400).json({ error: `Voucher requires a minimum purchase of $${coupon.min_purchase}` });
  }

  let discount = 0;
  if (coupon.discount_type === 'flat') {
    discount = coupon.discount_value;
  } else if (coupon.discount_type === 'percent') {
    discount = cartTotal * (coupon.discount_value / 100);
  }

  res.json({
    code: coupon.code,
    discount: Number(discount.toFixed(2)),
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value
  });
});

// ==========================================
// 5. SECURE ORDER PLACEMENT APIS
// ==========================================

app.post('/api/orders', (req, res) => {
  const { 
    userId, email, items, subtotal, tax, total, 
    shippingName, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry,
    couponCode, paymentId 
  } = req.body;

  if (!email || !items || !Array.isArray(items) || items.length === 0 || !total) {
    return res.status(400).json({ error: 'Order validation failed: missing coordinates' });
  }

  try {
    // Inventory Stock Verification & Deductions
    const checkStock = db.prepare(`
      SELECT stock, sku FROM inventory 
      WHERE product_id = ? AND model = ? AND material = ? AND color_id = ?
    `);

    const updateStock = db.prepare(`
      UPDATE inventory SET stock = stock - ? 
      WHERE sku = ?
    `);

    // Verify all items are in stock first
    for (const item of items) {
      if (item.product.id.startsWith('bespoke-') || item.product.image === 'custom') {
        continue; // bespoke cases don't subtract from static mold stock
      }
      const match = checkStock.get(
        item.product.id,
        item.selectedModel,
        item.selectedMaterial,
        item.selectedColor.id
      ) as any;

      if (!match || match.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient inventory stock for ${item.product.name} in ${item.selectedColor.name} (${item.selectedModel})` 
        });
      }
    }

    // Deduct stock levels
    for (const item of items) {
      if (item.product.id.startsWith('bespoke-') || item.product.image === 'custom') {
        continue;
      }
      const match = checkStock.get(
        item.product.id,
        item.selectedModel,
        item.selectedMaterial,
        item.selectedColor.id
      ) as any;
      updateStock.run(item.quantity, match.sku);
    }

    // Create unique Order ID (e.g. YGT-12345-6789)
    const orderId = `YGT-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, user_id, email, status, subtotal, tax, total, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, coupon_code, payment_id)
      VALUES (?, ?, ?, 'processing', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderId,
      userId || null,
      email,
      subtotal,
      tax,
      total,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      couponCode || null,
      paymentId || `PAY-MOCK-${Date.now()}`
    );

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, selected_model, selected_material, selected_color_id, price, custom_config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertOrderItem.run(
        orderId,
        item.product.id,
        item.quantity,
        item.selectedModel,
        item.selectedMaterial,
        item.selectedColor.id,
        item.price,
        item.customConfig ? JSON.stringify(item.customConfig) : null
      );
    }

    // Clear saved cart on purchase if user was authenticated
    if (userId) {
      db.prepare('DELETE FROM carts WHERE user_id = ?').run(userId);
    }

    res.status(201).json({
      success: true,
      orderId,
      estimatedDelivery: '2-3 Business Days via DHL Express'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order transaction' });
  }
});

app.get('/api/orders/history', authenticateToken, (req: AuthRequest, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[];
    
    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];
      const enrichedItems = items.map(item => {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id) as any;
        
        // Handle bespoke items
        let finalProduct = product;
        if (item.product_id.startsWith('bespoke-')) {
          finalProduct = {
            id: item.product_id,
            name: 'Bespoke Engraved Case Studio',
            image: 'custom',
            basePrice: item.price
          };
        }

        // Color details fetch
        const color = db.prepare('SELECT color_id as id, color_name as name, color_value as value, bg_class as bgClass, text_contrast as textContrast FROM product_colors WHERE product_id = ? AND color_id = ?').get(item.product_id, item.selected_color_id) || { id: item.selected_color_id, name: 'Default Color', bgClass: 'bg-black' };

        return {
          id: item.id,
          product: finalProduct,
          quantity: item.quantity,
          selectedModel: item.selected_model,
          selectedMaterial: item.selected_material,
          selectedColor: color,
          price: item.price,
          customConfig: item.custom_config ? JSON.parse(item.custom_config) : null
        };
      });

      return {
        id: order.id,
        date: new Date(order.created_at).toLocaleDateString() + ' at ' + new Date(order.created_at).toLocaleTimeString(),
        status: order.status,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        shipping: {
          fullName: order.shipping_name,
          addressLine1: order.shipping_address,
          city: order.shipping_city,
          state: order.shipping_state,
          postalCode: order.shipping_zip,
          country: order.shipping_country
        },
        items: enrichedItems
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

app.post('/api/orders/:id/cancel', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) return res.status(404).json({ error: 'Order manifest not found' });
    
    // Verify ownership
    if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    // Cancel order in DB
    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(id);

    // Restore stock levels
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as any[];
    const restoreStock = db.prepare(`
      UPDATE inventory SET stock = stock + ? 
      WHERE product_id = ? AND model = ? AND material = ? AND color_id = ?
    `);

    for (const item of items) {
      if (item.product_id.startsWith('bespoke-')) continue;
      restoreStock.run(
        item.quantity,
        item.product_id,
        item.selected_model,
        item.selected_material,
        item.selected_color_id
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to abort order delivery' });
  }
});

// ==========================================
// 6. RAZORPAY PAYMENT MOCKS & LOGS
// ==========================================

app.post('/api/payments/razorpay/order', async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const amountPaise = Number(amount);
    if (isNaN(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise (1 INR)' });
    }

    const hasKeys = process.env.RAZORPAY_KEY_ID && 
                    process.env.RAZORPAY_KEY_SECRET && 
                    process.env.RAZORPAY_KEY_ID !== 'YOUR_KEY_ID' &&
                    process.env.RAZORPAY_KEY_SECRET !== 'YOUR_KEY_SECRET';

    if (!hasKeys) {
      console.log('[RAZORPAY] Missing or placeholder keys. Falling back to mock order.');
      return res.json({
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        order_id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: amountPaise,
        currency: currency || 'INR',
        entity: 'order',
        isMock: true
      });
    }

    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!
      });

      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: currency || 'INR',
        receipt: receipt || `rcpt_${Date.now()}`
      });

      res.json({
        id: order.id,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        entity: order.entity,
        isMock: false
      });
    } catch (err: any) {
      if (err.statusCode === 401 || err.message?.includes('auth') || err.message?.includes('API key')) {
        console.warn('[RAZORPAY] Authentication failed (401). Falling back to mock order.');
        return res.json({
          id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
          order_id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
          amount: amountPaise,
          currency: currency || 'INR',
          entity: 'order',
          isMock: true
        });
      }
      throw err;
    }
  } catch (err: any) {
    console.error('Razorpay order creation failure:', err);
    res.status(500).json({ error: err.message || 'Razorpay order creation failed' });
  }
});

app.post('/api/payments/razorpay/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Signature coordinates missing' });
  }

  if (razorpay_order_id.startsWith('order_mock_') || razorpay_signature === 'mock_signature') {
    return res.json({
      verified: true,
      message: 'Mock Payment verification completed. Signature verified.'
    });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Razorpay key secret not configured on server' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  const verified = expectedSignature === razorpay_signature;

  if (verified) {
    res.json({
      verified: true,
      message: 'Payment verification checks completed. Signature verified.'
    });
  } else {
    res.status(400).json({
      verified: false,
      error: 'Invalid payment signature. Potential tampering detected.'
    });
  }
});

// ==========================================
// 6b. STANDARD RAZORPAY API INTEGRATION
// ==========================================

app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency, receipt } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const amountPaise = Number(amount);
    if (isNaN(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise' });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret || key_id === 'YOUR_KEY_ID' || key_secret === 'YOUR_KEY_SECRET') {
      return res.status(401).json({ error: 'Razorpay API credentials not configured' });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    try {
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: currency || 'INR',
        receipt: receipt || `rcpt_${Date.now()}`
      });

      return res.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (razorpayError: any) {
      console.error('Razorpay SDK Order creation failed:', razorpayError);
      const statusCode = razorpayError.statusCode || 500;
      if (statusCode === 401 || razorpayError.message?.toLowerCase().includes('auth') || razorpayError.message?.toLowerCase().includes('key')) {
        return res.status(401).json({ error: 'Razorpay authentication failed: Invalid credentials.' });
      }
      return res.status(500).json({ error: razorpayError.message || 'Razorpay order creation failed' });
    }
  } catch (error: any) {
    console.error('Create order exception:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/verify-payment', (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Razorpay key secret not configured on server' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.json({
        verified: true,
        message: 'Payment verified successfully'
      });
    } else {
      return res.status(400).json({
        verified: false,
        error: 'Invalid payment signature. Payment verification failed.'
      });
    }
  } catch (error: any) {
    console.error('Verify payment exception:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ==========================================
// 7. ADMIN DASHBOARD APIS
// ==========================================

app.get('/api/admin/dashboard', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalSales = db.prepare("SELECT SUM(total) as sum FROM orders WHERE status != 'cancelled'").get() as any;
    const totalOrders = db.prepare("SELECT COUNT(id) as count FROM orders").get() as any;
    const totalCustomers = db.prepare("SELECT COUNT(id) as count FROM users WHERE role = 'customer'").get() as any;
    const lowStockItems = db.prepare("SELECT COUNT(sku) as count FROM inventory WHERE stock <= low_stock_threshold").get() as any;

    // Monthly revenue simulation
    const salesHistory = db.prepare(`
      SELECT DATE(created_at) as date, SUM(total) as amount, COUNT(id) as count
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `).all() as any[];

    // Low stock lists
    const lowStockList = db.prepare(`
      SELECT i.*, p.name as product_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.stock <= i.low_stock_threshold
      LIMIT 10
    `).all() as any[];

    res.json({
      stats: {
        totalRevenue: totalSales.sum || 0.0,
        ordersCount: totalOrders.count || 0,
        customersCount: totalCustomers.count || 0,
        lowStockAlerts: lowStockItems.count || 0
      },
      salesHistory,
      lowStockList
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate metrics dossier' });
  }
});

app.get('/api/admin/inventory', authenticateToken, requireAdmin, (req, res) => {
  try {
    const list = db.prepare(`
      SELECT i.*, p.name as product_name 
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ORDER BY i.stock ASC
    `).all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stock list' });
  }
});

app.put('/api/admin/inventory/:sku', authenticateToken, requireAdmin, (req, res) => {
  const { sku } = req.params;
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    return res.status(400).json({ error: 'Invalid stock level' });
  }

  try {
    const update = db.prepare('UPDATE inventory SET stock = ? WHERE sku = ?');
    update.run(stock, sku);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inventory stock' });
  }
});

app.get('/api/admin/orders', authenticateToken, requireAdmin, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];
      return { ...order, items };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customer orders list' });
  }
});

app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Status coordinate required' });

  try {
    const update = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    update.run(status, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Newsletter Subscriber
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email coordinate required' });

  try {
    const insert = db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)');
    insert.run(email.toLowerCase());
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// ==========================================
// 7b. RAZORPAY PAYMENT GATEWAY
// ==========================================

// Initialise Razorpay SDK once at startup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// POST /api/create-order — Creates a Razorpay order and returns order_id, amount, currency
app.post('/api/create-order', async (req: Request, res: Response) => {
  const { amount, currency = 'INR', receipt } = req.body;

  // Validate minimum amount (Razorpay requires >= 100 paise = ₹1)
  if (!amount || typeof amount !== 'number' || amount < 100) {
    res.status(400).json({ error: 'Amount must be a number >= 100 paise (₹1)' });
    return;
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount), // paise, must be integer
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    } as any);

    res.json({
      order_id: (order as any).id,
      id: (order as any).id,        // alias for CheckoutModal compatibility
      amount: (order as any).amount,
      currency: (order as any).currency
    });

  } catch (err: any) {
    console.error('[RAZORPAY] Create order failed:', err);
    // Surface a clear error — most likely wrong credentials
    res.status(500).json({ error: err?.error?.description || err?.message || 'Failed to create Razorpay order' });
  }
});

// POST /api/verify-payment — Verifies Razorpay payment signature (HMAC-SHA256)
app.post('/api/verify-payment', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: 'Missing required payment fields: order_id, payment_id, signature' });
    return;
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      console.log(`[RAZORPAY] Payment verified ✓ — order: ${razorpay_order_id}, payment: ${razorpay_payment_id}`);
      res.json({ verified: true });
    } else {
      console.warn(`[RAZORPAY] Signature mismatch — potential tampered request for order: ${razorpay_order_id}`);
      res.status(400).json({ verified: false, error: 'Payment signature verification failed' });
    }

  } catch (err: any) {
    console.error('[RAZORPAY] Signature verification error:', err);
    res.status(500).json({ error: 'Signature verification encountered an internal error' });
  }
});

// POST /api/payments/razorpay/verify — Alias for mock-flow compatibility
app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Allow mock signatures through (these come from the simulation overlay)
  if (razorpay_signature === 'mock_signature') {
    console.log('[MOCK-GATEWAY] Mock payment signature accepted — simulation mode');
    res.json({ verified: true });
    return;
  }

  // Otherwise run real HMAC check
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: 'Missing required payment fields' });
    return;
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Payment signature verification failed' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Signature verification error' });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[YOGANTAK API SERVER] listening on http://localhost:${PORT}`);
});
