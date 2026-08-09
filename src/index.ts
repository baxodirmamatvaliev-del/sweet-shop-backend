
import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import mongoose from "mongoose";

mongoose
  .connect(process.env.MONGO_URL as string)
  .then(() => {
    console.log("MongoDB connection succeed");
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      console.log("The server is running successfully on PORT:", PORT);
    });
  })
  .catch((err) => {
    console.log("ERROR on connection MongoDB", err);
  });