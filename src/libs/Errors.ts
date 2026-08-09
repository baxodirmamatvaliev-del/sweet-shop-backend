export enum HttpCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  NOT_MODIFIED = 304,
  INTERNAL_SERVER_ERROR = 500,
}

export enum Message {
  SOMETHING_WENT_WRONG = "Nimadir xato ketdi!",
  NO_DATA_FOUND = "Malumot topilmadi!",
  CREATE_FAILED = "Yaratish muvaffaqiyatsiz tugadi!",
  UPDATE_FAILED = "Yangilash muvaffaqiyatsiz tugadi!",
  USED_PRODUCT_NAME = "Bu mahsulot nomi allaqachon band!",
  USED_NICK_PHONE = "USED_NICK_PHONE",
  NO_MEMBER_NICK = "NO_MEMBER_NICK",
  WRONG_PASSWORD = "WRONG_PASSWORD",
}

class Errors extends Error {
  public code: HttpCode;
  public message: Message;

  constructor(code: HttpCode, message: Message) {
    super(message);
    this.code = code;
    this.message = message;
  }
}

export default Errors;