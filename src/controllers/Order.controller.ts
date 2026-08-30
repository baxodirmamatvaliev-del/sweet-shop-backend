import { Response } from "express";
import OrderService from "../services/Order.service";

const orderService = new OrderService();
const orderController: any = {};

orderController.getMyOrders = async (req: any, res: Response) => {
  try {
    const orders = await orderService.getMyOrders(req.member._id.toString());
    return res.status(200).json({ data: orders });
  } catch (err: any) {
    console.error("ERROR, getMyOrders", err);
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Unable to load your orders.",
    });
  }
};

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
