import express from "express";
import productRouter from "./routes/Product.route";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Salom, Sweet Shop backend ishlayapti! 🧁");
});
app.use("/products", productRouter);


export default app;