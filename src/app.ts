import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import productRouter from "./routes/Product.route";
import memberRouter from "./routes/Member.route";
import { MORGAN_FORMAT } from "./libs/config";
import adminRouter from "./routes/Admin.route";
import cors from "cors";
import orderRouter from "./routes/Order.route";
import quickOrderRouter from "./routes/QuickOrder.route";
import deliverySlotRouter from "./routes/DeliverySlot.route";

const app = express();
const clientOrigins = (
  process.env.CLIENT_URLS ??
  process.env.CLIENT_URL ??
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isAllowedOrigin = (origin?: string): boolean =>
  !origin || clientOrigins.includes(origin);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());
app.use(morgan(MORGAN_FORMAT));
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  }),
);
app.use("/admin", adminRouter);


app.set("view engine", "ejs");
app.set("views", "src/views");
app.use(express.static("public"));


app.get("/", (req, res) => {
  res.send("Morrow Coffee backend is running.");
});


app.use("/products", productRouter);
app.use("/members", memberRouter);
app.use("/orders", orderRouter);
app.use("/quick-orders", quickOrderRouter);
app.use("/delivery-slots", deliverySlotRouter);

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (error.message === "Origin is not allowed by CORS.") {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  },
);

export default app;
