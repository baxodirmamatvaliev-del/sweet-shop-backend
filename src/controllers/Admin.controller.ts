import { Request, Response } from "express";
import ProductService from "../services/Product.service";
import Errors, { HttpCode, Message } from "../libs/Errors";
import MemberService from "../services/Member.service";
import { MemberType } from "../libs/enums/member.enum";
import { unlink } from "fs/promises";
import path from "path";
import QuickOrderService from "../services/QuickOrder.service";
import OrderService from "../services/Order.service";

const memberService = new MemberService();

const productService = new ProductService();
const quickOrderService = new QuickOrderService();
const orderService = new OrderService();

const adminController: any = {};

adminController.getOrdersPage = async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getOrders();
    res.render("orders", { orders });
  } catch (err) {
    console.error("ERROR, getOrdersPage", err);
    res.status(500).send("Unable to load orders.");
  }
};

adminController.updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id as string,
      req.body.status,
    );
    return res.status(200).json({
      message: "Order status updated successfully.",
      data: order,
    });
  } catch (err: any) {
    console.error("ERROR, updateOrderStatus", err);
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Unable to update the order status.",
    });
  }
};

adminController.getQuickOrdersPage = async (req: Request, res: Response) => {
  try {
    const quickOrders = await quickOrderService.getQuickOrders();
    res.render("quick-orders", { quickOrders });
  } catch (err) {
    console.error("ERROR, getQuickOrdersPage", err);
    res.status(500).send("Unable to load quick-order requests.");
  }
};

adminController.updateQuickOrderStatus = async (req: Request, res: Response) => {
  try {
    await quickOrderService.updateStatus(req.params.id as string, req.body.status);
    res.redirect("/admin/quick-orders");
  } catch (err: any) {
    console.error("ERROR, updateQuickOrderStatus", err);
    res.status(err.code ?? 500).send(err.message ?? "Unable to update the quick-order status.");
  }
};

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

adminController.updateProduct = async (req: Request, res: Response) => {
  try {
    const productName = String(req.body.productName ?? "").trim();
    const productPrice = Number(req.body.productPrice);
    const productCategory = String(req.body.productCategory ?? "");
    const productDesc = String(req.body.productDesc ?? "").trim();

    if (!productName || !Number.isFinite(productPrice) || productPrice < 0) {
      if (req.file?.path) await unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({ message: "Please provide valid product details." });
    }

    const input: any = { productName, productPrice, productCategory, productDesc };
    if (req.file) input.productImage = req.file.filename;

    const previousProduct = req.file
      ? await productService.getProductWithoutView(req.params.id as string)
      : null;
    const product = await productService.updateProduct(req.params.id as string, input);

    if (req.file && previousProduct?.productImage) {
      const oldImagePath = path.join("public", "uploads", path.basename(previousProduct.productImage));
      await unlink(oldImagePath).catch(() => undefined);
    }

    return res.status(200).json({
      message: "Product updated successfully.",
      data: product,
    });
  } catch (err: any) {
    if (req.file?.path) await unlink(req.file.path).catch(() => undefined);
    console.error("ERROR, updateProduct", err);
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Unable to update the product.",
    });
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
