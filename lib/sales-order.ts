import { prisma } from "@/lib/prisma";

type ProductDelegate = Pick<
  typeof prisma.product,
  "findMany" | "findUnique" | "create"
>;

type SalesOrderTx = {
  product: ProductDelegate;
  order: Pick<typeof prisma.order, "create">;
  orderChange: Pick<typeof prisma.orderChange, "create">;
  productStock: Pick<typeof prisma.productStock, "findFirst" | "update">;
};

export type DiscountType = "percentage" | "fixed" | null;

export type OrderModificationInput = {
  name: string;
  price: number;
};

export type ExistingProductOrderItemInput = {
  kind: "existing";
  productId: number;
  quantity: number;
  sellingPrice: number;
  modifications: OrderModificationInput[];
  itemNote?: string;
};

export type FullyCustomOrderItemInput = {
  kind: "fullyCustom";
  quantity: number;
  sellingPrice: number;
  itemNote?: string;
  modifications: OrderModificationInput[];
  customProduct: {
    name: string;
    category: string;
    salePrice: number;
    material?: string;
    dimensions?: string;
    imageUrl?: string;
    details?: string;
  };
};

export type CreateOrderItemInput =
  | ExistingProductOrderItemInput
  | FullyCustomOrderItemInput;

export type CreateOrderWithItemsInput = {
  orderNumber: string;
  employeeId?: number | null;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  orderNote?: string;
  discountType: DiscountType;
  discountValue: number;
  manualTotalOverride?: number | null;
  items: CreateOrderItemInput[];
};

type CleanOrderItemBase = {
  quantity: number;
  sellingPrice: number;
  modifications: OrderModificationInput[];
  itemNote: string | null;
  totalPrice: number;
};

export type CleanOrderItem =
  | (Omit<
      ExistingProductOrderItemInput,
      "quantity" | "sellingPrice" | "modifications" | "itemNote"
    > &
      CleanOrderItemBase)
  | (Omit<
      FullyCustomOrderItemInput,
      "quantity" | "sellingPrice" | "modifications" | "itemNote"
    > &
      CleanOrderItemBase);

