import { Router } from "express";
import productController from "../controllers/Product.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const productRouter = Router();

// products hammasini  olish
productRouter
.get("/", productController.getProducts);

//  products/:id 1tadan  mahsulotini olish
productRouter
.get("/:id", productController.getProduct);

// yangi mahsulot yaratish
productRouter
.post("/", verifyAuth, productController.createProduct); 

export default productRouter;