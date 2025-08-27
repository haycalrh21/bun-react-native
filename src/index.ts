import app from "./app";

const port = process.env.PORT || 3000;

// Check if running in Vercel environment
if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  // Export for Vercel serverless functions
  export default app.fetch;
} else {
  // Local development with Bun
  console.log(`Server is running on http://localhost:${port}`);

  Bun.serve({
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port,
  });
}
