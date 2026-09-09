import mongoose from "mongoose";

const STATUSES = ["Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"];

const applicationSchema = new mongoose.Schema(
  {
    // every application belongs to exactly one user; all queries filter on this
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    status: { type: String, enum: STATUSES, default: "Applied" },
    dateApplied: { type: Date, required: true },
    interviewDate: { type: Date },
    location: { type: String, trim: true },
    jobUrl: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// the dashboard's default view: one user's applications, newest first
applicationSchema.index({ userId: 1, dateApplied: -1 });

export const STATUS_VALUES = STATUSES;
export default mongoose.model("Application", applicationSchema);
