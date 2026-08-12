// server/index.ts
import dotenv2 from "dotenv";
import express from "express";
import path2 from "path";
import fs from "fs";

// server/db.ts
import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";

// server/seedProducts.ts
var DEFAULT_PRODUCTS_SEED = [
  {
    id: "sienna-leather",
    name: "Atelier pebble grain leather MagSafe case",
    description: "Exquisite French full-grain pebbled leather wrapped snugly around a hard drop-shell. Over time, it gains a deep, personalized patina unique to your touch.",
    price: 3999,
    stock: 50,
    category: "leather",
    rating: 4.9,
    reviews_count: 164,
    image_url: "leather",
    models: ["iPhone 15 Pro Max", "iPhone 15 Pro", "Samsung Galaxy S24 Ultra"],
    materials: ["Premium Pebble Leather"],
    colors: [
      { id: "terracotta", name: "Sienna Terracotta", value: "#C05C46", bgClass: "bg-[#C05C46]", textContrast: "light" },
      { id: "charcoal", name: "Midnight Charcoal", value: "#1A1B1C", bgClass: "bg-[#1A1B1C]", textContrast: "light" },
      { id: "sand", name: "Alabaster Sand", value: "#DFD3C3", bgClass: "bg-[#DFD3C3]", textContrast: "dark" }
    ],
    tags: ["MagSafe", "Pebble Leather"],
    features: ["10ft Drop Protection", "MagSafe Compatible", "Italian Suede Interior Lining", "Machined Aluminum Button Covers"],
    magsafe: 1,
    bestseller: 1,
    eco_friendly: 0
  },
  {
    id: "bio-wheat",
    name: "Terra bio-degradable wheat shell",
    description: "An earth-first shielding case that will leave zero toxic trace. Crafted entirely from renewable wheat fiber and plant starches, maintaining a rugged and organic eggshell feel.",
    price: 2799,
    stock: 80,
    category: "eco",
    rating: 4.7,
    reviews_count: 89,
    image_url: "wheat",
    models: ["iPhone 15 Pro", "iPhone 15", "Samsung Galaxy S24+", "Google Pixel 8 Pro", "Nothing Phone (2)", "OnePlus 12", "Motorola Edge"],
    materials: ["Bio-Degradable Wheat Fiber"],
    colors: [
      { id: "forest", name: "Verdant Forest", value: "#243D2D", bgClass: "bg-[#243D2D]", textContrast: "light" },
      { id: "sand", name: "Alabaster Sand", value: "#DFD3C3", bgClass: "bg-[#DFD3C3]", textContrast: "dark" }
    ],
    tags: ["100% Compostable", "Eco-Conscious"],
    features: ["Biodegradable Material", "8ft Cushion Protection", "Earth-tone Tactile Finish", "Anti-Microbial Properties"],
    magsafe: 0,
    bestseller: 0,
    eco_friendly: 1
  },
  {
    id: "crystal-poly",
    name: "Glacier optical-clear shock proof shield",
    description: "Let your device design express itself. Engineered with high-index optical polycarbonate and an advanced UV-absorbing compound preventing the classic yellow hue.",
    price: 3199,
    stock: 120,
    category: "clear",
    rating: 4.6,
    reviews_count: 194,
    image_url: "clear",
    models: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "Samsung Galaxy S24 Ultra", "Samsung Galaxy S24+", "Google Pixel 8 Pro", "Nothing Phone (2)", "OnePlus 12", "Samsung Galaxy Z Fold 5", "Motorola Edge"],
    materials: ["Ultra-Tough Polycarbonate"],
    colors: [
      { id: "glacier", name: "Glacier Clear", value: "#DBE9EE", bgClass: "bg-[#DBE9EE]", textContrast: "dark" }
    ],
    tags: ["Anti-Yellowing", "Crystal Clear"],
    features: ["Advanced UV Guard Tech", "Corner Anti-shock Airbags", "High Scratch Resistance (4H Hardness)", "Symmetric MagSafe Alignment Ring"],
    magsafe: 1,
    bestseller: 0,
    eco_friendly: 0
  },
  {
    id: "liquid-silicone",
    name: "Nimbus matte liquid silicone case",
    description: "The epitome of daily comfort. Form-fitting liquid silicone with a dust-resistant matte skin, wrapping around a robust 3-tier polycarbonate shell.",
    price: 2399,
    stock: 200,
    category: "silicone",
    rating: 4.8,
    reviews_count: 312,
    image_url: "silicone",
    models: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "Samsung Galaxy S24 Ultra", "Samsung Galaxy S24+", "Google Pixel 8 Pro", "Nothing Phone (2)", "OnePlus 12", "Samsung Galaxy Z Fold 5", "Motorola Edge"],
    materials: ["Smooth Liquid Silicone"],
    colors: [
      { id: "terracotta", name: "Sienna Terracotta", value: "#C05C46", bgClass: "bg-[#C05C46]", textContrast: "light" },
      { id: "forest", name: "Verdant Forest", value: "#243D2D", bgClass: "bg-[#243D2D]", textContrast: "light" },
      { id: "charcoal", name: "Midnight Charcoal", value: "#1A1B1C", bgClass: "bg-[#1A1B1C]", textContrast: "light" },
      { id: "cobalt", name: "Aegean Cobalt", value: "#213E60", bgClass: "bg-[#213E60]", textContrast: "light" },
      { id: "plum", name: "Deep Plum", value: "#43263E", bgClass: "bg-[#43263E]", textContrast: "light" }
    ],
    tags: ["Super Grip", "Best Value"],
    features: ["Inner Dense Microfiber Protection", "Qi Wireless & MagSafe Compatible", "Dust & Lint Proof Nano Coating", "Tactile Edge Over-molds"],
    magsafe: 1,
    bestseller: 1,
    eco_friendly: 0
  },
  {
    id: "stealth-aramid",
    name: "Aether ultra-thin aramid weave case",
    description: "The ultimate case for minimalists who despise bulk. Constructed with genuine synthetic fibers 5 times stronger than steel but as light as a feather.",
    price: 4999,
    stock: 30,
    category: "armor",
    rating: 4.9,
    reviews_count: 145,
    image_url: "carbon",
    models: ["iPhone 15 Pro Max", "iPhone 15 Pro", "Samsung Galaxy S24 Ultra", "Nothing Phone (2)", "OnePlus 12"],
    materials: ["Aramid Carbon Fiber"],
    colors: [
      { id: "charcoal", name: "Midnight Charcoal", value: "#1A1B1C", bgClass: "bg-[#1A1B1C]", textContrast: "light" }
    ],
    tags: ["0.8mm Profile", "Indestructible"],
    features: ["Bulletproof Kevlar Aramid Fiber", "Impossibly Thin (0.85mm)", "MagSafe Coil Imbedded", "Raised Camera Ring for Guarding Optics"],
    magsafe: 1,
    bestseller: 0,
    eco_friendly: 0
  },
  {
    id: "minimalist-wallet",
    name: "Vanguard card sleeve MagSafe case",
    description: "A structural, clean 2-in-1 setup. Combines the luxurious matte liquid silicone skin with a built-in stitched card compartment for an absolute card-carrying ease.",
    price: 3699,
    stock: 75,
    category: "wallet",
    rating: 4.8,
    reviews_count: 201,
    image_url: "wallet",
    models: ["iPhone 15 Pro Max", "iPhone 15 Pro", "Samsung Galaxy S24 Ultra"],
    materials: ["Smooth Liquid Silicone"],
    colors: [
      { id: "charcoal", name: "Midnight Charcoal", value: "#1A1B1C", bgClass: "bg-[#1A1B1C]", textContrast: "light" },
      { id: "sand", name: "Alabaster Sand", value: "#DFD3C3", bgClass: "bg-[#DFD3C3]", textContrast: "dark" }
    ],
    tags: ["Card Vault", "MagSafe Secure"],
    features: ["2-Card Blind Sleeve Shielding", "Secure Tap-to-Pay Compatible", "Fleece Guarded Outer Layer", "Drop Corner Fortification"],
    magsafe: 1,
    bestseller: 0,
    eco_friendly: 0
  }
];
async function seedNeonDatabaseIfEmpty(db2, force = false) {
  if (!force) {
    return false;
  }
  console.log("[POSTGRES] Seeding Neon database with default luxury catalog...");
  try {
    for (const p of DEFAULT_PRODUCTS_SEED) {
      const modelsJson = JSON.stringify(p.models);
      const materialsJson = JSON.stringify(p.materials);
      const colorsJson = JSON.stringify(p.colors);
      const tagsJson = JSON.stringify(p.tags);
      const featuresJson = JSON.stringify(p.features);
      await db2.query(`
        INSERT INTO products (
          id, name, description, price, stock, category, image_data, image_url,
          rating, reviews_count, models, materials, colors, tags, features,
          magsafe, bestseller, eco_friendly
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING
      `, [
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category,
        "",
        p.image_url,
        p.rating,
        p.reviews_count,
        modelsJson,
        materialsJson,
        colorsJson,
        tagsJson,
        featuresJson,
        p.magsafe,
        p.bestseller,
        p.eco_friendly
      ]);
    }
    console.log("[POSTGRES] Successfully seeded default products into Neon database.");
    return true;
  } catch (error) {
    console.error("[POSTGRES] Failed to seed Neon database:", error);
    return false;
  }
}

