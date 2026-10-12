import dotenv from "dotenv";
import mongoose from "mongoose";
import OrderModel from "../schema/Order.model";

dotenv.config();

async function backfillOrderStatusHistory(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL;
  const shouldApply = process.argv.includes("--apply");
  const filter = {
    $or: [
      { statusHistory: { $exists: false } },
      { statusHistory: { $size: 0 } },
    ],
  };

  if (!mongoUrl) {
    throw new Error("MONGO_URL is required.");
  }

  await mongoose.connect(mongoUrl);

  try {
    const orderCount = await OrderModel.countDocuments(filter);

    if (!shouldApply) {
      console.log(
        `Dry run: ${orderCount} order(s) would receive an initial status history entry.`,
      );
      return;
    }

    const result = await OrderModel.updateMany(filter, [
      {
        $set: {
          statusHistory: [
            {
              status: "$orderStatus",
              changedAt: {
                $ifNull: [
                  "$updatedAt",
                  { $ifNull: ["$createdAt", "$$NOW"] },
                ],
              },
              changedBy: "$memberId",
              source: "SYSTEM",
            },
          ],
        },
      },
    ]);

    console.log(
      `Backfilled status history for ${result.modifiedCount} order(s).`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

backfillOrderStatusHistory().catch((error: unknown) => {
  console.error("Order status history backfill failed:", error);
  process.exitCode = 1;
});
