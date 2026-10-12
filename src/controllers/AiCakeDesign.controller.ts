import { Response } from "express";
import AiCakeDesignService from "../services/AiCakeDesign.service";

const aiCakeDesignService = new AiCakeDesignService();
const aiCakeDesignController: any = {};

aiCakeDesignController.getHistory = async (req: any, res: Response) => {
  try {
    const result = await aiCakeDesignService.getHistory(req.member._id.toString());
    return res.status(200).json({ data: result });
  } catch (error: any) {
    return res.status(error.code ?? 500).json({
      message: error.message ?? "Unable to load AI cake designs.",
    });
  }
};

aiCakeDesignController.generate = async (req: any, res: Response) => {
  try {
    const result = await aiCakeDesignService.generate(
      req.member._id.toString(),
      req.body.prompt,
    );
    return res.status(201).json({ data: result });
  } catch (error: any) {
    return res.status(error.code ?? 500).json({
      message: error.message ?? "Unable to generate an AI cake design.",
    });
  }
};

export default aiCakeDesignController;
