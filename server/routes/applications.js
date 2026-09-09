import { Router } from "express";
import mongoose from "mongoose";
import Application, { STATUS_VALUES } from "../models/Application.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Everything below is per-user data. requireAuth sets req.userId, and every
// query below filters on it — a missing filter would leak another user's rows.
router.use(requireAuth);

// A malformed :id would otherwise reach Mongoose and surface as a CastError
// that 400s and echoes the internal model name. Reject it here as a clean 404,
// once, for all three /:id routes.
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: "Application not found" });
  }
  next();
});

// userId is derived from the verified token, never from the request body,
// so a client can't reassign a record to (or read) someone else's account
function ownFields(body) {
  const { userId, _id, ...rest } = body || {};
  return rest;
}

// GET /api/applications/stats — dashboard summary counts (before /:id so "stats" isn't read as an id)
router.get("/stats", async (req, res, next) => {
  try {
    const owner = { userId: req.userId };
    const total = await Application.countDocuments(owner);

    const statusCounts = Object.fromEntries(STATUS_VALUES.map((s) => [s, 0]));
    const grouped = await Application.aggregate([
      { $match: owner },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    grouped.forEach(({ _id, count }) => {
      statusCounts[_id] = count;
    });

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingInterviews = await Application.find({
      ...owner,
      interviewDate: { $gte: now, $lte: in7Days },
    })
      .sort({ interviewDate: 1 })
      .select("company position interviewDate");

    res.json({ total, statusCounts, upcomingInterviews });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications?search=&status= — list, with optional search/filter
router.get("/", async (req, res, next) => {
  try {
    // Express parses ?status[$ne]=x into an object, which would inject a Mongo
    // operator into the query (and crash .replace below). Accept only strings.
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const query = { userId: req.userId };
    if (status) query.status = status;
    if (search) {
      // escape regex metacharacters so a search for "c++" isn't a syntax error,
      // and cap length so a huge pattern can't tie up the regex engine
      const escaped = search.slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "i");
      query.$or = [{ company: re }, { position: re }];
    }
    const applications = await Application.find(query).sort({ dateApplied: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id
router.get("/:id", async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.userId });
    if (!application) return res.status(404).json({ error: "Application not found" });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

// POST /api/applications
router.post("/", async (req, res, next) => {
  try {
    const application = await Application.create({ ...ownFields(req.body), userId: req.userId });
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

// PUT /api/applications/:id — full or partial update (also used for quick inline status changes)
router.put("/:id", async (req, res, next) => {
  try {
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      ownFields(req.body),
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ error: "Application not found" });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!application) return res.status(404).json({ error: "Application not found" });
    res.json({ message: "Application deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
