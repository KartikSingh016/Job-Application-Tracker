import express from "express";
import cors from "cors";
import applicationsRouter from "./routes/applications.js";
import authRouter from "./routes/auth.js";
import { connectDB } from "./config/db.js";

const app = express();

// Lock the API to the deployed client when CLIENT_ORIGIN is set; fall back to
// reflecting the request origin in local dev, where the port varies.
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));
app.use(express.json());

// Connect lazily, AFTER cors has already answered preflight OPTIONS — those
// need no database, and gating them behind the connection is what let a slow
// Mongo connection break CORS itself. On failure this reaches the error
// handler below, which still carries the cors headers, so the browser sees a
// real 500 instead of a blocked request ("Can't reach the API").
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/applications", applicationsRouter);

// central error handler — Mongoose validation errors become 400s, everything else is a 500
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Server error" });
});

export default app;
