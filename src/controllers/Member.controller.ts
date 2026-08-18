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
      memberType: MemberType.USER,
    });
    res.status(201).json({ data: result });

  } catch (err: any) {
    console.error("ERROR, signup", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.ERROR_SERVICE);
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
     throw new Errors(HttpCode.BAD_REQUEST, Message.ERROR_SERVICE);
  }
};

export default memberController;
