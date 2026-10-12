import { Router } from "express";
import cakeOptionController from "../controllers/CakeOption.controller";

const cakeOptionRouter = Router();

cakeOptionRouter.get("/", cakeOptionController.getActiveOptions);

export default cakeOptionRouter;
