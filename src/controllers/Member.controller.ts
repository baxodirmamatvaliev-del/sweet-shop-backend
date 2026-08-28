import { Request, Response } from "express";
import MemberService from "../services/Member.service";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { MemberType } from "../libs/enums/member.enum";

const memberService = new MemberService();
const memberController: any = {};

// Member registration
memberController.signup = async (req: Request, res: Response) => { //
  try {
    console.log("signup");
    const { memberNick, memberPhone, memberPassword, memberAddress, memberDesc } = req.body;
    const result = await memberService.signup({
      memberNick,
      memberPhone,
      memberPassword,
      memberAddress,
      memberDesc,
      memberImage: req.file ? `uploads/${req.file.filename}` : undefined,
      memberType: MemberType.USER,
    });
    res.status(201).json({ data: result });

   } catch (err: any) {
  console.error("ERROR, signup", err);

  return res.status(err.code ?? 500).json({
    message: err.message ?? "Signup failed",
   });
 }
};

// Member authentication
memberController.login = async (req: Request, res: Response) => {
  try {

    console.log("login");
    const { member, token } = await memberService.login(req.body);
    res.cookie("accessToken", token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.status(200).json({ data: member });

  } catch (err: any) {
  console.error("ERROR, login", err);

  return res.status(err.code ?? 500).json({
    message: err.message ?? "Login failed",
  });
}
};

// End the member session
memberController.logout = (_req: Request, res: Response) => {
  res.clearCookie("accessToken", { httpOnly: true });
  return res.status(200).json({ message: "Logged out successfully." });
};

// Update the authenticated member's profile
memberController.updateMember = async (req: any, res: Response) => {
  try {
    const result = await memberService.updateMember(req.member._id, req.body);
    return res.status(200).json({ data: result });
  } catch (err: any) {
    console.error("ERROR, updateMember", err);
    return res.status(err.code ?? 500).json({
      message: err.message ?? "Unable to update the profile.",
    });
  }
};

export default memberController;
