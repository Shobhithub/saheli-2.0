// src/config/db.js
import mongoose from "mongoose";

/**
 * Prefer MONGO_URI_SAHELI (your existing var), fallback to MONGO_URI, then localhost.
 */
const getMongoUri = () =>
  process.env.MONGO_URI_SAHELI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/saheli";

// Fail buffered operations quickly when Mongo is unreachable
mongoose.set("bufferTimeoutMS", 5000);

// Optional (recommended) to avoid query strictness warnings across versions
// mongoose.set("strictQuery", true);

/**
 * Connect to MongoDB with retry support.
 *
 * @param {Object} options
 * @param {boolean} [options.retry=true] Keep retrying in background (server mode).
 * @param {number} [options.maxRetries=Infinity] Max retries (useful for scripts).
 * @param {number} [options.retryDelayMs=5000] Initial retry delay.
 * @param {number} [options.serverSelectionTimeoutMS=5000] Fail fast if server not reachable.
 * @returns {Promise<mongoose.Connection|null>}
 */
const connectDB = async ({
  retry = true,
  maxRetries = Number.POSITIVE_INFINITY,
  retryDelayMs = 5000,
  serverSelectionTimeoutMS = 5000,
} = {}) => {
  const uri = getMongoUri();

  let attempt = 0;

  const connectOnce = async () => {
    attempt += 1;

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS,
        // You can add more options if needed:
        // dbName: "saheli",
      });

      console.log(`MongoDB Connected: ${conn.connection.host}`);

      // Helpful runtime logs
      mongoose.connection.on("error", (err) => {
        console.error("MongoDB runtime error:", err?.message || err);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected.");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("MongoDB reconnected.");
      });

      return conn.connection;
    } catch (error) {
      console.error(`MongoDB Connection Error (attempt ${attempt}): ${error.message}`);

      if (!retry || attempt >= maxRetries) {
        console.error("MongoDB connection failed and retry is disabled/exhausted.");
        console.error("Is MongoDB running? Example: `mongod` or Windows service `MongoDB`");
        throw error;
      }

      // Simple exponential backoff (capped)
      const backoff = Math.min(retryDelayMs * Math.pow(1.4, attempt - 1), 30000);
      console.log(`Retrying MongoDB connection in ${Math.round(backoff)} ms...`);

      await new Promise((r) => setTimeout(r, backoff));
      return connectOnce();
    }
  };

  const connection = await connectOnce();
  return connection;
};

export default connectDB;