import mongoose from "mongoose";
import Errors, { HttpCode, Message } from "../libs/Errors";
import ProductModel from "../schema/Product.model";
import OrderModel from "../schema/Order.model";
import { ProductStatus } from "../libs/enums/product.enum";

type CreateOrderItemInput = {
  productId?: unknown;
  quantity?: unknown;
};

type CreateOrderInput = {
  customerName?: unknown;
  phone?: unknown;
  address?: unknown;
  items?: unknown;
};

type OrderStatus = "PENDING" | "PROCESS" | "DELIVERED" | "CANCELLED";

const FREE_DELIVERY_LIMIT = 100;
const DELIVERY_FEE = 5;

const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

const convertLegacyPriceToUSD = (price: number): number =>
  price >= 1000 ? price / 1000 : price;

class OrderService {
  public async getOrders(): Promise<any[]> {
    return OrderModel.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  public async updateOrderStatus(id: string, status: unknown): Promise<any> {
    const allowedStatuses: OrderStatus[] = [
      "PENDING",
      "PROCESS",
      "DELIVERED",
      "CANCELLED",
    ];

    if (
      !mongoose.isValidObjectId(id) ||
      typeof status !== "string" ||
      !allowedStatuses.includes(status as OrderStatus)
    ) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER_STATUS);
    }

    const order = await OrderModel.findByIdAndUpdate(
      id,
      { orderStatus: status },
      { new: true },
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

    for (const item of requestedItems) {
      const productId = typeof item.productId === "string" ? item.productId : "";
      const quantity = Number(item.quantity);

      if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
      }

      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }

    const productIds = [...quantities.keys()];
    const products = await ProductModel.find({
      _id: { $in: productIds },
      productStatus: ProductStatus.PROCESS,
    }).exec();

    if (products.length !== productIds.length) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.PRODUCT_NOT_AVAILABLE);
    }

    const orderItems = products.map((product) => {
      const productId = product._id.toString();
      const quantity = quantities.get(productId) as number;
      const productPrice = roundMoney(convertLegacyPriceToUSD(product.productPrice));

      return {
        productId: product._id,
        productName: product.productName,
        productImage: product.productImage ?? "",
        productPrice,
        quantity,
        itemTotal: roundMoney(productPrice * quantity),
      };
    });

    const subtotal = roundMoney(
      orderItems.reduce((sum, item) => sum + item.itemTotal, 0),
    );
    const deliveryFee = subtotal >= FREE_DELIVERY_LIMIT ? 0 : DELIVERY_FEE;

    return OrderModel.create({
      memberId,
      customerName,
      phone,
      address,
      items: orderItems,
      subtotal,
      deliveryFee,
      total: roundMoney(subtotal + deliveryFee),
    });
  }

  private requireText(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
    }

    return value.trim();
  }
}

export default OrderService;
