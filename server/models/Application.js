import mongoose from "mongoose";

const STATUSES = ["Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"];

const applicationSchema = new mongoose.Schema(
  {
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

export const STATUS_VALUES = STATUSES;
export default mongoose.model("Application", applicationSchema);
