"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type DiscountType = "percentage" | "fixed" | null;

type CreateSalesOrderItem = {
  productId: number;
  quantity: number;
  sellingPrice: number;
  productName: string;
  modifications: { name: string; price: number }[];
  itemNote?: string;
};

type CreateSalesOrderInput = {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  orderNote?: string;
  discountType: DiscountType;
  discountValue: number;
  manualTotalOverride?: number | null;
  items: CreateSalesOrderItem[];
};

function makeOrderNumber() {
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");

  return `SO-${datePart}-${Date.now().toString().slice(-6)}`;
}

function toMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function validateMoney(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be zero or more.`);
  }
}

function cleanText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function makeCustomBarcode(
  tx: {
    product: {
      findUnique: typeof prisma.product.findUnique;
    };
  },
  originalBarcode: string,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = `${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 7)}`.toUpperCase();
    const barcode = `${originalBarcode}-C-${suffix}`;
    const existing = await tx.product.findUnique({
      where: {
        barcode,
      },
      select: {
        product_id: true,
      },
    });

    if (!existing) {
      return barcode;
    }
  }

  throw new Error("Could not generate a unique custom barcode.");
}

export async function createSalesOrder(input: CreateSalesOrderInput) {
  await auth.protect();

  const customerName = input.customerName.trim();

  if (!customerName) {
    throw new Error("Customer name is required.");
  }

  if (input.items.length === 0) {
    throw new Error("Cannot create an empty order.");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const employee = email
    ? await prisma.employee.findUnique({
        where: {
          email,
        },
        select: {
          employee_id: true,
        },
      })
    : null;

  if (!employee) {
    throw new Error("Could not find an employee record for the current user.");
  }

  const cleanItems = input.items.map((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Quantity must be at least 1.");
    }

    validateMoney(item.sellingPrice, "Selling price");

    const modifications = item.modifications
      .map((modification) => ({
        name: modification.name.trim(),
        price: toMoney(Number(modification.price)),
      }))
      .filter((modification) => modification.name && modification.price > 0);

    return {
      ...item,
      sellingPrice: toMoney(item.sellingPrice),
      modifications,
      itemNote: cleanText(item.itemNote),
    };
  });

  validateMoney(input.discountValue, "Discount");

  const originalTotal = toMoney(
    cleanItems.reduce((sum, item) => {
      const modificationTotal = item.modifications.reduce(
        (modSum, modification) => modSum + modification.price,
        0,
      );

      return sum + (item.sellingPrice + modificationTotal) * item.quantity;
    }, 0),
  );
  const discountAmount =
    input.discountType === "percentage"
      ? toMoney(originalTotal * Math.min(input.discountValue, 100) * 0.01)
      : input.discountType === "fixed"
        ? toMoney(Math.min(input.discountValue, originalTotal))
        : 0;
  const calculatedFinalTotal = toMoney(Math.max(0, originalTotal - discountAmount));
  const manualTotalOverride =
    input.manualTotalOverride === null || input.manualTotalOverride === undefined
      ? null
      : toMoney(input.manualTotalOverride);

  if (manualTotalOverride !== null) {
    validateMoney(manualTotalOverride, "Manual total override");
  }

  const finalTotal = manualTotalOverride ?? calculatedFinalTotal;

  const order = await prisma.$transaction(async (tx) => {
    const orderItems = [];

    for (const item of cleanItems) {
      const originalProduct = await tx.product.findUnique({
        where: {
          product_id: item.productId,
        },
      });

      if (!originalProduct) {
        throw new Error("Selected product no longer exists.");
      }

      const modificationTotal = item.modifications.reduce(
        (sum, modification) => sum + modification.price,
        0,
      );
      const productForOrder =
        item.modifications.length > 0
          ? await tx.product.create({
              data: {
                barcode: await makeCustomBarcode(tx, originalProduct.barcode),
                name: `${originalProduct.name} - Custom`,
                category: originalProduct.category,
                material: originalProduct.material,
                dimensions: originalProduct.dimensions,
                imageUrl: originalProduct.imageUrl,
                salePrice: String(item.sellingPrice + modificationTotal),
                new_item: true,
              },
            })
          : originalProduct;

      orderItems.push({
        productId: productForOrder.product_id,
        productName: productForOrder.name,
        quantity: item.quantity,
        unitPrice: String(item.sellingPrice),
        sellingPrice: String(item.sellingPrice),
        totalPrice: String(toMoney((item.sellingPrice + modificationTotal) * item.quantity)),
        itemNote: item.itemNote,
        modifications: item.modifications,
        originalProductId: originalProduct.product_id,
      });
    }

    const createdOrder = await tx.order.create({
      data: {
        orderNumber: makeOrderNumber(),
        customerName,
        customerPhone: cleanText(input.customerPhone),
        customerEmail: cleanText(input.customerEmail),
        shippingAddress: cleanText(input.shippingAddress),
        employeeId: employee.employee_id,
        subtotal: String(originalTotal),
        discount: String(discountAmount),
        total: String(finalTotal),
        notes: cleanText(input.orderNote),
        originalTotal: String(originalTotal),
        discountType: input.discountType,
        discountValue: String(input.discountValue),
        manualTotalOverride:
          manualTotalOverride === null ? null : String(manualTotalOverride),
        finalTotal: String(finalTotal),
        orderNote: cleanText(input.orderNote),
        items: {
          create: orderItems.map(({ originalProductId: _originalProductId, ...item }) => item),
        },
      },
      include: {
        items: true,
      },
    });

    await tx.orderChange.create({
      data: {
        orderId: createdOrder.order_id,
        employeeId: employee.employee_id,
        action: "ORDER_CREATED",
        note: JSON.stringify({
          originalTotal,
          discountType: input.discountType,
          discountValue: input.discountValue,
          discountAmount,
          manualTotalOverride,
          finalTotal,
          items: orderItems,
        }),
      },
    });

    for (const item of orderItems) {
      const stock = await tx.productStock.findFirst({
        where: {
          productId: item.originalProductId,
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
  });

  revalidatePath("/sales");
  revalidatePath("/sales/new-order");

  return {
    orderNumber: order.orderNumber,
  };
}