// server/db.ts
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
var hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
if (!hasDatabaseUrl) {
  console.warn("[POSTGRES] DATABASE_URL is not set. Operating in resilient in-memory mode.");
} else {
  console.log("[POSTGRES] Connecting to Neon Database...");
}
var inMemoryProducts = new Map(
  DEFAULT_PRODUCTS_SEED.map((p) => [p.id, {
    ...p,
    models: JSON.stringify(p.models),
    materials: JSON.stringify(p.materials),
    colors: JSON.stringify(p.colors),
    tags: JSON.stringify(p.tags),
    features: JSON.stringify(p.features),
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }])
);
var inMemoryCoupons = /* @__PURE__ */ new Map();
var neonPool = null;
if (hasDatabaseUrl) {
  try {
    neonPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3500,
      idleTimeoutMillis: 1e4
    });
    neonPool.on("error", (err) => {
      console.warn("[POSTGRES] Pool background notice:", err.message);
    });
  } catch (e) {
    console.warn("[POSTGRES] Failed to create Neon pool:", e);
    neonPool = null;
  }
}
var db = {
  async query(text, params = []) {
    if (neonPool) {
      try {
        const result = await neonPool.query(text, params);
        return { rows: result.rows || [] };
      } catch (err) {
        console.warn(`[POSTGRES DB NOTICE] Neon query fallback (${err?.message || "Connection timeout"}). Using in-memory store.`);
      }
    }
    const sql = text.trim();
    const upperSql = sql.toUpperCase();
    if (upperSql.includes("FROM PRODUCTS")) {
      let list = Array.from(inMemoryProducts.values());
      if (upperSql.includes("WHERE ID = $1") && params[0]) {
        const item = inMemoryProducts.get(params[0]);
        return { rows: item ? [item] : [] };
      }
      if (upperSql.includes("WHERE STOCK <= 5")) {
        list = list.filter((p) => Number(p.stock) <= 5);
      }
      if (upperSql.includes("COUNT(")) {
        return { rows: [{ count: list.length }] };
      }
      if (upperSql.includes("ORDER BY STOCK ASC")) {
        list.sort((a, b) => Number(a.stock) - Number(b.stock));
      } else {
        list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }
      if (upperSql.includes("LIMIT")) {
        const limitMatch = upperSql.match(/LIMIT\s+(\d+)/);
        if (limitMatch) {
          list = list.slice(0, parseInt(limitMatch[1]));
        }
      }
      return { rows: list };
    }
    if (upperSql.startsWith("INSERT INTO PRODUCTS")) {
      const [id, name, description, price, stock, category, image_data, image_url, models, materials, colors, tags, features, magsafe, bestseller, eco_friendly] = params;
      const productObj = {
        id: id || `prod_${Date.now()}`,
        name: name || "Product",
        description: description || "",
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        category: category || "general",
        image_data: image_data || "",
        image_url: image_url || "",
        models: models || "[]",
        materials: materials || "[]",
        colors: colors || "[]",
        tags: tags || "[]",
        features: features || "[]",
        magsafe: magsafe ? 1 : 0,
        bestseller: bestseller ? 1 : 0,
        eco_friendly: eco_friendly ? 1 : 0,
        rating: 5,
        reviews_count: 0,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      inMemoryProducts.set(productObj.id, productObj);
      return { rows: [productObj] };
    }
    if (upperSql.startsWith("UPDATE PRODUCTS")) {
      const id = params[params.length - 1];
      const existing = inMemoryProducts.get(id);
      if (existing) {
        if (upperSql.includes("SET STOCK = $1")) {
          existing.stock = Number(params[0]);
        } else if (upperSql.includes("SET STOCK = GREATEST")) {
          existing.stock = Math.max(0, Number(existing.stock) - Number(params[0]));
        } else if (upperSql.includes("SET STOCK = STOCK + $1")) {
          existing.stock = Number(existing.stock) + Number(params[0]);
        } else if (params.length >= 4) {
          existing.name = params[0] || existing.name;
          existing.description = params[1] ?? existing.description;
          existing.price = Number(params[2]) || existing.price;
          existing.category = params[3] || existing.category;
          if (params.length > 5 && typeof params[4] === "string" && params[4].startsWith("data:")) {
            existing.image_data = params[4];
          }
        }
        existing.updated_at = (/* @__PURE__ */ new Date()).toISOString();
        inMemoryProducts.set(id, existing);
        return { rows: [existing] };
      }
      return { rows: [] };
    }
    if (upperSql.startsWith("DELETE FROM PRODUCTS")) {
      const id = params[0];
      const prod = inMemoryProducts.get(id);
      if (prod) {
        inMemoryProducts.delete(id);
        return { rows: [prod] };
      }
      return { rows: [] };
    }
    if (upperSql.includes("FROM COUPONS")) {
      if (upperSql.includes("WHERE CODE = $1") && params[0]) {
        const coupon = inMemoryCoupons.get(params[0].toUpperCase());
        return { rows: coupon ? [coupon] : [] };
      }
      return { rows: Array.from(inMemoryCoupons.values()) };
    }
    return { rows: [] };
  }
};
async function initSchema() {
  if (!neonPool) return;
  try {
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        price REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        category TEXT DEFAULT 'general',
        image_data TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        rating REAL DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const columnsToAdd = [
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS models TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS materials TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT DEFAULT '[]';",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS magsafe INTEGER DEFAULT 0;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS bestseller INTEGER DEFAULT 0;",
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS eco_friendly INTEGER DEFAULT 0;"
    ];
    for (const sql of columnsToAdd) {
      await neonPool.query(sql).catch(() => {
      });
    }
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_purchase REAL DEFAULT 0,
        expires_at TIMESTAMP,
        active INTEGER DEFAULT 1
      );
    `);
    console.log("[POSTGRES] Schema initialized successfully.");
  } catch (error) {
    console.warn("[POSTGRES] Error initializing schema:", error);
  }
}

// server/firebase.ts
var adminAuth = null;
var adminDb = null;
async function initializeFirebaseAdmin() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") : void 0;
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    try {
      const { initializeApp, getApps, cert } = await import("firebase-admin/app");
      const { getAuth } = await import("firebase-admin/auth");
      const { getFirestore } = await import("firebase-admin/firestore");
      if (!getApps().length) {
        const firebaseApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey
          })
        });
        adminAuth = getAuth(firebaseApp);
        adminDb = getFirestore(firebaseApp);
        console.log("Firebase Admin SDK (Auth & Firestore) initialized successfully.");
      }
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK dynamically:", error);
    }
  } else {
    console.warn("Firebase Admin SDK missing credentials. Authentication via Firebase will not work until .env is populated.");
  }
}
initializeFirebaseAdmin();

// server/index.ts
import Razorpay from "razorpay";
import crypto from "crypto";
import https from "https";
dotenv2.config();
initSchema();
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
async function syncUserToDB(email, name) {
  const envAdmins = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()) : [];
  const defaultAdmins = [
    "sonpureachintya@gmail.com",
    "achintyasonpure69@gmail.com",
    "archanasonpure1@gmail.com"
  ];
  const isAdmin = envAdmins.includes(email.toLowerCase()) || defaultAdmins.includes(email.toLowerCase());
  const targetRole = isAdmin ? "admin" : "customer";
  if (!adminDb) {
    console.warn("[DEV MODE] Firebase not initialized. Using mock user data.");
    return {
      user: { id: email, email, fullName: name || email.split("@")[0], role: targetRole },
      cart: []
    };
  }
  try {
    const userRef = adminDb.collection("users").doc(email);
    const doc = await userRef.get();
    let user;
    let cart = [];
    if (!doc.exists) {
      const fullName = name || email.split("@")[0];
      user = {
        id: email,
        // Using email as the ID
        email,
        fullName,
        role: targetRole,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        cart: []
      };
      await userRef.set(user);
    } else {
      user = doc.data();
      cart = user.cart || [];
      if (user.role !== targetRole) {
        await userRef.update({ role: targetRole });
        user.role = targetRole;
      }
    }
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      cart
    };
  } catch (err) {
    console.warn("[DEV MODE] Firestore operation failed, falling back to local user state:", err);
    return {
      user: { id: email, email, fullName: name || email.split("@")[0], role: targetRole },
      cart: []
    };
  }
}
function parseJsonField(val, defaultVal) {
  if (!val) return defaultVal;
  if (Array.isArray(val) || typeof val === "object") {
    return Array.isArray(val) && val.length === 0 ? defaultVal : val;
  }
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) && parsed.length === 0 ? defaultVal : parsed;
  } catch {
    return defaultVal;
  }
}
function formatProduct(product) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    price: Number(product.price || 0),
    basePrice: Number(product.price || 0),
    // backward compat alias
    stock: Number(product.stock ?? 0),
    category: product.category || "general",
    rating: Number(product.rating ?? 5),
    reviewsCount: Number(product.reviews_count ?? 0),
    image: product.image_data || product.image_url || "",
    image_data: product.image_data || "",
    image_url: product.image_url || "",
    models: parseJsonField(product.models, ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "Samsung Galaxy S24 Ultra", "Google Pixel 8 Pro"]),
    materials: parseJsonField(product.materials, ["Smooth Liquid Silicone", "Ultra-Tough Polycarbonate"]),
    colors: parseJsonField(product.colors, [
      { id: "charcoal", name: "Midnight Charcoal", value: "#1A1B1C", bgClass: "bg-[#1A1B1C]", textContrast: "light" },
      { id: "sand", name: "Alabaster Sand", value: "#DFD3C3", bgClass: "bg-[#DFD3C3]", textContrast: "dark" }
    ]),
    tags: parseJsonField(product.tags, ["MagSafe Compatible", "Premium Build"]),
    features: parseJsonField(product.features, ["10ft Drop Protection", "MagSafe Compatible", "Scratch Resistant Coating"]),
    magsafe: Boolean(product.magsafe),
    bestseller: Boolean(product.bestseller),
    ecoFriendly: Boolean(product.eco_friendly),
    createdAt: product.created_at
  };
}
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var ipRequestCounts = /* @__PURE__ */ new Map();
app.use((req, res, next) => {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const limitTime = 60 * 1e3;
  const maxRequests = 200;
  let tracking = ipRequestCounts.get(ip);
  if (!tracking || now > tracking.resetTime) {
    tracking = { count: 1, resetTime: now + limitTime };
  } else {
    tracking.count++;
  }
  ipRequestCounts.set(ip, tracking);
  if (tracking.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  next();
});
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  try {
    let email;
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
      const payload = decodeJwtPayload(token);
      if (payload) {
        email = (payload.email || "").toLowerCase();
      }
    }
    if (!email) {
      res.status(403).json({ error: "Token missing email claim" });
      return;
    }
    const envAdmins = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()) : [];
    const defaultAdmins = [
      "sonpureachintya@gmail.com",
      "achintyasonpure69@gmail.com",
      "archanasonpure1@gmail.com"
    ];
    const isAdmin = envAdmins.includes(email.toLowerCase()) || defaultAdmins.includes(email.toLowerCase());
    const targetRole = isAdmin ? "admin" : "customer";
    let user = null;
    if (adminDb) {
      try {
        const doc = await adminDb.collection("users").doc(email).get();
        if (doc.exists) {
          user = doc.data();
        }
      } catch (err) {
        console.warn("[DEV MODE] Firestore lookup skipped in authenticateToken:", err);
      }
    }
    if (!user) {
      const { user: syncedUser } = await syncUserToDB(email, "");
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
      fullName: user.fullName || ""
    };
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied: Admin only" });
  }
  next();
}
app.post("/api/auth/sync", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  try {
    let email;
    let name;
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
      console.warn("[DEV MODE] Firebase Admin SDK not available \u2014 using unverified JWT decode for /api/auth/sync");
      const payload = decodeJwtPayload(token);
      if (!payload) {
        res.status(400).json({ error: "Could not decode token payload" });
        return;
      }
      email = (payload.email || "").toLowerCase();
      name = payload.name;
    }
    if (!email) {
      res.status(400).json({ error: "Token missing email claim" });
      return;
    }
    const { user, cart } = await syncUserToDB(email, name || "");
    res.json({ user, cart });
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(403).json({ error: "Invalid or expired Firebase token" });
  }
});
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const email = req.user.email;
  const { user, cart } = await syncUserToDB(email, req.user.name || "");
  res.json({ user, cart });
});
app.post("/api/auth/google", async (req, res) => {
  const { token, isMock, email: mockEmail, name: mockName } = req.body;
  try {
    let email;
    let name;
    if (isMock) {
      if (!mockEmail) {
        res.status(400).json({ error: "Mock email is required" });
        return;
      }
      email = mockEmail.toLowerCase();
      name = mockName || "Google User";
    } else if (token) {
      const payload = decodeJwtPayload(token);
      if (!payload) {
        res.status(400).json({ error: "Invalid Google credential token" });
        return;
      }
      email = (payload.email || "").toLowerCase();
      name = payload.name || "";
    } else {
      res.status(400).json({ error: "No token or mock data provided" });
      return;
    }
    const { user, cart } = await syncUserToDB(email, name);
    const sessionToken = isMock ? Buffer.from(JSON.stringify({ email, name, iat: Date.now(), mock: true })).toString("base64") : token;
    res.json({ token: sessionToken, user, cart });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: error.message || "Google auth failed" });
  }
});
app.post("/api/auth/microsoft", async (req, res) => {
  const { accessToken, isMock, email: mockEmail, name: mockName } = req.body;
  try {
    let email;
    let name;
    if (isMock) {
      if (!mockEmail) {
        res.status(400).json({ error: "Mock email is required" });
        return;
      }
      email = mockEmail.toLowerCase();
      name = mockName || "Microsoft User";
    } else if (accessToken) {
      const msProfile = await new Promise((resolve, reject) => {
        const options = {
          hostname: "graph.microsoft.com",
          path: "/v1.0/me",
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` }
        };
        const msReq = https.request(options, (msRes) => {
          let data = "";
          msRes.on("data", (chunk) => data += chunk);
          msRes.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error("Invalid Microsoft profile response"));
            }
          });
        });
        msReq.on("error", reject);
        msReq.end();
      });
      email = (msProfile.mail || msProfile.userPrincipalName || "").toLowerCase();
      name = msProfile.displayName || "";
    } else {
      res.status(400).json({ error: "No access token or mock data provided" });
      return;
    }
    const { user, cart } = await syncUserToDB(email, name);
    const sessionToken = Buffer.from(JSON.stringify({ email, name, iat: Date.now() })).toString("base64");
    res.json({ token: sessionToken, user, cart });
  } catch (error) {
    console.error("Microsoft auth error:", error);
    res.status(500).json({ error: error.message || "Microsoft auth failed" });
  }
});
var otpStore = /* @__PURE__ */ new Map();
var DEMO_OTP = "4821";
app.post("/api/auth/otp/send", (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const expiresAt = Date.now() + 10 * 60 * 1e3;
  otpStore.set(email.toLowerCase(), { code: DEMO_OTP, expiresAt });
  console.log(`[OTP] Code for ${email}: ${DEMO_OTP}`);
  res.json({ success: true, message: "OTP sent successfully" });
});
app.post("/api/auth/otp/verify", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: "Email and OTP code are required" });
    return;
  }
  const storedOtp = otpStore.get(email.toLowerCase());
  if (!storedOtp) {
    res.status(400).json({ error: "No OTP requested for this email. Please request a new one." });
    return;
  }
  if (Date.now() > storedOtp.expiresAt) {
    otpStore.delete(email.toLowerCase());
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }
  if (storedOtp.code !== code.trim()) {
    res.status(400).json({ error: `Invalid OTP code. Please enter ${DEMO_OTP}.` });
    return;
  }
  otpStore.delete(email.toLowerCase());
  const { user, cart } = await syncUserToDB(email.toLowerCase(), "");
  const sessionToken = Buffer.from(JSON.stringify({ email: email.toLowerCase(), iat: Date.now(), method: "otp" })).toString("base64");
  res.json({ token: sessionToken, user, cart });
});
app.get("/api/products", async (req, res) => {
  try {
    const resDb = await db.query("SELECT * FROM products ORDER BY created_at DESC");
    const products = resDb.rows;
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product catalog" });
  }
});
app.post("/api/admin/products/seed", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { force } = req.body || {};
    await seedNeonDatabaseIfEmpty(db, Boolean(force));
    const resDb = await db.query("SELECT * FROM products ORDER BY created_at DESC");
    const products = resDb.rows;
    res.json({ success: true, products: products.map(formatProduct) });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed product catalog" });
  }
});
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resDb = await db.query("SELECT * FROM products WHERE id = $1", [id]);
    const product = resDb.rows[0];
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    if (!adminDb) return res.json([]);
    const snapshot = await adminDb.collection("reviews").where("productId", "==", id).orderBy("createdAt", "desc").get();
    const reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});
