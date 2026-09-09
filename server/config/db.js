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

    // Fail in a bounded time instead of hanging, and don't buffer queries
    // against a connection that isn't up yet — surface the error. 12s leaves
    // room for a cold serverless start's DNS + TLS handshake to the replica set.
    mongoose.set("bufferCommands", false);
    // family: 4 forces IPv4. Vercel functions can egress over IPv6, which the
    // Atlas allowlist's 0.0.0.0/0 (IPv4-only) does not cover, so Atlas rejects
    // the TLS handshake with "tlsv1 alert internal error". Pinning to IPv4
    // keeps the connection within the allowlisted range.
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 12000, family: 4 })
      .then((m) => m.connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // let the next request try again rather than caching a dead promise
    // ponytail: temporary diagnostic — surface the per-node socket error that
    // util.inspect otherwise collapses, so we can see timeout vs refused vs TLS.
    try {
      const servers = err?.reason?.servers;
      if (servers) {
        for (const [host, desc] of servers) {
          console.error(`DBDIAG node ${host}: type=${desc.type} error=${desc.error?.message || "none"}`);
        }
      }
    } catch {}
    throw err;
  }
  return cached.conn;
}
