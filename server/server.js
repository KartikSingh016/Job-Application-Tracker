import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
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

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
