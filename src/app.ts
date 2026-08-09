import express from "express";
import productRouter from "./routes/Product.route";
import memberRouter from "./routes/Member.route";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Salom, Sweet Shop backend ishlayapti! 🧁");
});
app.use("/products", productRouter);
app.use("/members", memberRouter);


export default app;