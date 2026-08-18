import { Request, Response } from "express";
import ProductService from "../services/Product.service";
import Errors, { HttpCode, Message } from "../libs/Errors";
import MemberService from "../services/Member.service";

const memberService = new MemberService();

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

// Admin panel: foydalanuvchilar ro'yxati
adminController.getUsersPage = async (req: Request, res: Response) => {
  try {
    const members = await memberService.getMembers();
    res.render("users", { members });
  } catch (err) {
    console.error("ERROR, getUsersPage", err);
    res.status(500).send("Foydalanuvchilarni yuklashda xatolik yuz berdi.");
  }
};

// Foydalanuvchi statusini o'zgartirish
adminController.updateMemberStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await memberService.updateMemberStatus(id as string, status);
    res.redirect("/admin/users");
  } catch (err) {
    console.error("ERROR, updateMemberStatus", err);
    res.status(500).send("Foydalanuvchi statusini o'zgartirib bo'lmadi.");
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
    res.status(500).send("Error! changing status");
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
    res.status(500).send("Error! creating product!");
  }
};

adminController.getLoginPage = (req: Request, res: Response) => {
  res.render("login", { error: null });
};

adminController.processLogin = async (req: Request, res: Response) => {
  try {
    const { member, token } = await memberService.login(req.body);
    res.cookie("accessToken", token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.redirect("/admin/products");
  } catch (err) {
    console.error("ERROR, processLogin", err);
    res.render("login", { error: "Incorrect login or password" });
  }
};

// Admin sessiyasini tugatish
adminController.logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken", { httpOnly: true });
  res.redirect("/admin/login");
};

export default adminController;
