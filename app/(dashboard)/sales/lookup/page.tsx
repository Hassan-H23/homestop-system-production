import { SalesModule } from "../SalesModule";
import { getSalesPageData } from "../data";

export default async function SalesLookupPage() {
  const data = await getSalesPageData();

  return (
    <SalesModule
      initialMode="lookup"
      products={data.products}
      orders={data.orders}
    />
  );
}
