export enum HttpCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  NOT_MODIFIED = 304,
  INTERNAL_SERVER_ERROR = 500,
}

export enum Message {
  SOMETHING_WENT_WRONG = "Something went wrong!",
  NO_DATA_FOUND = "No data found!",
  CREATE_FAILED = "Creation failed!",
  UPDATE_FAILED = "Update failed!",
  USED_PRODUCT_NAME = "This product name is already in use!",
  INVALID_ORDER = "Please provide valid delivery details and order items.",
  PRODUCT_NOT_AVAILABLE = "One or more products are unavailable.",
  INVALID_MEMBER_UPDATE = "Please provide valid profile information.",
  USED_NICK_PHONE = "USED_NICK_PHONE",
  NO_MEMBER_NICK = "NO_MEMBER_NICK",
  WRONG_PASSWORD = "WRONG_PASSWORD",
  NOT_AUTHENTICATED = "You are not authenticated, Please login first!",
  ERROR_SERVICE= "Error the service"
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
