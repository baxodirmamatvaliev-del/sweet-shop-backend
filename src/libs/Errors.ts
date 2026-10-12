export enum HttpCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  NOT_MODIFIED = 304,
  INTERNAL_SERVER_ERROR = 500,
  TOO_MANY_REQUESTS = 429,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

export enum Message {
  SOMETHING_WENT_WRONG = "Something went wrong!",
  NO_DATA_FOUND = "No data found!",
  CREATE_FAILED = "Creation failed!",
  UPDATE_FAILED = "Update failed!",
  USED_PRODUCT_NAME = "This product name is already in use!",
  INVALID_PRODUCT = "Please provide valid product details.",
  INVALID_ORDER = "Please provide valid delivery details and order items.",
  PRODUCT_NOT_AVAILABLE = "One or more products are unavailable.",
  INVALID_ORDER_STATUS = "Invalid order status.",
  ORDER_NOT_FOUND = "Order not found.",
  ORDER_CANNOT_BE_CANCELLED = "Only pending orders can be cancelled.",
  INVALID_DELIVERY_SLOT = "Please select a valid delivery slot.",
  DELIVERY_SLOT_UNAVAILABLE = "This delivery slot is no longer available.",
  INVALID_CAKE_CONFIGURATION = "Please provide a valid cake configuration.",
  INVALID_CAKE_OPTION = "Please provide valid cake option details.",
  USED_CAKE_OPTION_CODE = "This cake option code is already in use.",
  INVALID_AI_DESIGN_PROMPT = "Describe your cake idea in 10 to 500 characters.",
  AI_DESIGN_LIMIT_REACHED = "Daily AI design limit reached. Try again tomorrow.",
  AI_DESIGN_UNAVAILABLE = "AI cake design is temporarily unavailable.",
  AI_DESIGN_NOT_FOUND = "AI cake design not found.",
  INVALID_PHONE = "Enter a valid phone number in the 010-1234-5678 format.",
  INVALID_QUICK_ORDER_STATUS = "Invalid quick-order status.",
  QUICK_ORDER_NOT_FOUND = "Quick-order request not found.",
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
