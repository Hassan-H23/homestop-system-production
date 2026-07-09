import { SalesModule } from "./SalesModule";
import { getSalesPageData } from "./data";

export default async function SalesPage() {
  const data = await getSalesPageData();

  return <SalesModule products={data.products} orders={data.orders} />;
}
