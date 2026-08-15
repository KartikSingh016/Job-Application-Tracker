import express from "express";
import cors from "cors";
import applicationsRouter from "./routes/applications.js";

const app = express();

app.use(cors());
app.use(express.json());

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
