import { Response } from "express";
import OrderService from "../services/Order.service";
import orderTrackingService, {
  OrderTrackingSnapshot,
} from "../services/OrderTracking.service";

const orderService = new OrderService();
const orderController: any = {};

orderController.getMyOrderTracking = async (req: any, res: Response) => {
  try {
    const tracking = await orderService.getMyOrderTracking(
      req.member._id.toString(),
      req.params.id as string,
    );
    return res.status(200).json({ data: tracking });
  } catch (err: any) {
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Unable to load order tracking.",
    });
  }
};

orderController.streamMyOrderTracking = async (req: any, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const tracking = await orderService.getMyOrderTracking(
      req.member._id.toString(),
      orderId,
    );

    res.status(200);
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const sendTracking = (snapshot: OrderTrackingSnapshot) => {
      res.write(`event: tracking\ndata: ${JSON.stringify(snapshot)}\n\n`);
    };
    sendTracking(tracking);

    const unsubscribe = orderTrackingService.subscribe(orderId, sendTracking);
    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 25_000);

    res.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  } catch (err: any) {
    if (!res.headersSent) {
      return res.status(err.code ?? 500).json({
        message: err.message ?? "Unable to stream order tracking.",
      });
    }
    return res.end();
  }
};

orderController.cancelMyOrder = async (req: any, res: Response) => {
  try {
    const order = await orderService.cancelMyOrder(
      req.member._id.toString(),
      req.params.id as string,
    );
    return res.status(200).json({
      message: "Order cancelled successfully.",
      data: order,
    });
  } catch (err: any) {
    console.error("ERROR, cancelMyOrder", err);
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Unable to cancel the order.",
    });
  }
};

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
