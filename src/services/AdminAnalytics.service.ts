import { OrderStatus } from "../libs/enums/order.enum";
import { MemberStatus, MemberType } from "../libs/enums/member.enum";
import { ProductStatus } from "../libs/enums/product.enum";
import MemberModel from "../schema/Member.model";
import OrderModel from "../schema/Order.model";
import ProductModel from "../schema/Product.model";

type SalesSummaryRow = {
  totalOrders: number;
  grossOrderValue: number;
  deliveredRevenue: number;
};

type StatusCountRow = {
  _id: string;
  count: number;
};

type DailyRevenueRow = {
  _id: string;
  revenue: number;
  orders: number;
};

type SalesAggregationResult = {
  summary: SalesSummaryRow[];
  statusCounts: StatusCountRow[];
  dailyRevenue: DailyRevenueRow[];
};

export type AdminSalesOverview = {
  totalOrders: number;
  grossOrderValue: number;
  deliveredRevenue: number;
  totalCustomers: number;
  activeProducts: number;
  lowStockProducts: number;
  statusCounts: Record<string, number>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const roundMoney = (amount: number): number => Math.round(amount * 100) / 100;

class AdminAnalyticsService {
  public async getSalesOverview(now = new Date()): Promise<AdminSalesOverview> {
    const seoulNow = new Date(now.getTime() + SEOUL_OFFSET_MS);
    const startDate = new Date(
      Date.UTC(
        seoulNow.getUTCFullYear(),
        seoulNow.getUTCMonth(),
        seoulNow.getUTCDate() - 6,
      ) - SEOUL_OFFSET_MS,
    );
    const [aggregation, totalCustomers, activeProducts, lowStockProducts] =
      await Promise.all([
        OrderModel.aggregate([
          {
            $facet: {
              summary: [
                {
                  $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    grossOrderValue: {
                      $sum: {
                        $cond: [
                          { $ne: ["$orderStatus", OrderStatus.CANCELLED] },
                          "$total",
                          0,
                        ],
                      },
                    },
                    deliveredRevenue: {
                      $sum: {
                        $cond: [
                          { $eq: ["$orderStatus", OrderStatus.DELIVERED] },
                          "$total",
                          0,
                        ],
                      },
                    },
                  },
                },
              ],
              statusCounts: [
                { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
              ],
              dailyRevenue: [
                {
                  $match: {
                    orderStatus: OrderStatus.DELIVERED,
                    createdAt: { $gte: startDate },
                  },
                },
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        date: "$createdAt",
                        format: "%Y-%m-%d",
                        timezone: "+09:00",
                      },
                    },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
            },
          },
        ]).exec() as Promise<SalesAggregationResult[]>,
        MemberModel.countDocuments({
          memberType: MemberType.USER,
          memberStatus: { $ne: MemberStatus.DELETE },
        }).exec(),
        ProductModel.countDocuments({
          productStatus: ProductStatus.PROCESS,
        }).exec(),
        ProductModel.countDocuments({
          trackInventory: true,
          $expr: { $lte: ["$inventoryQuantity", "$lowStockThreshold"] },
        }).exec(),
      ]);
    const [result] = aggregation;
    const summary = result?.summary[0];
    const statusCounts = Object.fromEntries(
      Object.values(OrderStatus).map((status) => [status, 0]),
    );

    for (const row of result?.statusCounts ?? []) {
      statusCounts[row._id] = row.count;
    }

    const revenueByDate = new Map(
      (result?.dailyRevenue ?? []).map((row) => [row._id, row]),
    );
    const dailyRevenue = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate.getTime() + index * DAY_MS);
      const dateKey = new Date(date.getTime() + SEOUL_OFFSET_MS)
        .toISOString()
        .slice(0, 10);
      const row = revenueByDate.get(dateKey);

      return {
        date: dateKey,
        revenue: roundMoney(row?.revenue ?? 0),
        orders: row?.orders ?? 0,
      };
    });

    return {
      totalOrders: summary?.totalOrders ?? 0,
      grossOrderValue: roundMoney(summary?.grossOrderValue ?? 0),
      deliveredRevenue: roundMoney(summary?.deliveredRevenue ?? 0),
      totalCustomers,
      activeProducts,
      lowStockProducts,
      statusCounts,
      dailyRevenue,
    };
  }
}

export default AdminAnalyticsService;
