import mongoose from "mongoose";
import Errors, { HttpCode, Message } from "../libs/Errors";
import DeliverySlotModel from "../schema/DeliverySlot.model";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const MIN_PREPARATION_HOURS = 24;

export type DeliverySlotInput = {
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
};

export type DeliverySlotSnapshot = {
  deliverySlotId: string;
  deliveryDate: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
};

const parseSeoulDateTime = (date: string, time: string): Date | null => {
  if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return null;

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    return null;
  }

  const timestamp =
    Date.UTC(year, month - 1, day, hour, minute) - SEOUL_OFFSET_MS;
  const seoulValue = new Date(timestamp + SEOUL_OFFSET_MS);

  if (
    seoulValue.getUTCFullYear() !== year ||
    seoulValue.getUTCMonth() !== month - 1 ||
    seoulValue.getUTCDate() !== day ||
    seoulValue.getUTCHours() !== hour ||
    seoulValue.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return new Date(timestamp);
};

export const getSeoulDateKey = (value = new Date()): string =>
  new Date(value.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10);

class DeliverySlotService {
  public async getAvailableSlots(date: unknown, now = new Date()): Promise<any[]> {
    if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_DELIVERY_SLOT);
    }

    const slots = await DeliverySlotModel.find({
      date,
      isActive: true,
      $expr: { $lt: ["$reservedCount", "$capacity"] },
    })
      .sort({ startTime: 1 })
      .lean()
      .exec();
    const preparationLimit =
      now.getTime() + MIN_PREPARATION_HOURS * 60 * 60 * 1000;

    return slots.filter((slot) => {
      const startsAt = parseSeoulDateTime(slot.date, slot.startTime);
      return startsAt !== null && startsAt.getTime() >= preparationLimit;
    });
  }

  public getAdminSlots(now = new Date()): Promise<any[]> {
    return DeliverySlotModel.find({ date: { $gte: getSeoulDateKey(now) } })
      .sort({ date: 1, startTime: 1 })
      .lean()
      .exec();
  }

  public async createSlot(input: unknown, now = new Date()): Promise<any> {
    const slot = this.parseInput(input, now);

    try {
      return await DeliverySlotModel.create(slot);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_DELIVERY_SLOT);
      }
      throw error;
    }
  }

  public async updateSlot(
    slotId: string,
    input: unknown,
    now = new Date(),
  ): Promise<any> {
    if (!mongoose.isValidObjectId(slotId)) this.invalid();
    const slot = this.parseInput(input, now, false);
    const current = await DeliverySlotModel.findById(slotId).lean().exec();
    if (!current) this.invalid();
    const scheduleChanged =
      current.date !== slot.date ||
      current.startTime !== slot.startTime ||
      current.endTime !== slot.endTime;
    const startsAt = parseSeoulDateTime(slot.date, slot.startTime);
    const preparationLimit =
      now.getTime() + MIN_PREPARATION_HOURS * 60 * 60 * 1000;
    if (scheduleChanged && (!startsAt || startsAt.getTime() < preparationLimit)) {
      this.invalid();
    }
    const updated = await DeliverySlotModel.findOneAndUpdate(
      {
        _id: slotId,
        reservedCount: scheduleChanged ? 0 : { $lte: slot.capacity },
      },
      slot,
      { new: true, runValidators: true },
    ).exec();

    if (!updated) this.invalid();
    return updated;
  }

  public async updateActiveStatus(
    slotId: string,
    isActive: boolean,
  ): Promise<any> {
    if (!mongoose.isValidObjectId(slotId)) this.invalid();
    const slot = await DeliverySlotModel.findByIdAndUpdate(
      slotId,
      { isActive },
      { new: true, runValidators: true },
    ).exec();

    if (!slot) this.invalid();
    return slot;
  }

  public async reserveSlot(
    slotId: unknown,
    now = new Date(),
  ): Promise<DeliverySlotSnapshot> {
    if (typeof slotId !== "string" || !mongoose.isValidObjectId(slotId)) {
      this.unavailable();
    }

    const candidate = await DeliverySlotModel.findById(slotId).lean().exec();
    const startsAt = candidate
      ? parseSeoulDateTime(candidate.date, candidate.startTime)
      : null;
    const preparationLimit =
      now.getTime() + MIN_PREPARATION_HOURS * 60 * 60 * 1000;

    if (
      !candidate ||
      !candidate.isActive ||
      !startsAt ||
      startsAt.getTime() < preparationLimit
    ) {
      this.unavailable();
    }

    const reserved = await DeliverySlotModel.findOneAndUpdate(
      {
        _id: candidate._id,
        date: candidate.date,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        isActive: true,
        $expr: { $lt: ["$reservedCount", "$capacity"] },
      },
      { $inc: { reservedCount: 1 } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!reserved) this.unavailable();

    return {
      deliverySlotId: reserved._id.toString(),
      deliveryDate: reserved.date,
      deliveryStartTime: reserved.startTime,
      deliveryEndTime: reserved.endTime,
    };
  }

  public async releaseSlot(slotId: unknown): Promise<void> {
    if (!slotId || !mongoose.isValidObjectId(slotId)) return;
    await DeliverySlotModel.updateOne(
      { _id: slotId, reservedCount: { $gt: 0 } },
      { $inc: { reservedCount: -1 } },
    ).exec();
  }

  private parseInput(
    input: unknown,
    now: Date,
    enforcePreparation = true,
  ): DeliverySlotInput {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      this.invalid();
    }

    const value = input as Record<string, unknown>;
    const date = String(value.date ?? "");
    const startTime = String(value.startTime ?? "");
    const endTime = String(value.endTime ?? "");
    const capacity = Number(value.capacity);
    const startsAt = parseSeoulDateTime(date, startTime);
    const endsAt = parseSeoulDateTime(date, endTime);
    const preparationLimit =
      now.getTime() + MIN_PREPARATION_HOURS * 60 * 60 * 1000;
    const maximumDate = now.getTime() + 90 * DAY_MS;

    if (
      !startsAt ||
      !endsAt ||
      endsAt <= startsAt ||
      (enforcePreparation && startsAt.getTime() < preparationLimit) ||
      startsAt.getTime() > maximumDate ||
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      this.invalid();
    }

    return { date, startTime, endTime, capacity };
  }

  private invalid(): never {
    throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_DELIVERY_SLOT);
  }

  private unavailable(): never {
    throw new Errors(HttpCode.BAD_REQUEST, Message.DELIVERY_SLOT_UNAVAILABLE);
  }
}

export default DeliverySlotService;
