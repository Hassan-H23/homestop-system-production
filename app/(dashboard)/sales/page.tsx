"use client";

import {
  BrowserCodeReader,
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { Button, H1, H3, Icon, InputGroup } from "@/app/components/mantine-ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  inventoryItems,
  type InventoryItem,
} from "../product_inventory/inventoryData";
import styles from "./sales.module.css";

type SalesMode = "overview" | "lookup" | "new-order";
type OrderStep = "select" | "details" | "modifications" | "review" | "cart";
type SalesOrderStatus =
  | "new"
  | "review"
  | "progress"
  | "ready"
  | "done"
  | "canceled";

type Modification = {
  id: string;
  name: string;
  price: string;
};

type CartItem = {
  id: string;
  product: InventoryItem;
  modifications: { name: string; price: number }[];
  finalBarcode: string;
  total: number;
};

type SalesOrder = {
  id: string;
  status: SalesOrderStatus;
  itemCount: number;
  total: number;
  createdAt: string;
};

type SalesModuleProps = {
  initialMode?: Exclude<SalesMode, "overview">;
};

const currencyFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const statusLabels: Record<SalesOrderStatus, string> = {
  new: "جديد",
  review: "قيد المراجعة",
  progress: "قيد التنفيذ",
  ready: "جاهز للتسليم",
  done: "مكتمل",
  canceled: "ملغي",
};

