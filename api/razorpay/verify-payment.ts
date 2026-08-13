import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

interface ApiRequest extends IncomingMessage {
  body?: any;
  query?: any;
}

interface ApiResponse extends ServerResponse {
  status?: (statusCode: number) => ApiResponse;
  json?: (data: any) => void;
  send?: (data: any) => void;
}

function sendJson(res: any, status: number, data: any) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function parseBody(req: any): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") {
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (e) {
        return Promise.resolve({});
      }
    }
    return Promise.resolve(req.body);
  }

  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk: any) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

let dbInstance: any = null;
function getDb() {
  if (!dbInstance) {
    try {
      const activeConfig: any = firebaseConfig && (firebaseConfig as any).projectId ? firebaseConfig : {
        apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
        measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID,
        firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || "(default)",
      };
      
      const firebaseApp = getApps().length ? getApp() : initializeApp(activeConfig);
      const firestoreDbId =
        activeConfig.firestoreDatabaseId && activeConfig.firestoreDatabaseId !== "(default)"
          ? activeConfig.firestoreDatabaseId
          : undefined;
      dbInstance = getFirestore(firebaseApp, firestoreDbId);
    } catch (e) {
      console.error("Firestore initialization error in verify-payment:", e);
    }
  }
  return dbInstance;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method Not Allowed" });
  }

  try {
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!key_secret) {
      return sendJson(res, 500, {
        success: false,
        verified: false,
        error: "RAZORPAY_KEY_SECRET environment variable is not configured on server.",
      });
    }

    const body = await parseBody(req);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      items,
      totalAmount,
    } = body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendJson(res, 400, {
        success: false,
        verified: false,
        error: "Missing required parameters: razorpay_order_id, razorpay_payment_id, or razorpay_signature",
      });
    }

    const payload = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(payload)
      .digest("hex");

    const isVerified = expectedSignature === razorpay_signature;

    if (isVerified) {
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

      return sendJson(res, 200, {
        success: true,
        verified: true,
        message: "Payment signature verified and order saved successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      return sendJson(res, 400, {
        success: false,
        verified: false,
        error: "Invalid payment signature verification failed",
      });
    }
  } catch (error: any) {
    console.error("Razorpay payment verification error:", error);
    return sendJson(res, 500, {
      success: false,
      verified: false,
      error: error.message || "Failed to verify Razorpay payment",
    });
  }
}
