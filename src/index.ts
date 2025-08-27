import app from "./app";

const port = process.env.PORT || 3000;

// Export for Vercel serverless functions
export default app;

// Local development with Bun (only runs when not in production)
if (process.env.NODE_ENV !== "production") {
  console.log(`Server is running on http://localhost:${port}`);

  Bun.serve({
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port,
  });
}
