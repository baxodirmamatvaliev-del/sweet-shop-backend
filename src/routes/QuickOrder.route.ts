import { Router } from "express";
import quickOrderController from "../controllers/QuickOrder.controller";

const quickOrderRouter = Router();

// Public endpoint: authentication is intentionally not required.
quickOrderRouter.post("/", quickOrderController.createQuickOrder);

export default quickOrderRouter;
