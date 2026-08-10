import { Router } from "express";
import memberController from "../controllers/Member.controller";

const memberRouter = Router();

memberRouter.
post("/signup", memberController.signup); // member signup Authentication 

memberRouter.
post("/login", memberController.login); // member login Aunthentication

export default memberRouter;