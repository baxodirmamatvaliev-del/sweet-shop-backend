import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import OrderService from "../services/Order.service";
import OrderModel from "../schema/Order.model";
import adminController from "../controllers/Admin.controller";

const ejs = require("ejs");

test("admin advances an order through the coffee preparation flow and rejects skipped or final transitions", async () => {
  const originalUpdate = OrderModel.findOneAndUpdate;
  const originalExists = OrderModel.exists;
  const order: any = {
    _id: new mongoose.Types.ObjectId(),
    orderStatus: "PENDING",
    statusHistory: [],
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    subtotal: 20000, deliveryFee: 0, total: 20000,
  };
  const adminId = new mongoose.Types.ObjectId().toString();
  try {
    (OrderModel as any).findOneAndUpdate = (filter: any, update: any, options: any) => {
      assert.equal(options.runValidators, true);
      return { lean() { return this; }, exec: async () => {
        if (!filter.orderStatus.$in.includes(order.orderStatus)) return null;
        order.orderStatus = update.$set.orderStatus;
        order.statusHistory.push(update.$push.statusHistory);
        return order;
      } };
    };
    (OrderModel as any).exists = () => ({ exec: async () => ({ _id: order._id }) });
    const service = new OrderService();
    await assert.rejects(service.updateOrderStatus(order._id.toString(), "DELIVERED", adminId));
    for (const status of ["CONFIRMED", "BAKING", "DECORATING", "OUT_FOR_DELIVERY", "DELIVERED"]) {
      let statusCode: number | undefined;
      let body: any;
      const response: any = { status(code: number) { statusCode = code; return this; }, json(value: any) { body = value; return this; } };
      await adminController.updateOrderStatus({ params: { id: order._id.toString() }, body: { status }, member: { _id: adminId } }, response);
      assert.equal(statusCode, 200);
      assert.equal(body.data.orderStatus, status);
      const history = order.statusHistory.at(-1);
      assert.equal(history.source, "ADMIN");
      assert.equal(history.changedBy, adminId);
    }
    assert.equal(order.statusHistory.length, 5);
    await assert.rejects(service.updateOrderStatus(order._id.toString(), "CONFIRMED", adminId));
    await assert.rejects(service.updateOrderStatus(order._id.toString(), "CANCELLED", adminId));
    await assert.rejects(service.updateOrderStatus(order._id.toString(), "UNKNOWN", adminId));
    const html = await ejs.renderFile("src/views/orders.ejs", { orders: [order] });
    assert.match(html, /Preparing/);
    assert.match(html, /Ready to dispatch/);
  } finally {
    OrderModel.findOneAndUpdate = originalUpdate;
    OrderModel.exists = originalExists;
  }
});
