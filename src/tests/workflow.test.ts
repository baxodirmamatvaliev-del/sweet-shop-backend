import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import OrderService from "../services/Order.service";
import OrderModel from "../schema/Order.model";
import orderRouter from "../routes/Order.route";
import adminRouter from "../routes/Admin.route";
import deliverySlotRouter from "../routes/DeliverySlot.route";
import quickOrderRouter from "../routes/QuickOrder.route";
import { isAllowedOrigin } from "../app";

test("sensitive customer routes use authentication middleware", () => {
  const routes = [
    ...(orderRouter as any).stack.filter((layer: any) => layer.route),
    ...(deliverySlotRouter as any).stack.filter((layer: any) => layer.route),
    ...(quickOrderRouter as any).stack.filter((layer: any) => layer.route),
  ];

  for (const layer of routes) {
    assert.equal(
      layer.route.stack[0].handle.name,
      "verifyAuth",
      `${layer.route.path} must be authenticated`,
    );
  }
});

test("admin business routes use admin authorization", () => {
  const publicPaths = new Set(["/login", "/signup"]);
  const routes = (adminRouter as any).stack.filter(
    (layer: any) => layer.route && !publicPaths.has(layer.route.path),
  );

  for (const layer of routes) {
    assert.equal(
      layer.route.stack[0].handle.name,
      "verifyAdmin",
      `${layer.route.path} must require admin authorization`,
    );
  }
});

test("CORS allowlist accepts configured and server-to-server origins", () => {
  assert.equal(isAllowedOrigin("http://localhost:5173"), true);
  assert.equal(isAllowedOrigin(undefined), true);
  assert.equal(isAllowedOrigin("https://untrusted.example"), false);
});

test("retired cake and AI inputs are rejected before any order is created", async () => {
  for (const legacy of [{ cakeConfiguration: {} }, { aiDesignId: new mongoose.Types.ObjectId().toString() }]) {
    await assert.rejects(new OrderService().createOrder(new mongoose.Types.ObjectId().toString(), {
      customerName: "Customer", phone: "010-1234-5678", address: "Seoul",
      items: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1, ...legacy }],
    }), (error: any) => error.code === 400);
  }
});

test("historical order snapshots still retain customization and AI metadata", () => {
  const itemSchema = (OrderModel.schema.path("items") as any).schema;
  assert.ok(itemSchema.path("cakeConfiguration"));
  assert.ok(itemSchema.path("aiDesign"));
  assert.equal((adminRouter as any).stack.some((layer: any) => layer.route?.path.startsWith("/cake-options")), false);
});
