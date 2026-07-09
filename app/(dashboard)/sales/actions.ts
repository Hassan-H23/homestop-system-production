"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createOrderWithItems,
  type CreateOrderItemInput,
  type DiscountType,
} from "@/lib/sales-order";

type CreateSalesOrderInput = {
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

export async function createSalesOrder(input: CreateSalesOrderInput) {
  await auth.protect();

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

  const order = await prisma.$transaction((tx) =>
    createOrderWithItems(tx, {
      ...input,
      orderNumber: makeOrderNumber(),
      employeeId: employee?.employee_id ?? null,
    }),
  );

  revalidatePath("/sales");
  revalidatePath("/sales/new-order");
  revalidatePath(`/sales/orders/${order.orderNumber}`);

  return {
    orderNumber: order.orderNumber,
    message: "تم إنشاء الطلب بنجاح",
  };
}