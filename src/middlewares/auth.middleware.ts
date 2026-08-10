import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Errors, { HttpCode, Message } from "../libs/Errors";

export const verifyAuth = (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies["accessToken"];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      req.member = decoded;
    }

    if (!req.member) {
      throw new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED);
    }

    next();
  } catch (err) {
    console.log("ERROR, verifyAuth:", err);
    res.status(401).json({ message: "Iltimos, tizimga kiring" });
  }
};