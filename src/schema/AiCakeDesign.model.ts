import mongoose, { Schema } from "mongoose";

const AiCakeDesignSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

AiCakeDesignSchema.index({ memberId: 1, createdAt: -1 });

export default mongoose.model("AiCakeDesign", AiCakeDesignSchema);
