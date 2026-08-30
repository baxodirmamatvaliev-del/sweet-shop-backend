import { Router } from "express";
import orderController from "../controllers/Order.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const orderRouter = Router();

orderRouter.get("/my-orders", verifyAuth, orderController.getMyOrders);
orderRouter.post("/create", verifyAuth, orderController.createOrder);

export default orderRouter;
