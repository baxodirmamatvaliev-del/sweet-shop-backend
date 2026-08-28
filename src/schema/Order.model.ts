import mongoose, { Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      default: "",
    },
    productPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "An order must contain at least one item.",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CARD"],
      default: "CARD",
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "PROCESS", "DELIVERED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", OrderSchema);
