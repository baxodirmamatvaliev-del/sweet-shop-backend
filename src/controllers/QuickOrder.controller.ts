import { Request, Response } from "express";
import QuickOrderService from "../services/QuickOrder.service";

const quickOrderService = new QuickOrderService();
const quickOrderController: any = {};

quickOrderController.createQuickOrder = async (req: Request, res: Response) => {
  try {
    const quickOrder = await quickOrderService.createQuickOrder(req.body);
    return res.status(201).json({
      message: "So‘rovingiz qabul qilindi. Tez orada siz bilan bog‘lanamiz.",
      data: quickOrder,
    });
  } catch (err: any) {
    console.error("ERROR, createQuickOrder", err);
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Quick-order so‘rovini saqlab bo‘lmadi.",
    });
  }
};

export default quickOrderController;
