import { Router } from "express";
import orderController from "../controllers/Order.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const orderRouter = Router();

orderRouter.get("/my-orders", verifyAuth, orderController.getMyOrders);
orderRouter.get("/:id/tracking", verifyAuth, orderController.getMyOrderTracking);
orderRouter.get(
  "/:id/tracking/stream",
  verifyAuth,
  orderController.streamMyOrderTracking,
);
orderRouter.patch("/:id/cancel", verifyAuth, orderController.cancelMyOrder);
orderRouter.post("/create", verifyAuth, orderController.createOrder);

export default orderRouter;
