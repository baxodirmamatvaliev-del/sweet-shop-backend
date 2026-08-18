import { Router } from "express";
import adminController from "../controllers/Admin.controller";
import uploader from "../uploader";
import { verifyAdmin } from "../middlewares/admin.middleware";

const adminRouter = Router();

// Public login routes
adminRouter.get("/login", adminController.getLoginPage);
adminRouter.post("/login", adminController.processLogin);
adminRouter.get("/signup", adminController.getSignupPage);
adminRouter.post("/signup", adminController.processSignup);

// Protected admin routes
adminRouter.get("/products", verifyAdmin, adminController.getProductsPage);
adminRouter.post("/products/:id/status", verifyAdmin, adminController.updateProductStatus);
adminRouter.post("/products/create", verifyAdmin, uploader.single("productImage"), adminController.processCreateProduct);
adminRouter.get("/users", verifyAdmin, adminController.getUsersPage);
adminRouter.post("/users/:id/status", verifyAdmin, adminController.updateMemberStatus);
adminRouter.post("/logout", verifyAdmin, adminController.logout);

export default adminRouter;
