import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// ponytail: stateless tokens, so signing out only clears the client's copy and a
// leaked token stays valid until it expires. Add a server-side revocation list
// (or drop the TTL) if that window matters.
const TOKEN_TTL = "7d";

function secret() {
  const value = process.env.JWT_SECRET;
  // Fail loudly rather than signing with a blank key — an empty secret would
  // make every forged token valid.
  if (!value) throw new Error("JWT_SECRET is not set (check your .env file)");
  return value;
}

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, secret(), { expiresIn: TOKEN_TTL });
}

// Gate for every route that touches a user's own data. Sets req.userId.
export function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: "Sign in required" });

  try {
    const payload = jwt.verify(token, secret());
    if (!mongoose.isValidObjectId(payload.sub)) {
      return res.status(401).json({ error: "Invalid session" });
    }
    // Hand downstream queries a real ObjectId, not a string. find() would cast
    // it from the schema, but an aggregation $match compares raw values and
    // would silently match nothing — so the cast belongs here, once, for all
    // callers rather than at each query.
    req.userId = new mongoose.Types.ObjectId(payload.sub);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired — please sign in again" });
    }
    res.status(401).json({ error: "Invalid session" });
  }
}