export function toMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function cleanText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function validateMoney(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be zero or more.`);
  }
}

export async function validateProductBarcode(
  barcode: string,
  product: Pick<typeof prisma.product, "findUnique"> = prisma.product,
) {
  if (!/^\d+$/.test(barcode)) {
    throw new Error("Product barcode must contain digits only.");
  }

  if (barcode.length % 2 !== 0) {
    throw new Error("Product barcode must have an even number of digits.");
  }

  const existing = await product.findUnique({
    where: {
      barcode,
    },
    select: {
      product_id: true,
    },
  });

  if (existing) {
    throw new Error("Product barcode must be unique.");
  }
}

export async function generateProductBarcode(product: ProductDelegate = prisma.product) {
  const products = await product.findMany({
    select: {
      barcode: true,
    },
  });
  const numericBarcodes = products
    .map((item) => item.barcode)
    .filter((barcode) => /^\d+$/.test(barcode) && barcode.length % 2 === 0);
  const maxBarcode = numericBarcodes.reduce<bigint>((max, barcode) => {
    const current = BigInt(barcode);
    return current > max ? current : max;
  }, BigInt("350000000000"));

  for (let attempt = 1; attempt <= 200; attempt += 1) {
    const candidate = (maxBarcode + BigInt(attempt)).toString();
    const barcode = candidate.length % 2 === 0 ? candidate : `0${candidate}`;
    const existing = await product.findUnique({
      where: {
        barcode,
      },
      select: {
        product_id: true,
      },
    });

    if (!existing) {
      await validateProductBarcode(barcode, product);
      return barcode;
    }
  }

  throw new Error("Could not generate a unique product barcode.");
}

export function cleanModifications(modifications: OrderModificationInput[]) {
  return modifications.map((modification) => {
    const name = modification.name.trim();
    const price = toMoney(Number(modification.price));

    if (!name) {
      throw new Error("Modification name is required when a modification is added.");
    }

    validateMoney(price, "Modification price");

    return {
      name,
      price,
    };
  });
}

export function validateOrderItem(item: CreateOrderItemInput): CleanOrderItem {
  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }

  const sellingPrice = toMoney(Number(item.sellingPrice));
  validateMoney(sellingPrice, "Selling price");

  const modifications = cleanModifications(item.modifications ?? []);
  const totalPrice = toMoney(item.quantity * sellingPrice);
  const itemNote = cleanText(item.itemNote);

  if (item.kind === "fullyCustom") {
    const name = item.customProduct.name.trim();
    const category = item.customProduct.category.trim();
    const salePrice = toMoney(Number(item.customProduct.salePrice));

    if (!name) {
      throw new Error("Fully custom product name is required.");
    }

    if (!category) {
      throw new Error("Fully custom product category is required.");
    }

    validateMoney(salePrice, "Sale price");

    return {
      ...item,
      customProduct: {
        ...item.customProduct,
        name,
        category,
        salePrice,
      },
      quantity: item.quantity,
      sellingPrice,
      modifications,
      itemNote,
      totalPrice,
    };
  }

  return {
    ...item,
    quantity: item.quantity,
    sellingPrice,
    modifications,
    itemNote,
    totalPrice,
  };
}

export function calculateOrderTotals(input: {
  items: { totalPrice: number }[];
  discountType: DiscountType;
  discountValue: number;
  manualTotalOverride?: number | null;
}) {
  const subtotal = toMoney(
    input.items.reduce((sum, item) => sum + Number(item.totalPrice), 0),
  );
  const discountValue = toMoney(Number(input.discountValue));
  validateMoney(discountValue, "Discount");

  const discount =
    input.discountType === "percentage"
      ? toMoney(subtotal * Math.min(discountValue, 100) * 0.01)
      : input.discountType === "fixed"
        ? toMoney(Math.min(discountValue, subtotal))
        : 0;
  const calculatedFinalTotal = toMoney(Math.max(0, subtotal - discount));
  const manualTotalOverride =
    input.manualTotalOverride === null || input.manualTotalOverride === undefined
      ? null
      : toMoney(Number(input.manualTotalOverride));

  if (manualTotalOverride !== null) {
    validateMoney(manualTotalOverride, "Manual total override");
  }

  return {
    subtotal,
    discount,
    discountValue,
    manualTotalOverride,
    finalTotal: manualTotalOverride ?? calculatedFinalTotal,
  };
}

export async function createCustomizedProductFromExisting(
  tx: Pick<SalesOrderTx, "product">,
  input: {
    baseProductId: number;
    sellingPrice: number;
    modifications: OrderModificationInput[];
  },
) {
  const baseProduct = await tx.product.findUnique({
    where: {
      product_id: input.baseProductId,
    },
  });

  if (!baseProduct) {
    throw new Error("Selected product no longer exists.");
  }

  const barcode = await generateProductBarcode(tx.product);

  return tx.product.create({
    data: {
      barcode,
      name: `${baseProduct.name} - Custom`,
      category: baseProduct.category,
      material: baseProduct.material,
      dimensions: baseProduct.dimensions,
      imageUrl: baseProduct.imageUrl,
      salePrice: String(input.sellingPrice),
      new_item: true,
      productType: "CUSTOMIZED_FROM_EXISTING",
      baseProductId: baseProduct.product_id,
      modificationDetails: input.modifications,
    },
  });
}

export async function createFullyCustomProduct(
  tx: Pick<SalesOrderTx, "product">,
  input: FullyCustomOrderItemInput["customProduct"] & {
    modifications: OrderModificationInput[];
  },
) {
  const barcode = await generateProductBarcode(tx.product);
  const detailText = cleanText(input.details);
  const modificationDetails = detailText
    ? [...input.modifications, { name: "Details", price: 0, details: detailText }]
    : input.modifications;

  return tx.product.create({
    data: {
      barcode,
      name: input.name.trim(),
      category: input.category.trim(),
      material: cleanText(input.material),
      dimensions: cleanText(input.dimensions),
      imageUrl: cleanText(input.imageUrl),
      salePrice: String(toMoney(Number(input.salePrice))),
      new_item: true,
      productType: "FULLY_CUSTOM",
      baseProductId: null,
      modificationDetails,
    },
  });
}

export async function createOrderWithItems(tx: SalesOrderTx, input: CreateOrderWithItemsInput) {
  const customerName = input.customerName.trim();

  if (!customerName) {
    throw new Error("Customer name is required.");
  }

  if (input.items.length === 0) {
    throw new Error("Cannot create an empty order.");
  }

  const cleanItems = input.items.map(validateOrderItem);
  const totals = calculateOrderTotals({
    items: cleanItems,
    discountType: input.discountType,
    discountValue: input.discountValue,
    manualTotalOverride: input.manualTotalOverride,
  });
  const orderItems = [];

  for (const item of cleanItems) {
    if (item.kind === "fullyCustom") {
      const customProduct = await createFullyCustomProduct(tx, {
        ...item.customProduct,
        modifications: item.modifications,
      });

      orderItems.push({
        productId: customProduct.product_id,
        productName: customProduct.name,
        quantity: item.quantity,
        unitPrice: String(customProduct.salePrice),
        sellingPrice: String(item.sellingPrice),
        totalPrice: String(item.totalPrice),
        itemNote: item.itemNote,
        modifications: item.modifications,
        stockProductId: null as number | null,
      });
      continue;
    }

    const baseProduct = await tx.product.findUnique({
      where: {
        product_id: item.productId,
      },
    });

    if (!baseProduct) {
      throw new Error("Selected product no longer exists.");
    }

    const productForOrder =
      item.modifications.length > 0
        ? await createCustomizedProductFromExisting(tx, {
            baseProductId: baseProduct.product_id,
            sellingPrice: item.sellingPrice,
            modifications: item.modifications,
          })
        : baseProduct;

    orderItems.push({
      productId: productForOrder.product_id,
      productName: productForOrder.name,
      quantity: item.quantity,
      unitPrice: String(baseProduct.salePrice),
      sellingPrice: String(item.sellingPrice),
      totalPrice: String(item.totalPrice),
      itemNote: item.itemNote,
      modifications: item.modifications,
      stockProductId: baseProduct.product_id,
    });
  }

  const createdOrder = await tx.order.create({
    data: {
      orderNumber: input.orderNumber,
      customerName,
      customerPhone: cleanText(input.customerPhone),
      customerEmail: cleanText(input.customerEmail),
      shippingAddress: cleanText(input.shippingAddress),
      employeeId: input.employeeId ?? null,
      subtotal: String(totals.subtotal),
      discount: String(totals.discount),
      total: String(totals.finalTotal),
      notes: cleanText(input.orderNote),
      originalTotal: String(totals.subtotal),
      discountType: input.discountType,
      discountValue: String(totals.discountValue),
      manualTotalOverride:
        totals.manualTotalOverride === null ? null : String(totals.manualTotalOverride),
      finalTotal: String(totals.finalTotal),
      orderNote: cleanText(input.orderNote),
      items: {
        create: orderItems.map((item) => {
          const { stockProductId, ...orderItem } = item;
          void stockProductId;
          return orderItem;
        }),
      },
    },
    include: {
      items: true,
    },
  });

  await tx.orderChange.create({
    data: {
      orderId: createdOrder.order_id,
      employeeId: input.employeeId ?? null,
      action: "ORDER_CREATED",
      note: JSON.stringify({
        ...totals,
        discountType: input.discountType,
        items: orderItems,
      }),
    },
  });

  for (const item of orderItems) {
    if (!item.stockProductId) {
      continue;
    }

    const stock = await tx.productStock.findFirst({
      where: {
        productId: item.stockProductId,
      },
      orderBy: {
        product_stock_id: "asc",
      },
    });

    if (stock) {
      await tx.productStock.update({
        where: {
          product_stock_id: stock.product_stock_id,
        },
        data: {
          currentAmount: Math.max(0, stock.currentAmount - item.quantity),
        },
      });
    }
  }

  return createdOrder;
}