import { Router } from "express";
import orderController from "../controllers/Order.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const orderRouter = Router();

orderRouter.post("/create", verifyAuth, orderController.createOrder);

export default orderRouter;
