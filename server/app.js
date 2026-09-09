import express from "express";
import cors from "cors";
import applicationsRouter from "./routes/applications.js";
import authRouter from "./routes/auth.js";

const app = express();

// Lock the API to the deployed client when CLIENT_ORIGIN is set; fall back to
// reflecting the request origin in local dev, where the port varies.
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));
app.use(express.json());

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
