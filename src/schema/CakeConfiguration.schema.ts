// Retained to read historical order snapshots; cake creation has been retired.
import { Schema } from "mongoose";
import { CakeOptionType } from "../libs/enums/cake.enum";

const CakeOptionSnapshotSchema = new Schema(
  {
    optionId: {
      type: Schema.Types.ObjectId,
      ref: "CakeOption",
      required: true,
    },
    optionType: {
      type: String,
      enum: Object.values(CakeOptionType),
      required: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    priceModifier: {
      type: Number,
      min: 0,
      required: true,
    },
  },
  { _id: false },
);

const CakeLayerSnapshotSchema = new Schema(
  {
    position: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    sponge: {
      type: CakeOptionSnapshotSchema,
      required: true,
    },
    filling: {
      type: CakeOptionSnapshotSchema,
      required: true,
    },
  },
  { _id: false },
);

export const CakeConfigurationSnapshotSchema = new Schema(
  {
    size: {
      type: CakeOptionSnapshotSchema,
      required: true,
    },
    layers: {
      type: [CakeLayerSnapshotSchema],
      required: true,
      validate: {
        validator: (layers: unknown[]) =>
          layers.length >= 1 && layers.length <= 5,
        message: "A cake must have between one and five layers.",
      },
    },
    cream: {
      type: CakeOptionSnapshotSchema,
      required: true,
    },
    frosting: {
      type: CakeOptionSnapshotSchema,
      required: true,
    },
    chocolates: {
      type: [CakeOptionSnapshotSchema],
      default: [],
    },
    fruits: {
      type: [CakeOptionSnapshotSchema],
      default: [],
    },
    decorations: {
      type: [CakeOptionSnapshotSchema],
      default: [],
    },
    message: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    basePrice: {
      type: Number,
      min: 0,
      required: true,
    },
    customizationPrice: {
      type: Number,
      min: 0,
      required: true,
    },
    finalPrice: {
      type: Number,
      min: 0,
      required: true,
    },
  },
  { _id: false },
);
