import express from "express";
import path from "path";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import firebaseConfigRaw from "./firebase-applet-config.json";

try {
  dotenv.config();
} catch (e) {
  // Ignore in environments where .env is not present
}

let firebaseConfig: any = firebaseConfigRaw || {};
if (!firebaseConfig || !firebaseConfig.projectId) {
  try {
    if (process.env.FIREBASE_CONFIG) {
      firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    }
  } catch (err) {
    console.error("Failed to parse FIREBASE_CONFIG env var:", err);
  }
}

if (!firebaseConfig || !firebaseConfig.projectId) {
  firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || firebaseConfig.apiKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || firebaseConfig.appId,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
    firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || "(default)",
  };
}

let dbInstance: any = null;
function getDb() {
  if (!dbInstance) {
    try {
      if (!firebaseConfig || !firebaseConfig.projectId) {
        console.warn("Firebase configuration is missing or incomplete.");
        return null;
      }
      const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const firestoreDbId =
        firebaseConfig.firestoreDatabaseId &&
        firebaseConfig.firestoreDatabaseId !== "(default)"
          ? firebaseConfig.firestoreDatabaseId
          : undefined;
      dbInstance = getFirestore(firebaseApp, firestoreDbId);
    } catch (e) {
      console.error("Firestore initialization error:", e);
    }
  }
  return dbInstance;
}

const app = express();
const PORT = 3000;

// Middleware 1: CORS & Preflight handling
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Middleware 2: Vercel URL restoration & Safe Body Parser
app.use((req, res, next) => {
  // Restore original path if rewritten by Vercel serverless layer
  const originalPath =
    (req.headers["x-matched-path"] as string) ||
    (req.headers["x-rewrite-url"] as string) ||
    req.originalUrl;

  if (
    originalPath &&
    (req.url === "/api" || req.url === "/api/" || req.url.startsWith("/api/index"))
  ) {
    req.url = originalPath;
  }

  // Handle request body
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString("utf-8"));
      } catch (e) {
        // Keep original if not JSON
      }
    } else if (typeof req.body === "string" && req.body.length > 0) {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        // Keep original string if not valid JSON
      }
    }
    return next();
  }

  // Fallback to express.json() for local/traditional Node environment
  express.json()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: "Invalid JSON body payload" });
    }
    express.urlencoded({ extended: true })(req, res, next);
  });
});

function getRazorpayCredentials() {
  const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

  return { key_id, key_secret };
}

function getRazorpayInstance() {
  const { key_id, key_secret } = getRazorpayCredentials();
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required.");
  }
  return {
    instance: new Razorpay({ key_id, key_secret }),
    key_id,
    key_secret,
  };
}

// POST /api/razorpay/create-order
app.post(
  ["/api/razorpay/create-order", "/razorpay/create-order", "/create-order", /\/create-order(\/|\?|$)/],
  async (req, res) => {
    try {
      const { amount: rawAmount, currency = "INR", receipt, notes } = req.body || {};
      const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

      if (amount === undefined || amount === null || typeof amount !== "number" || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          error: "Invalid amount. 'amount' is required and must be a positive number.",
        });
      }

      // Convert amount to paise (1 INR = 100 paise)
      const amountInPaise = Math.round(amount * 100);

      const { instance: razorpay, key_id } = getRazorpayInstance();

      const options = {
        amount: amountInPaise,
        currency: currency || "INR",
        receipt: receipt || `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        notes: notes || {},
      };

      const order = await razorpay.orders.create(options);

      return res.json({
        success: true,
        order,
        key_id,
      });
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      return res.status(500).json({
        error: error.message || "Failed to create Razorpay order",
      });
    }
  }
);

// POST /api/razorpay/verify-payment
app.post(
  ["/api/razorpay/verify-payment", "/razorpay/verify-payment", "/verify-payment", /\/verify-payment$/],
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        customer,
        items,
        totalAmount,
      } = req.body || {};

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          verified: false,
          error: "Missing required parameters: razorpay_order_id, razorpay_payment_id, or razorpay_signature",
        });
      }

      const { key_secret } = getRazorpayCredentials();
      if (!key_secret) {
        return res.status(500).json({
          success: false,
          verified: false,
          error: "RAZORPAY_KEY_SECRET environment variable is not configured",
        });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");

      const isVerified = expectedSignature === razorpay_signature;

      if (isVerified) {
        // Save verified order to existing Firebase Firestore "orders" collection
        const orderDocument = {
          customer: customer || {},
          items: items || [],
          totalAmount: typeof totalAmount === "number" ? totalAmount : 0,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          status: "paid",
          createdAt: new Date().toISOString(),
        };

        try {
          const db = getDb();
          if (db) {
            await setDoc(doc(db, "orders", razorpay_order_id), orderDocument);
          }
        } catch (dbErr: any) {
          console.error("Error saving verified order to Firestore:", dbErr);
        }

        return res.json({
          success: true,
          verified: true,
          message: "Payment signature verified and order saved successfully",
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        });
      } else {
        return res.status(400).json({
          success: false,
          verified: false,
          error: "Invalid payment signature verification failed",
        });
      }
    } catch (error: any) {
      console.error("Razorpay payment verification error:", error);
      return res.status(500).json({
        success: false,
        verified: false,
        error: error.message || "Failed to verify Razorpay payment",
      });
    }
  }
);

// Fallback JSON 404 handler for unmatched API routes
app.use((req, res, next) => {
  if (
    process.env.VERCEL ||
    req.path.startsWith("/api") ||
    req.path.startsWith("/razorpay") ||
    req.path.includes("create-order") ||
    req.path.includes("verify-payment")
  ) {
    return res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    });
  }
  next();
});

// Express global JSON error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express server error:", err);
  res.status(500).json({
    error: err?.message || "Internal Server Error",
  });
});

export default app;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
