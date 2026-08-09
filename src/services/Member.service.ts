import MemberModel from "../schema/Member.model";
import Errors, { HttpCode, Message } from "../libs/Errors";
import * as bcrypt from "bcryptjs";

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
  public async login(input: any): Promise<any> { //inputni bazadan tekshiramiz
    const member = await this.memberModel 

      .findOne({ memberNick: input.memberNick }) //bzadan memberNick ni input bilan tekchiramiz ekanda endi 
      .select("+memberPassword") 
      .exec();

    if (!member) {
      throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK); 
    }

    const isMatch = await bcrypt.compare(input.memberPassword, member.memberPassword); //inputdagi paswordni DD dagisi bulan tekshimizz

    if (!isMatch) {
      throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);
    }

    member.memberPassword = ""; 
    return member;
  }
}

export default MemberService;