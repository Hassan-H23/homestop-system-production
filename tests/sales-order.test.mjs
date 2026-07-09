import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);

function loadSalesOrderModule(mockPrisma = {}) {
  const sourcePath = path.resolve("lib/sales-order.ts");
  const source = fs.readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const cjsModule = { exports: {} };
  const localRequire = (id) => {
    if (id === "@/lib/prisma") {
      return { prisma: mockPrisma };
    }

    return nodeRequire(id);
  };

  new Function("require", "module", "exports", transpiled)(
    localRequire,
    cjsModule,
    cjsModule.exports,
  );

  return cjsModule.exports;
}

function createMockTx() {
  const products = [
    {
      product_id: 1,
      barcode: "350000000002",
      name: "Standard Table",
      category: "Tables",
      material: "Wood",
      dimensions: "120x60",
      imageUrl: null,
      salePrice: "1000",
    },
  ];
  const createdProducts = [];
  let orderId = 10;

  const tx = {
    createdProducts,
    product: {
      findMany: async () => [...products, ...createdProducts].map((product) => ({ barcode: product.barcode })),
      findUnique: async ({ where }) => {
        if (where.barcode) {
          return [...products, ...createdProducts].find((product) => product.barcode === where.barcode) ?? null;
        }

        return [...products, ...createdProducts].find((product) => product.product_id === where.product_id) ?? null;
      },
      create: async ({ data }) => {
        const product = {
          product_id: products.length + createdProducts.length + 1,
          ...data,
        };
        createdProducts.push(product);
        return product;
      },
    },
    order: {
      create: async ({ data }) => ({
        order_id: orderId++,
        orderNumber: data.orderNumber,
        items: data.items.create,
      }),
    },
    orderChange: {
      create: async ({ data }) => data,
    },
    productStock: {
      findFirst: async () => ({ product_stock_id: 1, currentAmount: 5 }),
      update: async ({ data }) => data,
    },
  };

  return tx;
}

test("validates numeric even unique barcodes", async () => {
  const { validateProductBarcode } = loadSalesOrderModule();

  await assert.rejects(
    () => validateProductBarcode("ABC123", { findUnique: async () => null }),
    /digits only/,
  );
  await assert.rejects(
    () => validateProductBarcode("123", { findUnique: async () => null }),
    /even number/,
  );
  await assert.rejects(
    () => validateProductBarcode("1234", { findUnique: async () => ({ product_id: 1 }) }),
    /unique/,
  );
  await validateProductBarcode("1234", { findUnique: async () => null });
});

test("generates the next unique numeric even-length barcode", async () => {
  const { generateProductBarcode } = loadSalesOrderModule();
  const barcode = await generateProductBarcode({
    findMany: async () => [{ barcode: "350000000002" }],
    findUnique: async ({ where }) => where.barcode === "350000000003" ? { product_id: 2 } : null,
  });

  assert.match(barcode, /^\d+$/);
  assert.equal(barcode.length % 2, 0);
  assert.equal(barcode, "350000000004");
});

test("calculates order totals and manual overrides", () => {
  const { calculateOrderTotals } = loadSalesOrderModule();

  assert.deepEqual(
    calculateOrderTotals({
      items: [{ totalPrice: 100 }, { totalPrice: 50 }],
      discountType: "percentage",
      discountValue: 10,
    }),
    {
      subtotal: 150,
      discount: 15,
      discountValue: 10,
      manualTotalOverride: null,
      finalTotal: 135,
    },
  );

  assert.equal(
    calculateOrderTotals({
      items: [{ totalPrice: 150 }],
      discountType: "fixed",
      discountValue: 20,
      manualTotalOverride: 99,
    }).finalTotal,
    99,
  );
});

test("creates customized and fully custom products with expected metadata", async () => {
  const tx = createMockTx();
  const { createCustomizedProductFromExisting, createFullyCustomProduct } = loadSalesOrderModule();

  const customized = await createCustomizedProductFromExisting(tx, {
    baseProductId: 1,
    sellingPrice: 1200,
    modifications: [{ name: "Fabric", price: 0 }],
  });
  assert.equal(customized.productType, "CUSTOMIZED_FROM_EXISTING");
  assert.equal(customized.baseProductId, 1);
  assert.equal(customized.new_item, true);

  const custom = await createFullyCustomProduct(tx, {
    name: "One-off Sofa",
    category: "Sofas",
    salePrice: 2500,
    modifications: [],
  });
  assert.equal(custom.productType, "FULLY_CUSTOM");
  assert.equal(custom.baseProductId, null);
  assert.equal(custom.new_item, true);
});

test("price-only existing items do not create products, modifications and fully custom items do", async () => {
  const { createOrderWithItems } = loadSalesOrderModule();
  const priceOnlyTx = createMockTx();

  await createOrderWithItems(priceOnlyTx, {
    orderNumber: "SO-1",
    customerName: "Customer",
    discountType: null,
    discountValue: 0,
    items: [
      {
        kind: "existing",
        productId: 1,
        quantity: 2,
        sellingPrice: 900,
        modifications: [],
      },
    ],
  });
  assert.equal(priceOnlyTx.createdProducts.length, 0);

  const modifiedTx = createMockTx();
  await createOrderWithItems(modifiedTx, {
    orderNumber: "SO-2",
    customerName: "Customer",
    discountType: null,
    discountValue: 0,
    items: [
      {
        kind: "existing",
        productId: 1,
        quantity: 1,
        sellingPrice: 1200,
        modifications: [{ name: "Color", price: 0 }],
      },
      {
        kind: "fullyCustom",
        quantity: 1,
        sellingPrice: 3000,
        modifications: [],
        customProduct: {
          name: "Custom Chair",
          category: "Chairs",
          salePrice: 3000,
        },
      },
    ],
  });
  assert.equal(modifiedTx.createdProducts.length, 2);
});