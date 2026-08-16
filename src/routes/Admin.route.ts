import { Router } from "express";
import adminController from "../controllers/Admin.controller";
import uploader from "../uploader";
import { verifyAdmin } from "../middlewares/admin.middleware";

const adminRouter = Router();

// Login (himoyasiz)
adminRouter.get("/login", adminController.getLoginPage);
adminRouter.post("/login", adminController.processLogin);

// Himoyalangan route'lar (ADMIN)
adminRouter.get("/products", verifyAdmin, adminController.getProductsPage);
adminRouter.post("/products/:id/status", verifyAdmin, adminController.updateProductStatus);
adminRouter.post("/products/create", verifyAdmin, uploader.single("productImage"), adminController.processCreateProduct);

export default adminRouter;