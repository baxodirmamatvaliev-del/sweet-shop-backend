import mongoose, { Schema } from "mongoose";

const AiDesignQuotaSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    dayKey: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
      required: true,
    },
    used: {
      type: Number,
      min: 0,
      max: 3,
      default: 0,
      required: true,
    },
  },
  { timestamps: true },
);

AiDesignQuotaSchema.index({ memberId: 1, dayKey: 1 }, { unique: true });

export default mongoose.model("AiDesignQuota", AiDesignQuotaSchema);
