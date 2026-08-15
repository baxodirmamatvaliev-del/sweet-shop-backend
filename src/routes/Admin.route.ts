import { Router } from "express";
import adminController from "../controllers/Admin.controller";

const adminRouter = Router();

adminRouter.get("/products", adminController.getProductsPage);

export default adminRouter;