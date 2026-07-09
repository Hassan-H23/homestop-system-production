"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type CreateSalesOrderItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  finalBarcode: string;
  modifications: { name: string; price: number }[];
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

export async function createSalesOrder(items: CreateSalesOrderItem[]) {
  await auth.protect();

  if (items.length === 0) {
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

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        orderNumber: makeOrderNumber(),
        subtotal: String(subtotal),
        total: String(subtotal),
        notes: "Created from sales new-order flow.",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: String(item.unitPrice),
            totalPrice: String(item.totalPrice),
          })),
        },
      },
    });

    await tx.orderChange.create({
      data: {
        orderId: createdOrder.order_id,
        employeeId: employee?.employee_id,
        action: "ORDER_CREATED",
        note: JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            finalBarcode: item.finalBarcode,
            modifications: item.modifications,
          })),
        ),
      },
    });

    for (const item of items) {
      const stock = await tx.productStock.findFirst({
        where: {
          productId: item.productId,
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
