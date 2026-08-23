import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import productRouter from "./routes/Product.route";
import memberRouter from "./routes/Member.route";
import { MORGAN_FORMAT } from "./libs/config";
import adminRouter from "./routes/Admin.route";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());
app.use(morgan(MORGAN_FORMAT));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use("/admin", adminRouter);


app.set("view engine", "ejs");
app.set("views", "src/views");
app.use(express.static("public"));


app.get("/", (req, res) => {
  res.send("Sweet Shop backend is running! 🧁");
});


app.use("/products", productRouter);
app.use("/members", memberRouter);


export default app;