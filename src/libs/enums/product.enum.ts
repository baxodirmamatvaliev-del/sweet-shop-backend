export enum ProductCategory {
  COFFEE = "COFFEE",
  TEA = "TEA",
  ADE = "ADE",
  SMOOTHIE = "SMOOTHIE",
  DESSERT = "DESSERT",
  CUPCAKE = "CUPCAKE",
  CAKE = "CAKE",
  BIRTHDAY_CAKE = "BIRTHDAY_CAKE",
  COOKIE = "COOKIE",
  OTHER = "OTHER",
}

export enum ProductStatus {
  PROCESS = "PROCESS",
  PAUSE = "PAUSE",
  SOLD_OUT = "SOLD_OUT",
  DELETE = "DELETE",
}

export const coffeeShopCategories: ProductCategory[] = [
  ProductCategory.COFFEE,
  ProductCategory.TEA,
  ProductCategory.ADE,
  ProductCategory.SMOOTHIE,
  ProductCategory.DESSERT,
  ProductCategory.OTHER,
];

export enum ProductTemperature {
  ICE = "ICE",
  HOT = "HOT",
}
