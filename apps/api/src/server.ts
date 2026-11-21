import { app } from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`[TraceDeck API] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`[TraceDeck API] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("[TraceDeck API] HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
