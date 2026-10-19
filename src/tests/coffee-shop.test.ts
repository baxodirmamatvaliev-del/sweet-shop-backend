import test from "node:test";
import assert from "node:assert/strict";
import ProductService from "../services/Product.service";
import ProductModel from "../schema/Product.model";
import { coffeeShopCategories } from "../libs/enums/product.enum";

const ejs = require("ejs");

test("catalog queries exclude deleted products", async () => {
  const original = ProductModel.find;
  let filter: unknown;
  try {
    (ProductModel as any).find = (query: unknown) => {
      filter = query;
      return { exec: async () => [] };
    };
    assert.deepEqual(await new ProductService().getProducts(), []);
    assert.deepEqual(filter, { productStatus: { $ne: "DELETE" } });
  } finally {
    ProductModel.find = original;
  }
});

test("admin menu renders coffee categories, KRW prices, and a useful empty state", async () => {
  const locals = { products: [], categories: coffeeShopCategories, createError: null, formData: {} };
  const empty = await ejs.renderFile("src/views/products.ejs", locals);
  assert.match(empty, /Your coffee menu is empty/);
  assert.match(empty, /value="COFFEE"/);
  assert.equal((empty.match(/name="productTemperature"/g) || []).length, 2);
  assert.match(empty, /value="ICE"/);
  assert.match(empty, /value="HOT"/);
  assert.match(empty, /Price \(₩ KRW\)/);
  assert.doesNotMatch(empty, /value="BIRTHDAY_CAKE"|Cake options|floating-sweet/);
  const populated = await ejs.renderFile("src/views/products.ejs", { ...locals, products: [{ _id: "test", productName: "Latte", productPrice: 4500, productCategory: "COFFEE", productStatus: "PROCESS", productViews: 0 }] });
  assert.match(populated, /₩4,500/);
});

 test("product temperature accepts ICE, HOT and unset, and rejects unknown values", () => {
  for (const temperature of ["ICE", "HOT", null, undefined]) {
    const product = new ProductModel({ productName: "Latte", productPrice: 4500, productCategory: "COFFEE", productTemperature: temperature });
    assert.equal(product.validateSync(), undefined);
  }
  const invalid = new ProductModel({ productName: "Latte", productPrice: 4500, productCategory: "COFFEE", productTemperature: "WARM" });
  assert.ok(invalid.validateSync()?.errors.productTemperature);
});
