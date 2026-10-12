import mongoose from "mongoose";
import Errors, { HttpCode, Message } from "../libs/Errors";
import ProductModel from "../schema/Product.model";
import OrderModel from "../schema/Order.model";
import {
  ProductCategory,
  ProductStatus,
} from "../libs/enums/product.enum";
import { OrderStatus } from "../libs/enums/order.enum";
import CakePricingService from "./CakePricing.service";
import DeliverySlotService from "./DeliverySlot.service";

type CreateOrderItemInput = {
  productId?: unknown;
  quantity?: unknown;
  cakeConfiguration?: unknown;
};

type NormalizedOrderItem = {
  productId: string;
  quantity: number;
  cakeConfiguration?: unknown;
};

type CreateOrderInput = {
  customerName?: unknown;
  phone?: unknown;
  address?: unknown;
  deliverySlotId?: unknown;
  items?: unknown;
};

const FREE_DELIVERY_LIMIT = 100;
const DELIVERY_FEE = 5;

const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

const convertLegacyPriceToUSD = (price: number): number =>
  price >= 1000 ? price / 1000 : price;

const cakePricingService = new CakePricingService();
const deliverySlotService = new DeliverySlotService();

class OrderService {
  public async cancelMyOrder(memberId: string, orderId: string): Promise<any> {
    if (!mongoose.isValidObjectId(memberId) || !mongoose.isValidObjectId(orderId)) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
    }

    const order = await OrderModel.findOneAndUpdate(
      {
        _id: orderId,
        memberId,
        orderStatus: OrderStatus.PENDING,
      },
      {
        $set: { orderStatus: OrderStatus.CANCELLED },
        $push: {
          statusHistory: {
            status: OrderStatus.CANCELLED,
            changedAt: new Date(),
            changedBy: memberId,
            source: "CUSTOMER",
          },
        },
      },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (order) {
      await deliverySlotService
        .releaseSlot(order.deliverySlotId)
        .catch((error: unknown) => {
          console.error("Unable to release cancelled order delivery slot:", error);
        });
      return order;
    }

    const existingOrder = await OrderModel.exists({ _id: orderId, memberId }).exec();
    if (!existingOrder) {
      throw new Errors(HttpCode.NOT_FOUND, Message.ORDER_NOT_FOUND);
    }

    throw new Errors(HttpCode.BAD_REQUEST, Message.ORDER_CANNOT_BE_CANCELLED);
  }

  public async getOrders(): Promise<any[]> {
    return OrderModel.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  public async updateOrderStatus(
    id: string,
    status: unknown,
    adminId: string,
  ): Promise<any> {
    const allowedStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.BAKING,
      OrderStatus.DECORATING,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(adminId) ||
      typeof status !== "string" ||
      !allowedStatuses.includes(status as OrderStatus)
    ) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER_STATUS);
    }

    const order = await OrderModel.findByIdAndUpdate(
      id,
      {
        $set: { orderStatus: status },
        $push: {
          statusHistory: {
            status,
            changedAt: new Date(),
            changedBy: adminId,
            source: "ADMIN",
          },
        },
      },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!order) {
      throw new Errors(HttpCode.NOT_FOUND, Message.ORDER_NOT_FOUND);
    }

    return order;
  }

  public async getMyOrders(memberId: string): Promise<any[]> {
    if (!mongoose.isValidObjectId(memberId)) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
    }

    return OrderModel.find({ memberId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  public async createOrder(memberId: string, input: CreateOrderInput): Promise<any> {
    const customerName = this.requireText(input.customerName);
    const phone = this.requireText(input.phone);
    const address = this.requireText(input.address);

    if (!mongoose.isValidObjectId(memberId) || !Array.isArray(input.items) || input.items.length === 0) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
    }

    const requestedItems = input.items as CreateOrderItemInput[];
    const quantities = new Map<string, number>();
    const customizedItems: NormalizedOrderItem[] = [];

    for (const item of requestedItems) {
      const productId = typeof item.productId === "string" ? item.productId : "";
      const quantity = Number(item.quantity);

      if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
      }

      if (item.cakeConfiguration !== undefined) {
        customizedItems.push({
          productId,
          quantity,
          cakeConfiguration: item.cakeConfiguration,
        });
      } else {
        quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
      }
    }

    const normalizedItems: NormalizedOrderItem[] = [
      ...[...quantities].map(([productId, quantity]) => ({
        productId,
        quantity,
      })),
      ...customizedItems,
    ];
    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const products = await ProductModel.find({
      _id: { $in: productIds },
      productStatus: ProductStatus.PROCESS,
    }).exec();

    if (products.length !== productIds.length) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.PRODUCT_NOT_AVAILABLE);
    }

    const productsById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );
    const orderItems = await Promise.all(
      normalizedItems.map(async (item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new Errors(HttpCode.BAD_REQUEST, Message.PRODUCT_NOT_AVAILABLE);
        }

        const basePrice = roundMoney(
          convertLegacyPriceToUSD(product.productPrice),
        );

        if (item.cakeConfiguration !== undefined) {
          if (product.productCategory !== ProductCategory.BIRTHDAY_CAKE) {
            throw new Errors(
              HttpCode.BAD_REQUEST,
              Message.INVALID_CAKE_CONFIGURATION,
            );
          }

          const cakeConfiguration = await cakePricingService.calculate(
            basePrice,
            item.cakeConfiguration,
          );

          return {
            productId: product._id,
            productName: product.productName,
            productImage: product.productImage ?? "",
            productPrice: cakeConfiguration.finalPrice,
            quantity: item.quantity,
            itemTotal: roundMoney(
              cakeConfiguration.finalPrice * item.quantity,
            ),
            cakeConfiguration,
          };
        }

        return {
          productId: product._id,
          productName: product.productName,
          productImage: product.productImage ?? "",
          productPrice: basePrice,
          quantity: item.quantity,
          itemTotal: roundMoney(basePrice * item.quantity),
        };
      }),
    );

    const subtotal = roundMoney(
      orderItems.reduce((sum, item) => sum + item.itemTotal, 0),
    );
    const deliveryFee = subtotal >= FREE_DELIVERY_LIMIT ? 0 : DELIVERY_FEE;
    const deliverySlot = await deliverySlotService.reserveSlot(
      input.deliverySlotId,
    );

    try {
      return await OrderModel.create({
        memberId,
        customerName,
        phone,
        address,
        ...deliverySlot,
        items: orderItems,
        subtotal,
        deliveryFee,
        total: roundMoney(subtotal + deliveryFee),
        statusHistory: [
          {
            status: OrderStatus.PENDING,
            changedAt: new Date(),
            changedBy: memberId,
            source: "CUSTOMER",
          },
        ],
      });
    } catch (error) {
      await deliverySlotService.releaseSlot(deliverySlot.deliverySlotId);
      throw error;
    }
  }

  private requireText(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
    }

    return value.trim();
  }
}

export default OrderService;
