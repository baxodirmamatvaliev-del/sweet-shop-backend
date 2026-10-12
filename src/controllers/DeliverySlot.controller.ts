import { Request, Response } from "express";
import DeliverySlotService from "../services/DeliverySlot.service";

const deliverySlotService = new DeliverySlotService();

const deliverySlotController = {
  getAvailableSlots: async (req: Request, res: Response) => {
    try {
      const slots = await deliverySlotService.getAvailableSlots(req.query.date);
      return res.status(200).json({
        data: slots.map((slot) => ({
          _id: slot._id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          remainingCapacity: Math.max(0, slot.capacity - slot.reservedCount),
        })),
      });
    } catch (error: any) {
      return res.status(error.code ?? 500).json({
        message: error.message ?? "Unable to load delivery slots.",
      });
    }
  },
};

export default deliverySlotController;
