import { Router } from "express";
import productController from "../controllers/Product.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";

const productRouter = Router();

// Get all products
productRouter
.get("/", productController.getProducts);

// Get one product by ID
productRouter
.get("/:id", productController.getProduct);

// Create a new product
productRouter
.post("/", verifyAdmin, productController.createProduct);

export default productRouter;
