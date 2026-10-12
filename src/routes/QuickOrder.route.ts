import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import quickOrderController from "../controllers/QuickOrder.controller";

const quickOrderRouter = Router();

quickOrderRouter.post("/", verifyAuth, quickOrderController.createQuickOrder);

export default quickOrderRouter;
