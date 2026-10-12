import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyAuth = (req: any, res: Response, next: NextFunction) => {
  const message = "Please log in or sign up to purchase products.";

  try {
    const token = req.cookies?.accessToken;
    if (typeof token !== "string" || !token) {
      return res.status(401).json({ message });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if (typeof decoded === "string" || typeof decoded._id !== "string" || !/^[a-f0-9]{24}$/i.test(decoded._id)) {
      return res.status(401).json({ message });
    }

    req.member = decoded;
  } catch {
    return res.status(401).json({ message });
  }

  next();
};