app.post("/api/products/:id/reviews", async (req, res) => {
  const { id } = req.params;
  const { rating, comment, reviewerName } = req.body;
  if (!rating || !comment || !reviewerName) {
    return res.status(400).json({ error: "Rating, comment and name are required" });
  }
  try {
    if (adminDb) {
      await adminDb.collection("reviews").add({
        productId: id,
        reviewerName,
        rating,
        comment,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const snapshot = await adminDb.collection("reviews").where("productId", "==", id).get();
      let sum = 0;
      snapshot.forEach((doc) => {
        sum += doc.data().rating;
      });
      const avg = snapshot.size > 0 ? (sum / snapshot.size).toFixed(1) : rating.toFixed(1);
      await db.query(`
        UPDATE products
        SET rating = $1, reviews_count = $2
        WHERE id = $3
      `, [avg, snapshot.size, id]);
    }
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});
app.get("/api/cart", authenticateToken, async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const doc = await adminDb.collection("users").doc(req.user.email).get();
    const data = doc.data();
    res.json(data?.cart || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve cart" });
  }
});
app.post("/api/cart", authenticateToken, async (req, res) => {
  try {
    if (adminDb) {
      await adminDb.collection("users").doc(req.user.email).update({
        cart: req.body.items,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save cart state" });
  }
});
app.get("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const doc = await adminDb.collection("users").doc(req.user.email).get();
    res.json(doc.data()?.wishlist || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve wishlist" });
  }
});
app.post("/api/wishlist", authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (adminDb) {
      const userRef = adminDb.collection("users").doc(req.user.email);
      const doc = await userRef.get();
      const wishlist = doc.data()?.wishlist || [];
      if (!wishlist.includes(productId)) {
        await userRef.update({ wishlist: [...wishlist, productId] });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});
app.delete("/api/wishlist/:productId", authenticateToken, async (req, res) => {
  const { productId } = req.params;
  try {
    if (adminDb) {
      const userRef = adminDb.collection("users").doc(req.user.email);
      const doc = await userRef.get();
      let wishlist = doc.data()?.wishlist || [];
      wishlist = wishlist.filter((id) => id !== productId);
      await userRef.update({ wishlist });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete wishlist item" });
  }
});
app.get("/api/coupons/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    if (adminDb) {
      const doc = await adminDb.collection("coupons").doc(code).get();
      if (!doc.exists) return res.status(404).json({ error: "Invalid or inactive coupon" });
      const coupon = doc.data();
      if (!coupon || !coupon.active) return res.status(404).json({ error: "Invalid or inactive coupon" });
      return res.json(coupon);
    } else {
      const resDb = await db.query("SELECT * FROM coupons WHERE code = $1 AND active = 1", [code]);
      const coupon = resDb.rows[0];
      if (!coupon) return res.status(404).json({ error: "Invalid or inactive coupon" });
      return res.json(coupon);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupon" });
  }
});
app.post("/api/orders/checkout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping, cart, subtotal, tax, total, couponCode, paymentId } = req.body;
    if (!cart || cart.length === 0) return res.status(400).json({ error: "Cart is empty" });
    for (const item of cart) {
      const resDb = await db.query("SELECT stock FROM products WHERE id = $1", [item.product?.id]);
      const prod = resDb.rows[0];
      if (!prod || prod.stock < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${item.product?.name}` });
      }
    }
    for (const item of cart) {
      await db.query("UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2", [item.quantity, item.product?.id]);
    }
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const orderData = {
      id: orderId,
      userId: req.user.email,
      email: req.user.email,
      status: "processing",
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      items: cart.map((item) => ({
        productId: item.product?.id,
        productName: item.product?.name,
        quantity: item.quantity,
        price: item.product?.price,
        customConfig: item.customConfig || null
      }))
    };
    if (adminDb) {
      await adminDb.collection("orders").doc(orderId).set(orderData);
      await adminDb.collection("users").doc(req.user.email).update({ cart: [] });
    }
    res.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to place order" });
  }
});
app.get("/api/orders/history", authenticateToken, async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const snapshot = await adminDb.collection("orders").where("email", "==", req.user.email).orderBy("createdAt", "desc").get();
    const orders = snapshot.docs.map((doc) => doc.data());
    const enrichedOrders = [];
    for (let order of orders) {
      const enrichedItems = [];
      for (let item of order.items) {
        const productDb = await db.query("SELECT * FROM products WHERE id = $1", [item.productId]);
        const product = productDb.rows[0];
        let finalProduct = product ? formatProduct(product) : {
          id: item.productId,
          name: item.productName || "Product",
          image: "",
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
        date: new Date(order.createdAt).toLocaleDateString() + " at " + new Date(order.createdAt).toLocaleTimeString(),
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
    res.status(500).json({ error: "Failed to fetch order history" });
  }
});
app.get("/api/orders/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!adminDb) return res.status(404).json({ error: "Order not found" });
    const doc = await adminDb.collection("orders").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });
    const order = doc.data();
    if (order.email !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});
app.post("/api/orders/:id/cancel", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (!adminDb) return res.status(404).json({ error: "Order not found" });
    const orderRef = adminDb.collection("orders").doc(id);
    const doc = await orderRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });
    const order = doc.data();
    if (order.email !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied" });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Order is already cancelled" });
    }
    await orderRef.update({ status: "cancelled" });
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.productId?.startsWith("bespoke-")) continue;
        await db.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [item.quantity, item.productId]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});
var razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || ""
});
app.post("/api/payments/razorpay/order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }
    const amountPaise = Number(amount);
    if (isNaN(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ error: "Amount must be at least 100 paise (\u20B91)" });
    }
    const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== "YOUR_KEY_ID" && process.env.RAZORPAY_KEY_SECRET !== "YOUR_KEY_SECRET";
    if (!hasKeys) {
      return res.json({
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        order_id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: amountPaise,
        currency: currency || "INR",
        entity: "order",
        isMock: true
      });
    }
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: currency || "INR",
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
  } catch (err) {
    console.error("Razorpay order creation failure:", err);
    res.status(500).json({ error: err.message || "Razorpay order creation failed" });
  }
});
app.post("/api/payments/razorpay/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (razorpay_signature === "mock_signature") {
    return res.json({ verified: true, message: "Mock payment signature accepted" });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required payment fields" });
  }
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
    if (expectedSignature === razorpay_signature) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: "Invalid payment signature" });
    }
  } catch (err) {
    res.status(500).json({ error: "Signature verification error" });
  }
});
app.post("/api/create-order", async (req, res) => {
  const { amount, currency = "INR", receipt } = req.body;
  if (!amount || typeof amount !== "number" || amount < 100) {
    return res.status(400).json({ error: "Amount must be a number >= 100 paise (\u20B91)" });
  }
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`
    });
    res.json({
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error("[RAZORPAY] Create order failed:", err);
    res.status(500).json({ error: err?.error?.description || err?.message || "Failed to create Razorpay order" });
  }
});
app.post("/api/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required payment verification fields" });
  }
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(body.toString()).digest("hex");
    if (expectedSignature === razorpay_signature) {
      return res.json({ verified: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ verified: false, error: "Invalid payment signature" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
app.get("/api/admin/dashboard", authenticateToken, requireAdmin, async (req, res) => {
  try {
    let totalRevenue = 0;
    let ordersCount = 0;
    let customersCount = 0;
    let salesHistory = [];
    if (adminDb) {
      const ordersSnapshot = await adminDb.collection("orders").where("status", "!=", "cancelled").get();
      ordersCount = ordersSnapshot.size;
      ordersSnapshot.forEach((doc) => {
        totalRevenue += doc.data().total || 0;
      });
      const usersSnapshot = await adminDb.collection("users").where("role", "==", "customer").get();
      customersCount = usersSnapshot.size;
      const dailyMap = {};
      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt) {
          const d = new Date(data.createdAt).toISOString().split("T")[0];
          dailyMap[d] = (dailyMap[d] || 0) + (data.total || 0);
        }
      });
      salesHistory = Object.entries(dailyMap).map(([date, daily_total]) => ({ date, daily_total })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    }
    const lowStockItemsDb = await db.query("SELECT COUNT(id) as count FROM products WHERE stock <= 5");
    const lowStockItems = lowStockItemsDb.rows[0];
    const lowStockListDb = await db.query(`
      SELECT id, name, stock, price, image_url
      FROM products
      WHERE stock <= 5
      ORDER BY stock ASC
      LIMIT 10
    `);
    const lowStockList = lowStockListDb.rows;
    res.json({
      stats: {
        totalRevenue: totalRevenue || 0,
        ordersCount: ordersCount || 0,
        customersCount: customersCount || 0,
        lowStockAlerts: lowStockItems.count || 0
      },
      salesHistory,
      lowStockList
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate dashboard metrics" });
  }
});
app.get("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const resDb = await db.query("SELECT * FROM products ORDER BY created_at DESC");
    const products = resDb.rows;
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve product list" });
  }
});
app.post("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      image_data,
      image_url,
      models,
      materials,
      colors,
      tags,
      features,
      magsafe,
      bestseller,
      ecoFriendly
    } = req.body;
    if (!name || price === void 0 || price < 0) {
      return res.status(400).json({ error: "Product name and price are required" });
    }
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const modelsJson = JSON.stringify(models || ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "Samsung Galaxy S24 Ultra", "Google Pixel 8 Pro"]);
    const materialsJson = JSON.stringify(materials || ["Smooth Liquid Silicone", "Ultra-Tough Polycarbonate"]);
    const colorsJson = JSON.stringify(colors || [
      { id: "charcoal", name: "Midnight Charcoal", value: "#1A1B1C", bgClass: "bg-[#1A1B1C]", textContrast: "light" },
      { id: "sand", name: "Alabaster Sand", value: "#DFD3C3", bgClass: "bg-[#DFD3C3]", textContrast: "dark" }
    ]);
    const tagsJson = JSON.stringify(tags || ["MagSafe Compatible", "Premium Build"]);
    const featuresJson = JSON.stringify(features || ["10ft Drop Protection", "MagSafe Compatible", "Scratch Resistant Coating"]);
    await db.query(`
      INSERT INTO products (
        id, name, description, price, stock, category, image_data, image_url,
        models, materials, colors, tags, features, magsafe, bestseller, eco_friendly
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      id,
      name.trim(),
      description || "",
      Number(price),
      Number(stock) || 0,
      category || "general",
      image_data || "",
      image_url || "",
      modelsJson,
      materialsJson,
      colorsJson,
      tagsJson,
      featuresJson,
      magsafe ? 1 : 0,
      bestseller ? 1 : 0,
      ecoFriendly ? 1 : 0
    ]);
    const resDb = await db.query("SELECT * FROM products WHERE id = $1", [id]);
    const created = resDb.rows[0];
    res.status(201).json({ success: true, product: formatProduct(created) });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});
app.put("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      image_data,
      image_url,
      models,
      materials,
      colors,
      tags,
      features,
      magsafe,
      bestseller,
      ecoFriendly
    } = req.body;
    if (!name || price === void 0 || Number(price) < 0) {
      return res.status(400).json({ error: "Name and price are required" });
    }
    const fieldsToUpdate = [];
    const values = [];
    let paramIdx = 1;
    fieldsToUpdate.push(`name = $${paramIdx++}`);
    values.push(name.trim());
    fieldsToUpdate.push(`description = $${paramIdx++}`);
    values.push(description || "");
    fieldsToUpdate.push(`price = $${paramIdx++}`);
    values.push(Number(price));
    fieldsToUpdate.push(`category = $${paramIdx++}`);
    values.push(category || "general");
    fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
    if (image_data !== void 0) {
      fieldsToUpdate.push(`image_data = $${paramIdx++}`);
      values.push(image_data);
    }
    if (image_url !== void 0) {
      fieldsToUpdate.push(`image_url = $${paramIdx++}`);
      values.push(image_url);
    }
    if (models !== void 0) {
      fieldsToUpdate.push(`models = $${paramIdx++}`);
      values.push(JSON.stringify(models));
    }
    if (materials !== void 0) {
      fieldsToUpdate.push(`materials = $${paramIdx++}`);
      values.push(JSON.stringify(materials));
    }
    if (colors !== void 0) {
      fieldsToUpdate.push(`colors = $${paramIdx++}`);
      values.push(JSON.stringify(colors));
    }
    if (tags !== void 0) {
      fieldsToUpdate.push(`tags = $${paramIdx++}`);
      values.push(JSON.stringify(tags));
    }
    if (features !== void 0) {
      fieldsToUpdate.push(`features = $${paramIdx++}`);
      values.push(JSON.stringify(features));
    }
    if (magsafe !== void 0) {
      fieldsToUpdate.push(`magsafe = $${paramIdx++}`);
      values.push(magsafe ? 1 : 0);
    }
    if (bestseller !== void 0) {
      fieldsToUpdate.push(`bestseller = $${paramIdx++}`);
      values.push(bestseller ? 1 : 0);
    }
    if (ecoFriendly !== void 0) {
      fieldsToUpdate.push(`eco_friendly = $${paramIdx++}`);
      values.push(ecoFriendly ? 1 : 0);
    }
    values.push(id);
    await db.query(`UPDATE products SET ${fieldsToUpdate.join(", ")} WHERE id = $${paramIdx}`, values);
    const resDb = await db.query("SELECT * FROM products WHERE id = $1", [id]);
    const updated = resDb.rows[0];
    res.json({ success: true, product: formatProduct(updated) });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});
app.put("/api/admin/products/:id/stock", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  if (stock === void 0 || Number(stock) < 0) {
    return res.status(400).json({ error: "Valid stock quantity required" });
  }
  try {
    await db.query("UPDATE products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [Number(stock), id]);
    const resDb = await db.query("SELECT id, name, stock FROM products WHERE id = $1", [id]);
    const updated = resDb.rows[0];
    res.json({ success: true, id, stock: updated?.stock });
  } catch (err) {
    res.status(500).json({ error: "Failed to update stock" });
  }
});
app.delete("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const resDb = await db.query("SELECT id FROM products WHERE id = $1", [id]);
    const product = resDb.rows[0];
    if (!product) return res.status(404).json({ error: "Product not found" });
    await db.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});
app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const snapshot = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
    const orders = snapshot.docs.map((doc) => doc.data());
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
});
app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status required" });
  try {
    if (adminDb) {
      await adminDb.collection("orders").doc(id).update({ status });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});
app.get("/api/admin/coupons", authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (adminDb) {
      const snapshot = await adminDb.collection("coupons").get();
      const coupons = snapshot.docs.map((doc) => doc.data());
      return res.json(coupons);
    } else {
      const resDb = await db.query("SELECT * FROM coupons ORDER BY code ASC");
      return res.json(resDb.rows);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});
app.post("/api/admin/coupons", authenticateToken, requireAdmin, async (req, res) => {
  const { code, discount_type, discount_value, min_purchase, expires_at } = req.body;
  if (!code || !discount_type || discount_value === void 0) {
    return res.status(400).json({ error: "Code, type, and discount value required" });
  }
  const couponCode = code.toUpperCase();
  const couponData = {
    code: couponCode,
    discount_type,
    discount_value: Number(discount_value),
    min_purchase: Number(min_purchase) || 0,
    expires_at: expires_at || null,
    active: 1,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    if (adminDb) {
      await adminDb.collection("coupons").doc(couponCode).set(couponData, { merge: true });
    }
    await db.query(`
      INSERT INTO coupons (code, discount_type, discount_value, min_purchase, expires_at, active)
      VALUES ($1, $2, $3, $4, $5, 1)
      ON CONFLICT(code) DO UPDATE SET discount_type = EXCLUDED.discount_type, discount_value = EXCLUDED.discount_value, min_purchase = EXCLUDED.min_purchase, expires_at = EXCLUDED.expires_at, active = 1
    `, [couponCode, discount_type, Number(discount_value), Number(min_purchase) || 0, expires_at || null]).catch(() => {
    });
    res.status(201).json({ success: true, coupon: couponData });
  } catch (err) {
    res.status(500).json({ error: "Failed to create coupon" });
  }
});
app.delete("/api/admin/coupons/:code", authenticateToken, requireAdmin, async (req, res) => {
  const couponCode = req.params.code.toUpperCase();
  try {
    if (adminDb) {
      await adminDb.collection("coupons").doc(couponCode).delete();
    }
    await db.query("DELETE FROM coupons WHERE code = $1", [couponCode]).catch(() => {
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});
app.post("/api/newsletter/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    if (adminDb) {
      await adminDb.collection("newsletter_subscribers").doc(email.toLowerCase()).set({
        email: email.toLowerCase(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }, { merge: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Subscription failed" });
  }
});
var distPath = path2.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  console.log("Serving production-built assets from:", distPath);
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
} else {
  console.log("Static directory dist/ does not exist. Frontend dev proxy server active.");
}
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5e3;
  app.listen(PORT, () => {
    console.log(`[YOGANTAK API SERVER] listening on http://localhost:${PORT}`);
  });
}
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large. Please upload a smaller image." });
  }
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error" });
});
var server_default = app;

// api/index.ts
var index_default = server_default;
export {
  index_default as default
};
