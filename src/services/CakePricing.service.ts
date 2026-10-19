import mongoose from "mongoose";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { CakeOptionType } from "../libs/enums/cake.enum";
import CakeOptionModel from "../schema/CakeOption.model";

type CakeLayerInput = {
  spongeOptionId?: unknown;
  fillingOptionId?: unknown;
};

type ParsedCakeConfiguration = {
  sizeOptionId: string;
  layers: Array<{
    spongeOptionId: string;
    fillingOptionId: string;
  }>;
  creamOptionId: string;
  frostingOptionId: string;
  chocolateOptionIds: string[];
  fruitOptionIds: string[];
  decorationOptionIds: string[];
  message: string;
};

type CakeOptionRecord = {
  _id: { toString(): string };
  optionType: CakeOptionType;
  code: string;
  name: string;
  priceModifier: number;
};

type CakeOptionSnapshot = {
  optionId: string;
  optionType: CakeOptionType;
  code: string;
  name: string;
  priceModifier: number;
};

export type CakeConfigurationSnapshot = {
  size: CakeOptionSnapshot;
  layers: Array<{
    position: number;
    sponge: CakeOptionSnapshot;
    filling: CakeOptionSnapshot;
  }>;
  cream: CakeOptionSnapshot;
  frosting: CakeOptionSnapshot;
  chocolates: CakeOptionSnapshot[];
  fruits: CakeOptionSnapshot[];
  decorations: CakeOptionSnapshot[];
  message: string;
  basePrice: number;
  customizationPrice: number;
  finalPrice: number;
};

const roundMoney = (amount: number): number => Math.round(amount);

class CakePricingService {
  public async calculate(
    basePriceInput: unknown,
    configurationInput: unknown,
  ): Promise<CakeConfigurationSnapshot> {
    const basePrice = Number(basePriceInput);
    if (!Number.isFinite(basePrice) || basePrice < 0) this.invalid();

    const configuration = this.parseConfiguration(configurationInput);
    const optionIds = [
      configuration.sizeOptionId,
      configuration.creamOptionId,
      configuration.frostingOptionId,
      ...configuration.layers.flatMap((layer) => [
        layer.spongeOptionId,
        layer.fillingOptionId,
      ]),
      ...configuration.chocolateOptionIds,
      ...configuration.fruitOptionIds,
      ...configuration.decorationOptionIds,
    ];
    const uniqueOptionIds = [...new Set(optionIds)];
    const options = (await CakeOptionModel.find({
      _id: { $in: uniqueOptionIds },
      isActive: true,
    })
      .lean()
      .exec()) as unknown as CakeOptionRecord[];

    if (options.length !== uniqueOptionIds.length) this.invalid();

    const optionsById = new Map(
      options.map((option) => [option._id.toString(), option]),
    );
    const snapshot = (id: string, expectedType: CakeOptionType) => {
      const option = optionsById.get(id);
      if (!option || option.optionType !== expectedType) this.invalid();

      return {
        optionId: option._id.toString(),
        optionType: option.optionType,
        code: option.code,
        name: option.name,
        priceModifier: roundMoney(option.priceModifier),
      };
    };

    const size = snapshot(configuration.sizeOptionId, CakeOptionType.SIZE);
    const cream = snapshot(configuration.creamOptionId, CakeOptionType.CREAM);
    const frosting = snapshot(
      configuration.frostingOptionId,
      CakeOptionType.FROSTING,
    );
    const layers = configuration.layers.map((layer, index) => ({
      position: index + 1,
      sponge: snapshot(layer.spongeOptionId, CakeOptionType.SPONGE),
      filling: snapshot(layer.fillingOptionId, CakeOptionType.FILLING),
    }));
    const chocolates = configuration.chocolateOptionIds.map((id) =>
      snapshot(id, CakeOptionType.CHOCOLATE),
    );
    const fruits = configuration.fruitOptionIds.map((id) =>
      snapshot(id, CakeOptionType.FRUIT),
    );
    const decorations = configuration.decorationOptionIds.map((id) =>
      snapshot(id, CakeOptionType.DECORATION),
    );
    const selectedOptions = [
      size,
      cream,
      frosting,
      ...layers.flatMap((layer) => [layer.sponge, layer.filling]),
      ...chocolates,
      ...fruits,
      ...decorations,
    ];
    const customizationPrice = roundMoney(
      selectedOptions.reduce(
        (total, option) => total + option.priceModifier,
        0,
      ),
    );

    return {
      size,
      layers,
      cream,
      frosting,
      chocolates,
      fruits,
      decorations,
      message: configuration.message,
      basePrice: roundMoney(basePrice),
      customizationPrice,
      finalPrice: roundMoney(basePrice + customizationPrice),
    };
  }

  private parseConfiguration(input: unknown): ParsedCakeConfiguration {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      this.invalid();
    }

    const value = input as Record<string, unknown>;
    if (!Array.isArray(value.layers) || value.layers.length < 1 || value.layers.length > 5) {
      this.invalid();
    }

    const message = value.message === undefined ? "" : value.message;
    if (typeof message !== "string" || message.trim().length > 80) {
      this.invalid();
    }

    return {
      sizeOptionId: this.requireId(value.sizeOptionId),
      layers: value.layers.map((layer) => {
        if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
          this.invalid();
        }

        const layerInput = layer as CakeLayerInput;
        return {
          spongeOptionId: this.requireId(layerInput.spongeOptionId),
          fillingOptionId: this.requireId(layerInput.fillingOptionId),
        };
      }),
      creamOptionId: this.requireId(value.creamOptionId),
      frostingOptionId: this.requireId(value.frostingOptionId),
      chocolateOptionIds: this.parseOptionalIds(value.chocolateOptionIds),
      fruitOptionIds: this.parseOptionalIds(value.fruitOptionIds),
      decorationOptionIds: this.parseOptionalIds(value.decorationOptionIds),
      message: message.trim(),
    };
  }

  private parseOptionalIds(value: unknown): string[] {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.length > 10) this.invalid();

    const ids = value.map((id) => this.requireId(id));
    if (new Set(ids).size !== ids.length) this.invalid();
    return ids;
  }

  private requireId(value: unknown): string {
    if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
      this.invalid();
    }

    return value;
  }

  private invalid(): never {
    throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_CAKE_CONFIGURATION);
  }
}

export default CakePricingService;
