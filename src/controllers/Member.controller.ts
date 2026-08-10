import { Request, Response } from "express";
import MemberService from "../services/Member.service";

const memberService = new MemberService();

const memberController: any = {};

// members signup boladi yani Authentication boladi
memberController.signup = async (req: Request, res: Response) => { //
  try {
    console.log("signup");

    const result = await memberService.signup(req.body); // kelgan inputni DB ga saqlaymz  natija result ga saqlaymiz
    res.status(201).json({ data: result }); //natijani json formatda qaytaramiz

  } catch (err: any) {

    console.error("ERROR, signup", err);
    res.status(err.code || 500).json({ message: err.message || "Server xatosi" });
  }
};

//  members login bu yerda ham shunday login Authentication boladi 
memberController.login = async (req: Request, res: Response) => {
  try {
    console.log("login");

    const { member, token } = await memberService.login(req.body); //kelgan datani DB da tekshiramiz togri bosa member , token ga saqlamz
    res.cookie("accessToken", token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true, // buni faqat server oqishi mumkin, client oqiy olmaydi, hafsiz qildik 

    });
    res.status(200).json({ data: member }); // natijani json daa qaytaramz

  } catch (err: any) {
    
    console.error("ERROR, login", err);
    res.status(err.code || 500).json({ message: err.message || "Server xatosi" });
  }
};

export default memberController;