import { Request, Response } from "express";
import ProductService from "../services/Product.service";
import Errors, { HttpCode, Message } from "../libs/Errors";

const productService = new ProductService();

const adminController: any = {};

// Admin panel: mahsulotlar ro'yxati sahifasi
adminController.getProductsPage = async (req: Request, res: Response) => {
  try {
    const products = await productService.getProducts();
    res.render("products", { products });
  } catch (err) {
    console.error("ERROR, getProductsPage", err);
    throw new Errors(HttpCode.BAD_REQUEST, Message.ERROR_SERVICE);
  }
};

// Mahsulot statusini o'zgartirish (pauza, tugagan, o'chirish)
adminController.updateProductStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await productService.updateProductStatus(id as string, status);
    res.redirect("/admin/products");
  } catch (err) {
    console.error("ERROR, updateProductStatus", err);
    res.status(500).send("Statusni o'zgartirishda xatolik");
  }
};

// Yangi mahsulot yaratish (forma + rasm)
adminController.processCreateProduct = async (req: Request, res: Response) => {
  try {
    const input = req.body;
    if (req.file) {
      input.productImage = req.file.filename;
    }
    await productService.createProduct(input);
    res.redirect("/admin/products");
  } catch (err) {
    console.error("ERROR, processCreateProduct", err);
    res.status(500).send("Error creating product!");
  }
};

export default adminController;