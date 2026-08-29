import mongoose, { Schema } from "mongoose";

const QuickOrderSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "CANCELLED"],
      default: "NEW",
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("QuickOrder", QuickOrderSchema);
