import type { IncomingMessage, ServerResponse } from "http";

export default function handler(req: IncomingMessage, res: ServerResponse & { status?: any; json?: any }) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(200).json({ status: "ok" });
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ status: "ok" }));
}
