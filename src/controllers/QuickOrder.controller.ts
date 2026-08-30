import { Request, Response } from "express";
import QuickOrderService from "../services/QuickOrder.service";

const quickOrderService = new QuickOrderService();
const quickOrderController: any = {};

quickOrderController.createQuickOrder = async (req: Request, res: Response) => {
  try {
    const quickOrder = await quickOrderService.createQuickOrder(req.body);
    return res.status(201).json({
      message: "Your request has been received. We will contact you shortly.",
      data: quickOrder,
    });
  } catch (err: any) {
    console.error("ERROR, createQuickOrder", err);
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Unable to save the quick-order request.",
    });
  }
};

export default quickOrderController;
