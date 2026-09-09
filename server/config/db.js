import mongoose from "mongoose";

// Serverless keeps the module warm between requests, so we cache the connection
// PROMISE on the global object and reuse it. Checking readyState alone is not
// enough: a socket stuck mid-connect (readyState 2) or dropped after a network
// blip reports "not disconnected" but never completes a query, which on Vercel
// buffers until the 30s function timeout. Caching the promise — and dropping it
// on failure so the next request retries — avoids that trap.
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set (check your .env file)");

    // Fail fast (8s) instead of hanging to the 30s function limit, and don't
    // buffer queries against a connection that isn't up yet — surface the error.
    mongoose.set("bufferCommands", false);
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then((m) => m.connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // let the next request try again rather than caching a dead promise
    throw err;
  }
  return cached.conn;
}
