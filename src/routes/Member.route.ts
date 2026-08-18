import { Router } from "express";
import memberController from "../controllers/Member.controller";

const memberRouter = Router();

memberRouter.
post("/signup", memberController.signup); // Member registration

memberRouter.
post("/login", memberController.login); // Member authentication

export default memberRouter;
