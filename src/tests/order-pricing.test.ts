import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import OrderService from "../services/Order.service";
import ProductModel from "../schema/Product.model";
import DeliverySlotModel from "../schema/DeliverySlot.model";
import OrderModel from "../schema/Order.model";

test("checkout uses authoritative whole-KRW prices and the KRW delivery threshold", async () => {
  const productId = new mongoose.Types.ObjectId();
  const slotId = new mongoose.Types.ObjectId();
  const slot = {
    _id: slotId,
    date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 10),
    startTime: "10:00",
    endTime: "12:00",
    capacity: 10,
    reservedCount: 0,
    isActive: true,
  };
  const originals = {
    productFind: ProductModel.find,
    slotFind: DeliverySlotModel.findById,
    slotReserve: DeliverySlotModel.findOneAndUpdate,
    orderCreate: OrderModel.create,
  };
  let price = 4500;
  let saved: any;
  try {
    (ProductModel as any).find = () => ({
      exec: async () => [{
        _id: productId,
        productName: "Morrow Latte",
        productCategory: "COFFEE",
        productPrice: price,
        productStatus: "PROCESS",
        trackInventory: false,
      }],
    });
    (DeliverySlotModel as any).findById = () => ({ lean() { return this; }, exec: async () => slot });
    (DeliverySlotModel as any).findOneAndUpdate = () => ({ lean() { return this; }, exec: async () => ({ ...slot, reservedCount: 1 }) });
    (OrderModel as any).create = async (input: any) => { saved = input; return input; };

    for (const scenario of [
      { price: 4500, quantity: 2, unit: 4500, subtotal: 9000, delivery: 3000, total: 12000 },
      { price: 19999, quantity: 1, unit: 19999, subtotal: 19999, delivery: 3000, total: 22999 },
      { price: 20000, quantity: 1, unit: 20000, subtotal: 20000, delivery: 0, total: 20000 },
      { price: 4500.4, quantity: 1, unit: 4500, subtotal: 4500, delivery: 3000, total: 7500 },
    ]) {
      price = scenario.price;
      await new OrderService().createOrder(new mongoose.Types.ObjectId().toString(), {
        customerName: "Customer",
        phone: "010-1234-5678",
        address: "Seoul",
        deliverySlotId: slotId.toString(),
        items: [{ productId: productId.toString(), quantity: scenario.quantity, productPrice: 1 }],
      });
      assert.equal(saved.items[0].productPrice, scenario.unit);
      assert.equal(saved.subtotal, scenario.subtotal);
      assert.equal(saved.deliveryFee, scenario.delivery);
      assert.equal(saved.total, scenario.total);
    }
  } finally {
    ProductModel.find = originals.productFind;
    DeliverySlotModel.findById = originals.slotFind;
    DeliverySlotModel.findOneAndUpdate = originals.slotReserve;
    OrderModel.create = originals.orderCreate;
  }
});
