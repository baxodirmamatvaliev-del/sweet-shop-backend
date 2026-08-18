import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyAdmin = (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies["accessToken"];

    if (!token) {
      return res.redirect("/admin/login");
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    if (decoded.memberType !== "ADMIN") {
      return res.status(403).send("Only administrators can access this page.");
    }

    req.member = decoded;
    next();
  } catch (err) {
    console.log("ERROR, verifyAdmin:", err);
    res.redirect("/admin/login");
  }
};
