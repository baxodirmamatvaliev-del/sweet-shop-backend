import express from "express";
import productRouter from "./routes/Product.route";
import memberRouter from "./routes/Member.route";
import { MORGAN_FORMAT } from "./libs/config";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(morgan(MORGAN_FORMAT));

app.get("/", (req, res) => {
  res.send("Salom, Sweet Shop backend ishlayapti! 🧁");
});

app.use("/products", productRouter);
app.use("/members", memberRouter);


export default app;