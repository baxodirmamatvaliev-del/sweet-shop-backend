import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Salom, Sweet Shop backend ishlayapti! 🧁");
});

export default app;