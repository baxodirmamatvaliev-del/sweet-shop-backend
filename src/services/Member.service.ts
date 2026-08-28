import MemberModel from "../schema/Member.model";
import Errors, { HttpCode, Message } from "../libs/Errors";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { shapeIntoMongooseObjectId } from "../libs/config";

class MemberService {
  private readonly memberModel;

  constructor() {
    this.memberModel = MemberModel;
  }

  // Create a new member account
  public async signup(input: any): Promise<any> {

    const salt = await bcrypt.genSalt();
    input.memberPassword = await bcrypt.hash(input.memberPassword, salt);

    try {
      const result = await this.memberModel.create(input);
      result.memberPassword = "";
      return result;
    } catch (err) {
      console.error("ERROR, model signup", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE);
    }
  }

  // Authenticate a member
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

  public async getMembers(): Promise<any[]> {
    return this.memberModel
      .find({})
      .select("memberNick memberPhone memberType memberStatus memberAddress createdAt")
      .sort({ createdAt: -1 })
      .exec();
  }

  public async updateMemberStatus(memberId: string, status: string): Promise<any> {
    const id = shapeIntoMongooseObjectId(memberId);

    const result = await this.memberModel
      .findByIdAndUpdate(id, { memberStatus: status }, { new: true, runValidators: true })
      .exec();

    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
    return result;
  }

  public async updateMember(memberId: string, input: any): Promise<any> {
    const id = shapeIntoMongooseObjectId(memberId);
    const allowedFields = [
      "memberNick",
      "memberPhone",
      "memberAddress",
      "memberDesc",
    ] as const;
    const update: Record<string, string> = {};

    for (const field of allowedFields) {
      if (input[field] === undefined) continue;

      if (typeof input[field] !== "string") {
        throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_MEMBER_UPDATE);
      }

      const value = input[field].trim();
      if ((field === "memberNick" || field === "memberPhone") && !value) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_MEMBER_UPDATE);
      }

      update[field] = value;
    }

    if (Object.keys(update).length === 0) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_MEMBER_UPDATE);
    }

    try {
      const result = await this.memberModel
        .findByIdAndUpdate(id, update, { new: true, runValidators: true })
        .exec();

      if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
      return result;
    } catch (err: any) {
      if (err instanceof Errors) throw err;
      if (err?.code === 11000) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE);
      }

      throw new Errors(HttpCode.BAD_REQUEST, Message.UPDATE_FAILED);
    }
  }

}

export default MemberService;
