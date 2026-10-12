import mongoose, { Schema } from "mongoose";

const DeliverySlotSchema = new Schema(
  {
    date: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
      required: true,
    },
    endTime: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
      required: true,
    },
    capacity: {
      type: Number,
      min: 1,
      required: true,
      validate: Number.isInteger,
    },
    reservedCount: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
      validate: Number.isInteger,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

DeliverySlotSchema.index(
  { date: 1, startTime: 1, endTime: 1 },
  { unique: true },
);

export default mongoose.model("DeliverySlot", DeliverySlotSchema);
