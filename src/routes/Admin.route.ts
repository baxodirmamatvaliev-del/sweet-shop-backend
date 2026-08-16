import { Router } from "express";
import adminController from "../controllers/Admin.controller";

const adminRouter = Router();

adminRouter.get("/products", 
    adminController.getProductsPage);

adminRouter.post("/products/:id/status", 
    adminController.updateProductStatus);

export default adminRouter;