import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/app/components/mantine-ui";
import { getSalesOrderDetail, type SalesOrderDetail } from "../../data";
import styles from "../../sales.module.css";

type SalesOrderDetailPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const statusLabels: Record<SalesOrderDetail["status"], string> = {
  PENDING: "جديد",
  PROCESSING: "قيد التنفيذ",
  SHIPPED: "جاهز للتسليم",
  DELIVERED: "مكتمل",
  CANCELLED: "ملغي",
};

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClass(status: SalesOrderDetail["status"]) {
  if (status === "PROCESSING") {
    return styles.statusProgress;
  }

  if (status === "SHIPPED") {
    return styles.statusReady;
  }

  if (status === "DELIVERED") {
    return styles.statusDone;
  }

  if (status === "CANCELLED") {
    return styles.statusCanceled;
  }

  return "";
}

function detailValue(value: string | null) {
  return value?.trim() ? value : "غير محدد";
}

function getDiscountLabel(order: SalesOrderDetail) {
  if (!order.discountType) {
    return "بدون خصم";
  }

  if (order.discountType === "percentage") {
    return `${order.discountValue}%`;
  }

  return formatCurrency(order.discountValue);
}

export default async function SalesOrderDetailPage({
  params,
}: SalesOrderDetailPageProps) {
  const { orderNumber } = await params;
  const order = await getSalesOrderDetail(decodeURIComponent(orderNumber));

  if (!order) {
    notFound();
  }

  return (
    <div className={`${styles.page} ${styles.detailPage}`}>
      <Link className={styles.backLink} href="/sales">
        <Icon icon="chevron-right" size={18} />
        <span>العودة إلى المبيعات</span>
      </Link>

      <section className={styles.hero}>
        <div className={styles.titleBlock}>
          <p className={styles.muted}>تفاصيل الطلب</p>
          <h1 className={styles.title}>{order.orderNumber}</h1>
          <p className={styles.subtitle}>{formatOrderDate(order.orderDate)}</p>
        </div>
        <span className={`${styles.status} ${getStatusClass(order.status)}`}>
          {statusLabels[order.status]}
        </span>
      </section>

      <section className={styles.panel}>
        <div className={styles.stack}>
          <h2 className={styles.sectionTitle}>بيانات العميل</h2>
          <div className={styles.infoGrid}>
            <div className={styles.detailRow}>
              <span>اسم العميل</span>
              <strong>{detailValue(order.customerName)}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>رقم الهاتف</span>
              <strong>{detailValue(order.customerPhone)}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>البريد الإلكتروني</span>
              <strong>{detailValue(order.customerEmail)}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>عنوان التسليم</span>
              <strong>{detailValue(order.shippingAddress)}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>المندوب</span>
              <strong>{order.salesperson}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.stack}>
          <h2 className={styles.sectionTitle}>المنتجات</h2>
          <div className={styles.lineItems}>
            {order.items.map((item) => (
              <article key={item.id} className={styles.lineItem}>
                <div className={styles.orderHeader}>
                  <div className={styles.stack}>
                    <h3 className={styles.productName}>{item.productName}</h3>
                    {item.productBarcode && (
                      <span className={styles.barcode}>{item.productBarcode}</span>
                    )}
                  </div>
                  <strong>{formatCurrency(item.totalPrice)}</strong>
                </div>

                <div className={styles.meta}>
                  <span>الكمية: {item.quantity}</span>
                  <span>سعر البيع: {formatCurrency(item.sellingPrice)}</span>
                  <span>سعر الوحدة: {formatCurrency(item.unitPrice)}</span>
                </div>

                {item.modifications.length > 0 ? (
                  <div className={styles.modificationList}>
                    <strong>التعديلات</strong>
                    {item.modifications.map((modification) => (
                      <div key={`${item.id}-${modification.name}`} className={styles.priceRow}>
                        <span>{modification.name}</span>
                        <strong>{formatCurrency(modification.price)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>بدون تعديلات</p>
                )}

                {item.itemNote && (
                  <div className={styles.noteBox}>
                    <strong>ملاحظة المنتج</strong>
                    <p>{item.itemNote}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.stack}>
          <h2 className={styles.sectionTitle}>الإجمالي</h2>
          <div className={styles.priceBreakdown}>
            <div className={styles.priceRow}>
              <span>الإجمالي الأصلي</span>
              <strong>{formatCurrency(order.originalTotal)}</strong>
            </div>
            <div className={styles.priceRow}>
              <span>الخصم</span>
              <strong>{getDiscountLabel(order)} / {formatCurrency(order.discount)}</strong>
            </div>
            {order.manualTotalOverride !== null && (
              <div className={styles.priceRow}>
                <span>الإجمالي اليدوي</span>
                <strong>{formatCurrency(order.manualTotalOverride)}</strong>
              </div>
            )}
            <div className={`${styles.priceRow} ${styles.totalRow}`}>
              <span>الإجمالي النهائي</span>
              <strong>{formatCurrency(order.finalTotal || order.total)}</strong>
            </div>
          </div>
        </div>
      </section>

      {(order.orderNote || order.notes) && (
        <section className={styles.panel}>
          <div className={styles.stack}>
            <h2 className={styles.sectionTitle}>ملاحظات الطلب</h2>
            {order.orderNote && <p className={styles.noteText}>{order.orderNote}</p>}
            {order.notes && order.notes !== order.orderNote && (
              <p className={styles.noteText}>{order.notes}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}