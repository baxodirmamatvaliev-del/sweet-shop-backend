import MemberModel from "../schema/Member.model";
import Errors, { HttpCode, Message } from "../libs/Errors";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class MemberService {
  private readonly memberModel;

  constructor() {
    this.memberModel = MemberModel;
  }

  // "signup" bolamiz Baxodir
  public async signup(input: any): Promise<any> {

    const salt = await bcrypt.genSalt();  // paswordni hash qilamiz
    input.memberPassword = await bcrypt.hash(input.memberPassword, salt);

    try {
      const result = await this.memberModel.create(input); //inputni bazaga saqlaymiz
      result.memberPassword = ""; //]
      return result;
    } catch (err) {
      console.error("ERROR, model signup", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE);
    }
  }

  //  "login" bolamiz 
  public async login(input: any): Promise<any> {
  const member = await this.memberModel
    .findOne({ memberNick: input.memberNick })
    .select("+memberPassword")
    .exec();
  console.log("FOUND MEMBER:", member);
  if (!member) {
    throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);
  }

  const isMatch = await bcrypt.compare(input.memberPassword, member.memberPassword);

  if (!isMatch) {
    throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);
  }

  member.memberPassword = "";

  const token = jwt.sign(
    { _id: member._id, memberType: member.memberType },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" }
  );

  return { member, token };
}

}

export default MemberService;