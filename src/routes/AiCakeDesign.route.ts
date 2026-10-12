import { Router } from "express";
import aiCakeDesignController from "../controllers/AiCakeDesign.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const aiCakeDesignRouter = Router();

aiCakeDesignRouter.get("/", verifyAuth, aiCakeDesignController.getHistory);
aiCakeDesignRouter.post("/generate", verifyAuth, aiCakeDesignController.generate);

export default aiCakeDesignRouter;
