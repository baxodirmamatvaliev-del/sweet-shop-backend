import mongoose from "mongoose";
import Errors, { HttpCode, Message } from "../libs/Errors";
import CakeOptionModel from "../schema/CakeOption.model";

class CakeOptionService {
  public async getActiveOptions(): Promise<any[]> {
    return CakeOptionModel.find({ isActive: true })
      .select(
        "optionType code name description priceModifier previewImage previewColor sortOrder",
      )
      .sort({ optionType: 1, sortOrder: 1, name: 1 })
      .lean()
      .exec();
  }

  public async getOptions(): Promise<any[]> {
    return CakeOptionModel.find()
      .sort({ optionType: 1, sortOrder: 1, name: 1 })
      .lean()
      .exec();
  }

  public async createOption(input: Record<string, unknown>): Promise<any> {
    try {
      return await CakeOptionModel.create(input);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.USED_CAKE_OPTION_CODE);
      }
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_CAKE_OPTION);
    }
  }

  public async updateOption(
    optionId: string,
    input: Record<string, unknown>,
  ): Promise<any> {
    if (!mongoose.isValidObjectId(optionId)) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_CAKE_OPTION);
    }

    try {
      const option = await CakeOptionModel.findByIdAndUpdate(optionId, input, {
        new: true,
        runValidators: true,
      }).exec();

      if (!option) {
        throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
      }
      return option;
    } catch (error: any) {
      if (error instanceof Errors) throw error;
      if (error?.code === 11000) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.USED_CAKE_OPTION_CODE);
      }
      throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_CAKE_OPTION);
    }
  }

  public updateActiveStatus(optionId: string, isActive: boolean): Promise<any> {
    return this.updateOption(optionId, { isActive });
  }
}

export default CakeOptionService;
