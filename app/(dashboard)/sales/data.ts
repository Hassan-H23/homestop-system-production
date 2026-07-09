import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { SalesProduct } from "./SalesModule";

export async function getSalesPageData() {
  await auth.protect();

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        stocks: true,
      },
    }),
    prisma.order.findMany({
      orderBy: {
        orderDate: "desc",
      },
      include: {
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
      itemCount: order.items.length,
      total: Number(order.total),
      createdAt: order.orderDate.toISOString(),
    })),
  };
}
