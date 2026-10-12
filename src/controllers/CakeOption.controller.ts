import { Request, Response } from "express";
import CakeOptionService from "../services/CakeOption.service";

const cakeOptionService = new CakeOptionService();

const cakeOptionController = {
  getActiveOptions: async (_req: Request, res: Response) => {
    try {
      const options = await cakeOptionService.getActiveOptions();
      return res.status(200).json({ data: options });
    } catch (error) {
      console.error("ERROR, getActiveCakeOptions", error);
      return res.status(500).json({
        message: "Unable to load cake customization options.",
      });
    }
  },
};

export default cakeOptionController;
