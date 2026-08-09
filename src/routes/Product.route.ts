import { Router } from "express";
import productController from "../controllers/Product.controller";

const productRouter = Router();

// products - barcha mahsulotlarni olish
productRouter.get("/", productController.getProducts);

//  /products/:id - bitta mahsulotni olish
productRouter.get("/:id", productController.getProduct);

// products - yangi mahsulot yaratish
productRouter.post("/", productController.createProduct);

export default productRouter;