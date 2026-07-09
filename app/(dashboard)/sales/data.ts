import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { SalesProduct } from "./SalesModule";

export type OrderModification = {
  name: string;
  price: number;
};

export type SalesOrderDetail = {
  orderNumber: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  orderDate: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  shippingAddress: string | null;
  salesperson: string;
  subtotal: number;
  discount: number;
  total: number;
  originalTotal: number;
  discountType: string | null;
  discountValue: number;
  manualTotalOverride: number | null;
  finalTotal: number;
  orderNote: string | null;
  notes: string | null;
  items: {
    id: number;
    productName: string;
    productBarcode: string | null;
    quantity: number;
    unitPrice: number;
    sellingPrice: number;
    totalPrice: number;
    itemNote: string | null;
    modifications: OrderModification[];
  }[];
};

async function getCurrentEmployeeId() {
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

  return employee?.employee_id ?? null;
}

function getOrderModifications(value: unknown): OrderModification[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((modification) => {
    if (!modification || typeof modification !== "object") {
      return [];
    }

    const record = modification as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const price = Number(record.price);

    if (!name || !Number.isFinite(price) || price <= 0) {
      return [];
    }

    return [{ name, price }];
  });
}

export async function getSalesPageData() {
  await auth.protect();

  const employeeId = await getCurrentEmployeeId();

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      where: {
        productType: "STANDARD",
      },
      orderBy: {
        name: "asc",
      },
      include: {
        stocks: true,
      },
    }),
    prisma.order.findMany({
      where: {
        employeeId: employeeId ?? -1,
      },
      orderBy: {
        orderDate: "desc",
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          select: {
            order_item_id: true,
          },
        },
      },
      take: 30,
    }),
  ]);

  return {
    products: products.map(
      (product): SalesProduct => ({
        product_id: product.product_id,
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        material: product.material ?? "غير محدد",
        dimensions: product.dimensions ?? "غير محدد",
        image_url: product.imageUrl,
        salePrice: Number(product.salePrice),
        current_amount: product.stocks.reduce(
          (total, stock) => total + stock.currentAmount,
          0,
        ),
      }),
    ),
    orders: orders.map((order) => ({
      id: order.orderNumber,
      status: order.status,
      customerName: order.customerName ?? "غير محدد",
      salesperson: order.employee
        ? `${order.employee.firstName} ${order.employee.lastName}`
        : "غير محدد",
      itemCount: order.items.length,
      total: Number(order.finalTotal ?? order.total),
      createdAt: order.orderDate.toISOString(),
    })),
  };
}

export async function getSalesOrderDetail(orderNumber: string) {
  await auth.protect();

  const employeeId = await getCurrentEmployeeId();

  if (!employeeId) {
    return null;
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      employeeId,
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      items: {
        orderBy: {
          order_item_id: "asc",
        },
        include: {
          product: {
            select: {
              barcode: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    orderDate: order.orderDate.toISOString(),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    shippingAddress: order.shippingAddress,
    salesperson: order.employee
      ? `${order.employee.firstName} ${order.employee.lastName}`
      : "غير محدد",
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    originalTotal: Number(order.originalTotal),
    discountType: order.discountType,
    discountValue: Number(order.discountValue),
    manualTotalOverride:
      order.manualTotalOverride === null ? null : Number(order.manualTotalOverride),
    finalTotal: Number(order.finalTotal),
    orderNote: order.orderNote,
    notes: order.notes,
    items: order.items.map((item) => ({
      id: item.order_item_id,
      productName: item.productName,
      productBarcode: item.product?.barcode ?? null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      sellingPrice: Number(item.sellingPrice),
      totalPrice: Number(item.totalPrice),
      itemNote: item.itemNote,
      modifications: getOrderModifications(item.modifications),
    })),
  } satisfies SalesOrderDetail;
}
