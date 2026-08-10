import mongoose from "mongoose";

export const AUTH_TIMER = 24;
export const MORGAN_FORMAT = ":method :url :response-time ms [:status] \n";

export const shapeIntoMongooseObjectId = (id: any) => {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
};