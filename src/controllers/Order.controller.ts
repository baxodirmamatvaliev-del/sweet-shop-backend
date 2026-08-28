import { Response } from "express";
import OrderService from "../services/Order.service";

const orderService = new OrderService();
const orderController: any = {};

orderController.createOrder = async (req: any, res: Response) => {
  try {
    const result = await orderService.createOrder(req.member._id, req.body);
    return res.status(201).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, createOrder", err);
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Unable to create the order.",
    });
  }
};

export default orderController;
