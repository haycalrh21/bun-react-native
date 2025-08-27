import { auth } from "../lib/auth";
import { createRouter } from "../lib/create-app";

const router = createRouter();

// Debug: Log all auth routes
router.all("/auth/*", async (c, next) => {
  console.log(`📍 Auth route called: ${c.req.method} ${c.req.url}`);
  console.log(`📍 Path: ${c.req.path}`);
  return next();
});

// Debug endpoint to list Better Auth routes
router.get("/auth-debug", (c) => {
  return c.json({
    message: "Better Auth Debug Info",
    availableEndpoints: {
      "Email Sign Up": "POST /api/auth/sign-up/email",
      "Email Sign In": "POST /api/auth/sign-in/email",
      Session: "GET /api/auth/session",
      "Sign Out": "POST /api/auth/sign-out",
    },
    note: "These are the correct Better Auth endpoints",
    samplePayload: {
      signUp: {
        email: "user@example.com",
        password: "password123",
        name: "User Name",
      },
      signIn: { email: "user@example.com", password: "password123" },
    },
  });
});

// Add preflight OPTIONS handler for CORS
router.options("/auth/**", (c) => {
  return new Response("", { status: 204 });
});

router.on(["POST", "GET"], "/auth/**", async (c) => {
  try {
    console.log(`Auth request: ${c.req.method} ${c.req.url}`);
    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("Headers:", headers);

    const response = await auth.handler(c.req.raw);

    console.log("Auth response status:", response.status);
    return response;
  } catch (error) {
    console.error("Auth error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return c.json(
      { error: "Authentication failed", details: errorMessage },
      500
    );
  }
});

export default router;
