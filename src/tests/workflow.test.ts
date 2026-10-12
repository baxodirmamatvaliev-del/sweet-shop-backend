import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import OrderService from "../services/Order.service";
import AiCakeDesignService from "../services/AiCakeDesign.service";
import ProductModel from "../schema/Product.model";
import CakeOptionModel from "../schema/CakeOption.model";
import DeliverySlotModel from "../schema/DeliverySlot.model";
import AiCakeDesignModel from "../schema/AiCakeDesign.model";
import AiDesignQuotaModel from "../schema/AiDesignQuota.model";
import OrderModel from "../schema/Order.model";
import aiCakeDesignRouter from "../routes/AiCakeDesign.route";
import orderRouter from "../routes/Order.route";
import adminRouter from "../routes/Admin.route";
import deliverySlotRouter from "../routes/DeliverySlot.route";
import quickOrderRouter from "../routes/QuickOrder.route";
import { isAllowedOrigin } from "../app";

const objectId = () => new mongoose.Types.ObjectId();
const seoulDateKey = (value: Date) =>
  new Date(value.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

test("custom cake order preserves AI design and uses authoritative pricing", async () => {
  const memberId = objectId();
  const productId = objectId();
  const deliverySlotId = objectId();
  const aiDesignId = objectId();
  const optionIds = {
    size: objectId(),
    sponge: objectId(),
    filling: objectId(),
    cream: objectId(),
    frosting: objectId(),
    fruit: objectId(),
  };
  const options = [
    ["size", "SIZE", 1],
    ["sponge", "SPONGE", 2],
    ["filling", "FILLING", 3],
    ["cream", "CREAM", 1],
    ["frosting", "FROSTING", 1],
    ["fruit", "FRUIT", 4],
  ].map(([key, optionType, priceModifier]) => ({
    _id: optionIds[key as keyof typeof optionIds],
    optionType,
    code: String(key).toUpperCase(),
    name: key,
    priceModifier,
  }));
  const deliveryDate = seoulDateKey(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const deliverySlot = {
    _id: deliverySlotId,
    date: deliveryDate,
    startTime: "20:00",
    endTime: "22:00",
    capacity: 3,
    reservedCount: 1,
    isActive: true,
  };

  const originals = {
    productFind: ProductModel.find,
    optionFind: CakeOptionModel.find,
    slotFindById: DeliverySlotModel.findById,
    slotFindOneAndUpdate: DeliverySlotModel.findOneAndUpdate,
    designFindOne: AiCakeDesignModel.findOne,
    orderCreate: OrderModel.create,
  };
  let reservationFilter: any;
  let createdOrder: any;

  try {
    (ProductModel as any).find = () => ({
      exec: async () => [{
        _id: productId,
        productName: "Celebration Cake",
        productImage: "cake.png",
        productPrice: 20,
        productCategory: "BIRTHDAY_CAKE",
        productStatus: "PROCESS",
      }],
    });
    (CakeOptionModel as any).find = () => ({
      lean() { return this; },
      exec: async () => options,
    });
    (DeliverySlotModel as any).findById = () => ({
      lean() { return this; },
      exec: async () => deliverySlot,
    });
    (DeliverySlotModel as any).findOneAndUpdate = (filter: any) => {
      reservationFilter = filter;
      return {
        lean() { return this; },
        exec: async () => ({ ...deliverySlot, reservedCount: 2 }),
      };
    };
    (AiCakeDesignModel as any).findOne = () => ({
      lean() { return this; },
      exec: async () => ({
        _id: aiDesignId,
        memberId,
        prompt: "Blue moon cake with gold stars",
        imageUrl: "/uploads/ai-designs/concept.png",
      }),
    });
    (OrderModel as any).create = async (input: any) => {
      createdOrder = input;
      return input;
    };

    await new OrderService().createOrder(memberId.toString(), {
      customerName: "Customer",
      phone: "010-0000-0000",
      address: "Seoul",
      deliverySlotId: deliverySlotId.toString(),
      items: [{
        productId: productId.toString(),
        quantity: 1,
        aiDesignId: aiDesignId.toString(),
        cakeConfiguration: {
          sizeOptionId: optionIds.size.toString(),
          layers: [{
            spongeOptionId: optionIds.sponge.toString(),
            fillingOptionId: optionIds.filling.toString(),
          }],
          creamOptionId: optionIds.cream.toString(),
          frostingOptionId: optionIds.frosting.toString(),
          fruitOptionIds: [optionIds.fruit.toString()],
          chocolateOptionIds: [],
          decorationOptionIds: [],
          message: "Happy birthday",
        },
      }],
    });

    assert.equal(createdOrder.items[0].productPrice, 32);
    assert.equal(createdOrder.items[0].cakeConfiguration.finalPrice, 32);
    assert.equal(createdOrder.items[0].aiDesign.designId, aiDesignId);
    assert.equal(createdOrder.deliverySlotId, deliverySlotId.toString());
    assert.deepEqual(reservationFilter.$expr, {
      $lt: ["$reservedCount", "$capacity"],
    });
  } finally {
    ProductModel.find = originals.productFind;
    CakeOptionModel.find = originals.optionFind;
    DeliverySlotModel.findById = originals.slotFindById;
    DeliverySlotModel.findOneAndUpdate = originals.slotFindOneAndUpdate;
    AiCakeDesignModel.findOne = originals.designFindOne;
    OrderModel.create = originals.orderCreate;
  }
});

test("AI design generation enforces quota and stores only server output", async () => {
  const memberId = objectId().toString();
  const designId = objectId();
  const originals = {
    quotaUpdate: AiDesignQuotaModel.findOneAndUpdate,
    designCreate: AiCakeDesignModel.create,
  };
  let storedBase64 = "";
  let createdInput: any;

  try {
    (AiDesignQuotaModel as any).findOneAndUpdate = () => ({
      lean() { return this; },
      exec: async () => ({ used: 1 }),
    });
    (AiCakeDesignModel as any).create = async (input: any) => {
      createdInput = input;
      return { _id: designId, ...input };
    };
    const service = new AiCakeDesignService(
      async () => ({ base64: "real-api-output", model: "test-image-model" }),
      async (_memberId, base64) => {
        storedBase64 = base64;
        return "/uploads/ai-designs/test.png";
      },
    );
    const result = await service.generate(
      memberId,
      "Elegant white cake with gold flowers",
      new Date("2026-10-12T00:00:00Z"),
    );

    assert.equal(storedBase64, "real-api-output");
    assert.equal(createdInput.imageUrl, "/uploads/ai-designs/test.png");
    assert.equal(result.remaining, 2);

    (AiDesignQuotaModel as any).findOneAndUpdate = () => ({
      lean() { return this; },
      exec: async () => {
        const error: any = new Error("duplicate quota");
        error.code = 11000;
        throw error;
      },
    });
    await assert.rejects(
      service.generate(memberId, "Another detailed cake concept"),
      (error: any) => error.code === 429,
    );
  } finally {
    AiDesignQuotaModel.findOneAndUpdate = originals.quotaUpdate;
    AiCakeDesignModel.create = originals.designCreate;
  }
});

test("sensitive customer routes use authentication middleware", () => {
  const routes = [
    ...(orderRouter as any).stack.filter((layer: any) => layer.route),
    ...(aiCakeDesignRouter as any).stack.filter((layer: any) => layer.route),
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
