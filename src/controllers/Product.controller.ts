import { Request, Response, NextFunction } from "express";
import ProductService from "../services/Product.service";
import { HttpCode, Message } from "../libs/Errors";
import Errors from "../libs/Errors";

const productService = new ProductService();

const productController: any = {};

// Get all products: GET /products
productController.getProducts = async (req: Request, res: Response) => {
  try {
    console.log("getProducts");
    const result = await productService.getProducts();
    res.status(200).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, getProducts", err);
    throw new Errors(HttpCode.BAD_REQUEST, Message.ERROR_SERVICE);
  }
};

// Get a single product: GET /products/:id
productController.getProduct = async (req: Request, res: Response) => {
  try {
    console.log("getProduct");
    const { id } = req.params;
   const result = await productService.getProduct(id as string);
    res.status(200).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, getProduct", err);
     throw new Errors(HttpCode.BAD_REQUEST, Message.ERROR_SERVICE);
  }
};

// Create a new product: POST /products
productController.createProduct = async (req: Request, res: Response) => {
  try {
    console.log("createProduct");
    const result = await productService.createProduct(req.body);
    res.status(201).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, createProduct", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.ERROR_SERVICE);
  }
};


export default productController;
