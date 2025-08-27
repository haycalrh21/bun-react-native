import app from "./app";

const port = process.env.PORT || 3000;

// eslint-disable-next-line no-console
console.log(`Server is running on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port,
});
