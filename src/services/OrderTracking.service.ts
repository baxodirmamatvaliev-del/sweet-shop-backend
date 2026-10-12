import { EventEmitter } from "node:events";

export type TrackingStatusHistory = {
  status: string;
  changedAt: string;
  source: string;
};

export type OrderTrackingSnapshot = {
  _id: string;
  customerName: string;
  address: string;
  orderStatus: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    itemTotal: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryDate?: string;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  statusHistory: TrackingStatusHistory[];
  createdAt: string;
  updatedAt: string;
};

class OrderTrackingService {
  private readonly events = new EventEmitter();

  constructor() {
    this.events.setMaxListeners(0);
  }

  public toSnapshot(order: any): OrderTrackingSnapshot {
    const snapshot: OrderTrackingSnapshot = {
      _id: order._id.toString(),
      customerName: order.customerName,
      address: order.address,
      orderStatus: order.orderStatus,
      items: (order.items ?? []).map((item: any) => ({
        productId: item.productId.toString(),
        productName: item.productName,
        productImage: item.productImage ?? "",
        quantity: item.quantity,
        itemTotal: item.itemTotal,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      statusHistory: (order.statusHistory ?? []).map((entry: any) => ({
        status: entry.status,
        changedAt: new Date(entry.changedAt).toISOString(),
        source: entry.source,
      })),
      createdAt: new Date(order.createdAt).toISOString(),
      updatedAt: new Date(order.updatedAt).toISOString(),
    };

    if (order.deliveryDate) snapshot.deliveryDate = order.deliveryDate;
    if (order.deliveryStartTime) {
      snapshot.deliveryStartTime = order.deliveryStartTime;
    }
    if (order.deliveryEndTime) snapshot.deliveryEndTime = order.deliveryEndTime;

    return snapshot;
  }

  public publish(order: any): void {
    this.events.emit(this.eventName(order._id.toString()), this.toSnapshot(order));
  }

  public subscribe(
    orderId: string,
    listener: (snapshot: OrderTrackingSnapshot) => void,
  ): () => void {
    const eventName = this.eventName(orderId);
    this.events.on(eventName, listener);
    return () => this.events.off(eventName, listener);
  }

  private eventName(orderId: string): string {
    return `order:${orderId}`;
  }
}

export default new OrderTrackingService();
