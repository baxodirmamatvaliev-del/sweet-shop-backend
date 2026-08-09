import { Request, Response, NextFunction } from "express";
import ProductService from "../services/Product.service";

const productService = new ProductService();

const productController: any = {};

// Barcha mahsulotlarni olish: GET /products
productController.getProducts = async (req: Request, res: Response) => {
  try {
    console.log("getProducts");
    const result = await productService.getProducts();
    res.status(200).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, getProducts", err);
    res.status(err.code || 500).json({ message: err.message || "Server xatosi" });
  }
};

// Bitta mahsulotni olish: GET /products/:id
productController.getProduct = async (req: Request, res: Response) => {
  try {
    console.log("getProduct");
    const { id } = req.params;
   const result = await productService.getProduct(id as string);
    res.status(200).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, getProduct", err);
    res.status(err.code || 500).json({ message: err.message || "Server xatosi" });
  }
};

// Yangi mahsulot yaratish: POST /products
productController.createProduct = async (req: Request, res: Response) => {
  try {
    console.log("createProduct");
    const result = await productService.createProduct(req.body);
    res.status(201).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, createProduct", err);
    res.status(err.code || 500).json({ message: err.message || "Server xatosi" });
  }
};

// Mahsulotni yangilash: PUT /products/:id
productController.updateProduct = async (req: Request, res: Response) => {
  try {
    console.log("updateProduct");
    const { id } = req.params;
    const result = await productService.updateProduct(id as string, req.body);
    res.status(200).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, updateProduct", err);
    res.status(err.code || 500).json({ message: err.message || "Server xatosi" });
  }
};

export default productController;