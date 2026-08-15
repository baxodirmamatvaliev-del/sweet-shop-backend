import { Request , Response } from "express";
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

export default adminController;