import mongoose, { Schema } from "mongoose";
import { ProductCategory, ProductStatus } from "../libs/enums/product.enum";

const ProductSchema = new Schema(
  {
    productCategory: {
      type: String,
      enum: ProductCategory,
      required: true,
    },

    productStatus: {
      type: String,
      enum: ProductStatus,
      default: ProductStatus.ACTIVE,
    },

    productName: {
      type: String,
      index: { unique: true, sparse: true },
      required: true,
    },

    productPrice: {
      type: Number,
      required: true,
    },

    productDesc: {
      type: String,
    },

    productImage: {
      type: String,
    },

    productViews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", ProductSchema);