const initialOrders: SalesOrder[] = [
  {
    id: "SO-1027",
    status: "new",
    itemCount: 2,
    total: 8350,
    createdAt: "2026-07-07T10:25:00",
  },
  {
    id: "SO-1026",
    status: "progress",
    itemCount: 4,
    total: 16400,
    createdAt: "2026-07-06T16:10:00",
  },
  {
    id: "SO-1025",
    status: "ready",
    itemCount: 1,
    total: 4200,
    createdAt: "2026-07-06T12:45:00",
  },
  {
    id: "SO-1024",
    status: "done",
    itemCount: 3,
    total: 12950,
    createdAt: "2026-07-05T18:30:00",
  },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createModification(): Modification {
  return {
    id: createId(),
    name: "",
    price: "",
  };
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function matchesSearch(item: InventoryItem, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return normalizeSearchText(
    [
      item.barcode,
      item.name,
      item.category,
      item.material,
      item.dimensions,
      String(item.salePrice),
    ].join(" "),
  ).includes(normalizedQuery);
}

function getModificationTotal(modifications: Modification[]) {
  return modifications.reduce((sum, modification) => {
    const price = Number(modification.price);
    return sum + (Number.isFinite(price) && price > 0 ? price : 0);
  }, 0);
}

function getCleanModifications(modifications: Modification[]) {
  return modifications
    .map((modification) => ({
      name: modification.name.trim(),
      price: Number(modification.price),
    }))
    .filter(
      (modification) =>
        modification.name.length > 0 &&
        Number.isFinite(modification.price) &&
        modification.price > 0,
    );
}

function generateModifiedBarcode(
  product: InventoryItem,
  modifications: Modification[],
) {
  const cleanModifications = getCleanModifications(modifications);

  if (cleanModifications.length === 0) {
    return product.barcode;
  }

  const signature = cleanModifications
    .map((modification) => `${modification.name}:${modification.price}`)
    .join("|");
  const hash = Array.from(signature).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return `${product.barcode}-${String(hash).padStart(5, "0")}`;
}

function getStatusClass(status: SalesOrderStatus) {
  if (status === "review") {
    return styles.statusReview;
  }

  if (status === "progress") {
    return styles.statusProgress;
  }

  if (status === "ready") {
    return styles.statusReady;
  }

  if (status === "done") {
    return styles.statusDone;
  }

  if (status === "canceled") {
    return styles.statusCanceled;
  }

  return "";
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SalesModule({ initialMode }: SalesModuleProps) {
  const router = useRouter();
  const [mode, setMode] = useState<SalesMode>(initialMode ?? "overview");
  const [orderStep, setOrderStep] = useState<OrderStep>("select");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(
    null,
  );
  const [modifications, setModifications] = useState<Modification[]>([
    createModification(),
  ]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>(initialOrders);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerMessage, setScannerMessage] = useState(
    "افتح الكاميرا لمسح الباركود أو أدخل الرقم يدويًا.",
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);

  const filteredProducts = useMemo(
    () => inventoryItems.filter((item) => matchesSearch(item, query)).slice(0, 12),
    [query],
  );
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const modificationsTotal = getModificationTotal(modifications);
  const finalBarcode = selectedProduct
    ? generateModifiedBarcode(selectedProduct, modifications)
    : "";
  const itemTotal = selectedProduct
    ? selectedProduct.salePrice + modificationsTotal
    : 0;
  const showHero = mode !== "lookup";

  useEffect(() => {
    return () => {
      scannerControlsRef.current?.stop();
    };
  }, []);

  const stopScanner = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setScannerActive(false);
  };

  const selectProduct = (product: InventoryItem) => {
    setSelectedProduct(product);
    setModifications([createModification()]);
    setOrderStep(mode === "new-order" ? "details" : "select");
  };

  const startScanner = async () => {
    if (!videoRef.current) {
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setScannerMessage(
        "الكاميرا لا تعمل من الهاتف عبر HTTP. افتح الصفحة عبر HTTPS أو استخدم إدخال الباركود يدويًا أثناء الاختبار.",
      );
      return;
    }

    try {
      setScannerMessage("جاري تشغيل الكاميرا...");
      setScannerActive(true);
      const devices = await BrowserCodeReader.listVideoInputDevices();
      const preferredDevice =
        devices.find((device) => /back|rear|environment/i.test(device.label)) ??
        devices[0];
      const reader = new BrowserMultiFormatReader();
      scannerControlsRef.current = await reader.decodeFromVideoDevice(
        preferredDevice?.deviceId,
        videoRef.current,
        (result) => {
          const barcode = result?.getText();

          if (!barcode) {
            return;
          }

          setQuery(barcode);
          const product = inventoryItems.find((item) => item.barcode === barcode);

          if (product) {
            selectProduct(product);
            stopScanner();
            setScannerMessage("تم العثور على المنتج من الباركود.");
          } else {
            setScannerMessage("تم قراءة الباركود، لكن لا يوجد منتج مطابق.");
          }
        },
      );
      setScannerMessage("وجه الكاميرا نحو الباركود.");
    } catch {
      stopScanner();
      setScannerMessage(
        "تعذر تشغيل الكاميرا على هذا الجهاز. استخدم البحث أو إدخال الباركود يدويًا.",
      );
    }
  };

  const updateModification = (
    id: string,
    field: "name" | "price",
    value: string,
  ) => {
    setModifications((current) =>
      current.map((modification) =>
        modification.id === id
          ? { ...modification, [field]: value }
          : modification,
      ),
    );
  };

  const addReviewedItemToCart = () => {
    if (!selectedProduct) {
      return;
    }

    setCart((current) => [
      ...current,
      {
        id: createId(),
        product: selectedProduct,
        modifications: getCleanModifications(modifications),
        finalBarcode,
        total: itemTotal,
      },
    ]);
    setOrderStep("cart");
  };

  const finalizeOrder = () => {
    if (cart.length === 0) {
      return;
    }

    setOrders((current) => [
      {
        id: `SO-${1028 + current.length}`,
        status: "new",
        itemCount: cart.length,
        total: cartTotal,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setCart([]);
    setSelectedProduct(null);
    setModifications([createModification()]);
    setMode("overview");
    setOrderStep("select");
    router.push("/sales");
  };

  const renderProductSearch = () => (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <InputGroup
            className={styles.searchField}
            leftIcon="search"
            placeholder="ابحث بالاسم أو الفئة أو الخامة أو الباركود"
            value={query}
            onValueChange={setQuery}
            fill
          />
          <Button
            icon={scannerActive ? "stop" : "camera"}
            intent={scannerActive ? "danger" : "primary"}
            onClick={scannerActive ? stopScanner : startScanner}
          >
            {scannerActive ? "إيقاف المسح" : "مسح بالكاميرا"}
          </Button>
        </div>

        <div className={styles.scannerBox}>
          <video
            ref={videoRef}
            className={styles.video}
            muted
            playsInline
            aria-label="كاميرا مسح الباركود"
          />
          <div className={styles.scannerActions}>
            <span className={styles.muted}>{scannerMessage}</span>
            {query && (
              <Button minimal icon="cross" onClick={() => setQuery("")}>
                مسح البحث
              </Button>
            )}
          </div>
        </div>

        <div className={styles.productList}>
          {filteredProducts.map((item) => (
            <article key={item.barcode} className={styles.productCard}>
              <Image
                src={item.image_url}
                alt={item.name}
                width={72}
                height={72}
                unoptimized
                className={styles.productImage}
              />
              <div className={styles.stack}>
                <h3 className={styles.productName}>{item.name}</h3>
                <div className={styles.meta}>
                  <span>{item.category}</span>
                  <span>{item.material}</span>
                  <span className={styles.barcode}>{item.barcode}</span>
                </div>
                <strong>{formatCurrency(item.salePrice)}</strong>
              </div>
              <Button
                intent="primary"
                icon="arrow-left"
                onClick={() => selectProduct(item)}
              >
                {mode === "new-order" ? "اختيار للطلب" : "عرض التفاصيل"}
              </Button>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className={styles.emptyState}>لا توجد منتجات مطابقة للبحث.</div>
        )}
      </div>
    </section>
  );

  const renderSelectedProduct = () => {
    if (!selectedProduct) {
      return null;
    }

    return (
      <aside className={`${styles.panel} ${styles.detailCard}`}>
        <div className={styles.stack}>
          <div className={styles.detailHeader}>
            <Image
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              width={112}
              height={112}
              unoptimized
              className={styles.detailImage}
            />
            <div className={styles.stack}>
              <H3 className={styles.productName}>{selectedProduct.name}</H3>
              <strong>{formatCurrency(selectedProduct.salePrice)}</strong>
              <span className={styles.barcode}>{selectedProduct.barcode}</span>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span>الفئة</span>
              <strong>{selectedProduct.category}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>الخامة</span>
              <strong>{selectedProduct.material}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>الأبعاد</span>
              <strong>{selectedProduct.dimensions}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>الكمية المتاحة</span>
              <strong>{selectedProduct.current_amount}</strong>
            </div>
          </div>

          {mode === "new-order" && orderStep === "details" && (
            <Button
              intent="primary"
              icon="arrow-left"
              onClick={() => setOrderStep("modifications")}
            >
              متابعة وإضافة تعديلات
            </Button>
          )}
        </div>
      </aside>
    );
  };

  const renderModifications = () => (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <div>
          <h2 className={styles.sectionTitle}>تعديلات المنتج</h2>
          <p className={styles.muted}>
            أضف أي تعديل مطلوب للمنتج. عند إضافة تعديل سيتم إنشاء باركود جديد لهذا
            المنتج داخل الطلب.
          </p>
        </div>

        <div className={styles.modsTable}>
          {modifications.map((modification) => (
            <div key={modification.id} className={styles.modRow}>
              <InputGroup
                placeholder="اسم التعديل"
                value={modification.name}
                onValueChange={(value) =>
                  updateModification(modification.id, "name", value)
                }
              />
              <InputGroup
                leftIcon="numerical"
                min={0}
                placeholder="السعر"
                type="number"
                value={modification.price}
                onValueChange={(value) =>
                  updateModification(modification.id, "price", value)
                }
              />
              <Button
                aria-label="حذف التعديل"
                icon="trash"
                minimal
                intent="danger"
                disabled={modifications.length === 1}
                onClick={() =>
                  setModifications((current) =>
                    current.filter((item) => item.id !== modification.id),
                  )
                }
              />
            </div>
          ))}
        </div>

        <div className={styles.row}>
          <Button
            icon="plus"
            onClick={() =>
              setModifications((current) => [...current, createModification()])
            }
          >
            إضافة تعديل
          </Button>
          <Button
            intent="primary"
            icon="arrow-left"
            onClick={() => setOrderStep("review")}
          >
            مراجعة السعر
          </Button>
        </div>
      </div>
    </section>
  );

  const renderReview = () => (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <h2 className={styles.sectionTitle}>مراجعة المنتج قبل إضافته</h2>
        <div className={styles.priceBreakdown}>
          <div className={styles.priceRow}>
            <span>سعر المنتج الأساسي</span>
            <strong>{formatCurrency(selectedProduct?.salePrice ?? 0)}</strong>
          </div>
          <div className={styles.priceRow}>
            <span>إجمالي التعديلات</span>
            <strong>{formatCurrency(modificationsTotal)}</strong>
          </div>
          <div className={styles.priceRow}>
            <span>الباركود النهائي</span>
            <strong className={styles.barcode}>{finalBarcode}</strong>
          </div>
          <div className={`${styles.priceRow} ${styles.totalRow}`}>
            <span>الإجمالي</span>
            <strong>{formatCurrency(itemTotal)}</strong>
          </div>
        </div>
        <div className={styles.row}>
          <Button icon="edit" onClick={() => setOrderStep("modifications")}>
            تعديل البيانات
          </Button>
          <Button
            intent="primary"
            icon="shopping-cart"
            onClick={addReviewedItemToCart}
          >
            إضافة إلى السلة
          </Button>
        </div>
      </div>
    </section>
  );

  const renderCart = () => (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <h2 className={styles.sectionTitle}>سلة الطلب</h2>
        <div className={styles.cartList}>
          {cart.map((item) => (
            <article key={item.id} className={styles.cartItem}>
              <div className={styles.cartItemHeader}>
                <div>
                  <h3 className={styles.productName}>{item.product.name}</h3>
                  <span className={styles.barcode}>{item.finalBarcode}</span>
                </div>
                <strong>{formatCurrency(item.total)}</strong>
              </div>
              <div className={styles.meta}>
                {item.modifications.length > 0
                  ? item.modifications.map((modification) => (
                      <span key={`${item.id}-${modification.name}`}>
                        {modification.name}: {formatCurrency(modification.price)}
                      </span>
                    ))
                  : "بدون تعديلات"}
              </div>
            </article>
          ))}
        </div>
        <div className={`${styles.priceRow} ${styles.totalRow}`}>
          <span>إجمالي الطلب</span>
          <strong>{formatCurrency(cartTotal)}</strong>
        </div>
        <div className={styles.cartActions}>
          <Button
            icon="plus"
            onClick={() => {
              setSelectedProduct(null);
              setModifications([createModification()]);
              setOrderStep("select");
            }}
          >
            إضافة منتج آخر
          </Button>
          <Button
            intent="success"
            icon="tick"
            disabled={cart.length === 0}
            onClick={finalizeOrder}
          >
            إنهاء الطلب
          </Button>
        </div>
      </div>
    </section>
  );

  const renderOrders = () => (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <h2 className={styles.sectionTitle}>طلبات المبيعات</h2>
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <article key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <h3 className={styles.orderNumber}>{order.id}</h3>
                  <p className={styles.muted}>{formatOrderDate(order.createdAt)}</p>
                </div>
                <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
              <div className={styles.meta}>
                <span>{order.itemCount} منتج</span>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className={styles.page}>
      {showHero && (
        <section className={styles.hero}>
          <div className={styles.titleBlock}>
            <H1 className={styles.title}>المبيعات</H1>
            <p className={styles.subtitle}>
              ابحث عن المنتجات، امسح الباركود من الهاتف، وأنشئ طلبات مبيعات
              بتعديلات وأسعار واضحة.
            </p>
          </div>
        </section>
      )}

      {mode === "overview" && (
        <>
          <section className={styles.modeGrid}>
            <Link className={styles.actionCard} href="/sales/lookup">
              <span className={styles.actionIcon}>
                <Icon icon="search" size={22} />
              </span>
              <h2 className={styles.actionTitle}>البحث عن منتج</h2>
              <p className={styles.muted}>
                افتح قائمة المنتجات وابحث بالاسم أو الباركود أو امسح الكود من
                الهاتف.
              </p>
            </Link>
            <Link className={styles.actionCard} href="/sales/new-order">
              <span className={styles.actionIcon}>
                <Icon icon="plus" size={22} />
              </span>
              <h2 className={styles.actionTitle}>إنشاء طلب جديد</h2>
              <p className={styles.muted}>
                اختر منتجًا، أضف التعديلات، راجع السعر النهائي، ثم أضفه إلى السلة.
              </p>
            </Link>
          </section>
          {renderOrders()}
        </>
      )}

      {(mode === "lookup" || mode === "new-order") && (
        <div className={styles.productGrid}>
          {orderStep === "select" && renderProductSearch()}
          {orderStep !== "select" && renderSelectedProduct()}
          {mode === "lookup" && selectedProduct && renderSelectedProduct()}
          {mode === "new-order" &&
            orderStep === "modifications" &&
            renderModifications()}
          {mode === "new-order" && orderStep === "review" && renderReview()}
          {mode === "new-order" && orderStep === "cart" && renderCart()}
        </div>
      )}
    </div>
  );
}

export default function SalesPage() {
  return <SalesModule />;
}
