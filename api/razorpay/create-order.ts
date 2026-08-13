import type { IncomingMessage, ServerResponse } from "http";
import Razorpay from "razorpay";

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
    const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!key_id || !key_secret) {
      return sendJson(res, 500, {
        error: "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required on server.",
      });
    }

    const body = await parseBody(req);
    const { amount: rawAmount, currency = "INR", receipt, notes } = body || {};
    const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

    if (amount === undefined || amount === null || typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return sendJson(res, 400, {
        error: "Invalid amount. 'amount' is required and must be a positive number.",
      });
    }

    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    return sendJson(res, 200, {
      success: true,
      order,
      key_id,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return sendJson(res, 500, {
      error: error.message || "Failed to create Razorpay order",
    });
  }
}
