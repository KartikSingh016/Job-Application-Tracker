import { Router } from "express";
import Application, { STATUS_VALUES } from "../models/Application.js";

const router = Router();

// GET /api/applications/stats — dashboard summary counts (before /:id so "stats" isn't read as an id)
router.get("/stats", async (req, res, next) => {
  try {
    const total = await Application.countDocuments();

    const statusCounts = Object.fromEntries(STATUS_VALUES.map((s) => [s, 0]));
    const grouped = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    grouped.forEach(({ _id, count }) => {
      statusCounts[_id] = count;
    });

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingInterviews = await Application.find({
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
    const { search, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      const re = new RegExp(search, "i");
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
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: "Application not found" });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

// POST /api/applications
router.post("/", async (req, res, next) => {
  try {
    const application = await Application.create(req.body);
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

// PUT /api/applications/:id — full or partial update (also used for quick inline status changes)
router.put("/:id", async (req, res, next) => {
  try {
    const application = await Application.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!application) return res.status(404).json({ error: "Application not found" });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ error: "Application not found" });
    res.json({ message: "Application deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
