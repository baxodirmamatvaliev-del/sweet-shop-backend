import mongoose, { Schema } from "mongoose";
import { CakeOptionType } from "../libs/enums/cake.enum";

const CakeOptionSchema = new Schema(
  {
    optionType: {
      type: String,
      enum: Object.values(CakeOptionType),
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    priceModifier: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
    },
    previewImage: {
      type: String,
      trim: true,
      default: "",
    },
    previewColor: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

CakeOptionSchema.index({ optionType: 1, code: 1 }, { unique: true });

export default mongoose.model("CakeOption", CakeOptionSchema);
