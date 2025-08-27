import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";

import createApp from "./lib/create-app";
import { auth } from "./lib/auth";
import products from "./routes/products";

import { Hono } from "hono";
import { logger } from "hono/logger";

const app = createApp();

// CORS middleware HARUS PERTAMA - sebelum routes apapun
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8081",
      "http://192.168.0.137:8081",
      "exp://192.168.0.137:8081",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  })
);

app.use(logger());

// Basic routes
app.get("/", (c) => c.text("Hello Hono!"));
app.get("/debug", (c) => {
  return c.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Server is running correctly",
  });
});

app.get("/debug/routes", (c) => {
  return c.json({
    message: "Available API routes",
    endpoints: {
      "sign-up": "POST /api/auth/sign-up/email",
      "sign-in": "POST /api/auth/sign-in/email",
      "sign-out": "POST /api/auth/sign-out",
      session: "GET /api/auth/session",
      "products-list": "GET /api/products",
      "product-detail": "GET /api/products/:id",
    },
  });
});

// === BETTER AUTH HANDLER - CARA YANG BENAR ===
// Pakai app.on dengan method array seperti di docs Better Auth
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  console.log(`🔐 Auth request: ${c.req.method} ${c.req.url}`);
  return auth.handler(c.req.raw);
});

// === PRODUCTS ROUTES - MOUNT SETELAH AUTH ===
// Mount dengan prefix /api (bukan /api/products karena routes sudah punya /products)
app.route("/api", products);

// Static files - paling akhir
app.get("/test", serveStatic({ path: "./public/test.html" }));
app.get("/test-fresh", serveStatic({ path: "./public/test-fresh.html" }));
app.get(
  "/test-product",
  serveStatic({ path: "./public/test-create-product.html" })
);
app.get("*", serveStatic({ root: "../client/dist" }));
app.get("*", serveStatic({ path: "index.html", root: "../client/dist" }));

export type AppType = typeof products;

export default app;
