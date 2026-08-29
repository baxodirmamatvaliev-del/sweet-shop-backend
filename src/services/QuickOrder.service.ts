import Errors, { HttpCode, Message } from "../libs/Errors";
import QuickOrderModel from "../schema/QuickOrder.model";
import mongoose from "mongoose";

export type QuickOrderStatus = "NEW" | "CONTACTED" | "CANCELLED";

class QuickOrderService {
  public async createQuickOrder(input: { phone?: unknown }): Promise<any> {
    const phone = this.normalizePhone(input?.phone);
    return QuickOrderModel.create({ phone });
  }

  public async getQuickOrders(): Promise<any[]> {
    return QuickOrderModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  public async updateStatus(id: string, status: unknown): Promise<void> {
    const allowedStatuses: QuickOrderStatus[] = ["NEW", "CONTACTED", "CANCELLED"];

    if (
      !mongoose.isValidObjectId(id) ||
      typeof status !== "string" ||
      !allowedStatuses.includes(status as QuickOrderStatus)
    ) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_QUICK_ORDER_STATUS);
    }

    const result = await QuickOrderModel.findByIdAndUpdate(id, { status }).exec();
    if (!result) {
      throw new Errors(HttpCode.NOT_FOUND, Message.QUICK_ORDER_NOT_FOUND);
    }
  }

  private normalizePhone(value: unknown): string {
    if (typeof value !== "string") {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_PHONE);
    }

    const trimmedValue = value.trim();
    if (!/^[\d\s()+-]+$/.test(trimmedValue)) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_PHONE);
    }

    const digits = trimmedValue.replace(/\D/g, "");
    const localNumber = digits.startsWith("82")
      ? `0${digits.slice(2)}`
      : digits;

    if (!/^010\d{8}$/.test(localNumber)) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_PHONE);
    }

    return `+82${localNumber.slice(1)}`;
  }
}

export default QuickOrderService;
