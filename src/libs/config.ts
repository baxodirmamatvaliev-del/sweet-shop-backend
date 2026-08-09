import mongoose from "mongoose";

export const shapeIntoMongooseObjectId = (id: any) => {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
};