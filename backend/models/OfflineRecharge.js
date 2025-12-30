import mongoose from "mongoose";

// Schema for Offline Request Recharge
const offlineRequestSchema = new mongoose.Schema(
  {
    retailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    bank: {
      type: String,
      required: true,
    },
    utr: {
      type: String,
      required: true,
      unique: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    mode: {
      type: String,
      enum: ["UPI", "IMPS", "NEFT"],
      default: "UPI",
      
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminRemarks: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("OfflineRequestRecharge", offlineRequestSchema);