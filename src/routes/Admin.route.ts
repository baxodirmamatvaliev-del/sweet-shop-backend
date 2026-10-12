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
adminRouter.get("/dashboard", verifyAdmin, adminController.getDashboardPage);
adminRouter.get("/analytics", verifyAdmin, adminController.getSalesOverview);
adminRouter.get("/products", verifyAdmin, adminController.getProductsPage);
adminRouter.post("/products/:id/status", verifyAdmin, adminController.updateProductStatus);
adminRouter.patch("/products/:id", verifyAdmin, uploader.single("productImage"), adminController.updateProduct);
adminRouter.post("/products/create", verifyAdmin, uploader.single("productImage"), adminController.processCreateProduct);
adminRouter.get("/users", verifyAdmin, adminController.getUsersPage);
adminRouter.post("/users/:id/status", verifyAdmin, adminController.updateMemberStatus);
adminRouter.get("/orders", verifyAdmin, adminController.getOrdersPage);
adminRouter.patch("/orders/:id/status", verifyAdmin, adminController.updateOrderStatus);
adminRouter.get("/quick-orders", verifyAdmin, adminController.getQuickOrdersPage);
adminRouter.post("/quick-orders/:id/status", verifyAdmin, adminController.updateQuickOrderStatus);
adminRouter.get("/cake-options", verifyAdmin, adminController.getCakeOptionsPage);
adminRouter.post("/cake-options/create", verifyAdmin, adminController.createCakeOption);
adminRouter.post("/cake-options/:id/update", verifyAdmin, adminController.updateCakeOption);
adminRouter.post("/cake-options/:id/status", verifyAdmin, adminController.updateCakeOptionStatus);
adminRouter.get("/delivery-slots", verifyAdmin, adminController.getDeliverySlotsPage);
adminRouter.post("/delivery-slots/create", verifyAdmin, adminController.createDeliverySlot);
adminRouter.post("/delivery-slots/:id/update", verifyAdmin, adminController.updateDeliverySlot);
adminRouter.post("/delivery-slots/:id/status", verifyAdmin, adminController.updateDeliverySlotStatus);
adminRouter.post("/logout", verifyAdmin, adminController.logout);

export default adminRouter;
