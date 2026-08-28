import { Router } from "express";
import memberController from "../controllers/Member.controller";
import { verifyAuth } from "../middlewares/auth.middleware";
import uploader from "../uploader";

const memberRouter = Router();

memberRouter.
post("/signup", uploader.single("memberImage"), memberController.signup); // Member registration

memberRouter.
post("/login", memberController.login); // Member authentication

memberRouter.
post("/logout", memberController.logout); // End member session

memberRouter.
patch("/update", verifyAuth, memberController.updateMember); // Update own profile

export default memberRouter;
