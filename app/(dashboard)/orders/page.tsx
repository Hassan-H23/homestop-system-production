"use client";

import { Card, Elevation, H1, Icon } from "@/app/components/mantine-ui";

export default function OrdersPage() {
  return (
    <Card elevation={Elevation.ONE} dir="rtl">
      <div className="flex items-center gap-3">
        <Icon icon="shopping-cart" size={28} />
        <H1 className="m-0">Orders</H1>
      </div>
    </Card>
  );
}
