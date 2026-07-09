import { SalesModule } from "../SalesModule";
import { getSalesPageData } from "../data";

export default async function NewSalesOrderPage() {
  const data = await getSalesPageData();

  return (
    <SalesModule
      initialMode="new-order"
      products={data.products}
      orders={data.orders}
    />
  );
}
