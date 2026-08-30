import ProductModel from "../schema/Product.model";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";

class ProductService {
  private readonly productModel;

  constructor() {
    this.productModel = ProductModel;
  }

  public async getProducts(): Promise<any[]> { 

    const result = await this.productModel.find({}).exec();

    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result;
  }

  public async getProduct(productId: string): Promise<any> {
    const id = shapeIntoMongooseObjectId(productId);

    const result = await this.productModel
    .findByIdAndUpdate(id , { $inc: {productViews: 1}},{new: true}).exec();

    if(!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    return result;
  }

  public async getProductWithoutView(productId: string): Promise<any> {
    const id = shapeIntoMongooseObjectId(productId);
    const result = await this.productModel.findById(id).exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    return result;
  }

  public async createProduct(input: any): Promise<any> {
    try {
        console.log("createProduct");
      const result = await this.productModel.create(input);
      
      return result;

    } catch (err: any) {

      console.error("ERROR, model createProduct", err);
      if (err?.code === 11000) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.USED_PRODUCT_NAME);
      }

      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

    }
  }

  public async updateProduct(productId: string, input: any): Promise<any> {
    try {
      const id = shapeIntoMongooseObjectId(productId);
      const result = await this.productModel
        .findByIdAndUpdate(id, input, { new: true, runValidators: true })
        .exec();

      if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
      return result;
    } catch (err: any) {
      if (err instanceof Errors) throw err;
      if (err?.code === 11000) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.USED_PRODUCT_NAME);
      }
      throw new Errors(HttpCode.BAD_REQUEST, Message.UPDATE_FAILED);
    }
  }

  // Update only the product status
  public async updateProductStatus(productId: string, status: string): Promise<any> {

  const id = shapeIntoMongooseObjectId(productId);
  const result = await this.productModel
    .findByIdAndUpdate(id, { productStatus: status }, { returnDocument: "after" })
    .exec();
  if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
  return result;

}
}

export default ProductService;
