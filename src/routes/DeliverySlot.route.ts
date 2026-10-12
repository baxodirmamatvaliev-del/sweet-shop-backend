import { Router } from "express";
import deliverySlotController from "../controllers/DeliverySlot.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const deliverySlotRouter = Router();

deliverySlotRouter.get(
  "/",
  verifyAuth,
  deliverySlotController.getAvailableSlots,
);

export default deliverySlotRouter;
