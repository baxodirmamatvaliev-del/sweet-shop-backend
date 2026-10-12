import dotenv from "dotenv";
import mongoose from "mongoose";
import { OrderStatus } from "../libs/enums/order.enum";
import OrderModel from "../schema/Order.model";

dotenv.config();

async function migrateOrderStatuses(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL;
  const shouldApply = process.argv.includes("--apply");

  if (!mongoUrl) {
    throw new Error("MONGO_URL is required.");
  }

  await mongoose.connect(mongoUrl);

  try {
    const filter = { orderStatus: OrderStatus.LEGACY_PROCESS };
    const legacyOrderCount = await OrderModel.countDocuments(filter);

    if (!shouldApply) {
      console.log(
        `Dry run: ${legacyOrderCount} order(s) would be changed from PROCESS to CONFIRMED.`,
      );
      return;
    }

    const result = await OrderModel.updateMany(filter, {
      $set: { orderStatus: OrderStatus.CONFIRMED },
    });

    console.log(`Updated ${result.modifiedCount} order(s) to CONFIRMED.`);
  } finally {
    await mongoose.disconnect();
  }
}

migrateOrderStatuses().catch((error: unknown) => {
  console.error("Order status migration failed:", error);
  process.exitCode = 1;
});
