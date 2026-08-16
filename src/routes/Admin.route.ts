import { Router } from "express";
import adminController from "../controllers/Admin.controller";
import uploader from "../uploader";

const adminRouter = Router();

adminRouter.get("/products", 
    adminController.getProductsPage);

adminRouter.post("/products/:id/status", 
    adminController.updateProductStatus);

adminRouter.post("/products/create/",
    uploader.single("productImage"),adminController.processCreateProduct); 

export default adminRouter;