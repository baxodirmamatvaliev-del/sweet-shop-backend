import { Request, Response } from "express";
import ProductService from "../services/Product.service";
import Errors, { HttpCode, Message } from "../libs/Errors";
import MemberService from "../services/Member.service";
import { MemberType } from "../libs/enums/member.enum";
import { unlink } from "fs/promises";

const memberService = new MemberService();

const productService = new ProductService();

const adminController: any = {};

// Admin panel: products page
adminController.getProductsPage = async (req: Request, res: Response) => {
  try {
    const products = await productService.getProducts();
    res.render("products", { products, createError: null, formData: {} });
  } catch (err) {
    console.error("ERROR, getProductsPage", err);
    throw new Errors(HttpCode.BAD_REQUEST, Message.ERROR_SERVICE);
  }
};

// Admin panel: users page
adminController.getUsersPage = async (req: Request, res: Response) => {
  try {
    const members = await memberService.getMembers();
    res.render("users", { members });
  } catch (err) {
    console.error("ERROR, getUsersPage", err);
    res.status(500).send("Unable to load users.");
  }
};

// Update a member's status
adminController.updateMemberStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await memberService.updateMemberStatus(id as string, status);
    res.redirect("/admin/users");
  } catch (err) {
    console.error("ERROR, updateMemberStatus", err);
    res.status(500).send("Unable to update the user's status.");
  }
};

// Update product status (pause, sold out, delete)
adminController.updateProductStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await productService.updateProductStatus(id as string, status);
    res.redirect("/admin/products");
  } catch (err) {
    console.error("ERROR, updateProductStatus", err);
    res.status(500).send("Unable to update the product status.");
  }
};

// Create a product from the admin form
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

    if (req.file?.path) {
      await unlink(req.file.path).catch(() => undefined);
    }

    const products = await productService.getProducts().catch(() => []);
    const createError = err instanceof Errors
      ? err.message
      : Message.CREATE_FAILED;

    res.status(400).render("products", {
      products,
      createError,
      formData: req.body,
    });
  }
};

adminController.getLoginPage = (req: Request, res: Response) => {
  res.render("login", { error: null, registered: req.query.registered === "true" });
};

adminController.getSignupPage = (req: Request, res: Response) => {
  res.render("signup", { error: null });
};


adminController.processSignup = async (req: Request, res: Response) => {
  try {
    const { memberNick, memberPhone, memberPassword, memberAddress, memberDesc } = req.body;

    await memberService.signup({
      memberNick,
      memberPhone,
      memberPassword,
      memberAddress,
      memberDesc,
      memberType: MemberType.USER,
    });

    res.redirect("/admin/login?registered=true");
  } catch (err) {
    console.error("ERROR, processSignup", err);
    res.render("signup", { error: "Unable to create your account. The username or phone number may already be in use." });
  }
};

adminController.processLogin = async (req: Request, res: Response) => {
  try {
    const { member, token } = await memberService.login(req.body);

    if (member.memberType !== MemberType.ADMIN) {
      return res.render("login", { error: "This area is restricted to administrators." });
    }

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

// End the admin session
adminController.logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken", { httpOnly: true });
  res.redirect("/admin/login");
};

export default adminController;
