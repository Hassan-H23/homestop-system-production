"use client";

import { Button, Dialog, H1, H3, Icon, InputGroup } from "@/app/components/mantine-ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSalesOrder } from "./actions";
import styles from "./sales.module.css";

type SalesMode = "overview" | "lookup" | "new-order";
type OrderStep = "select" | "details" | "customize" | "custom-product" | "overview";
type DiscountType = "percentage" | "fixed" | null;
type SalesOrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type ModificationDraft = {
  id: string;
  name: string;
  price: string;
};

type CleanModification = {
  name: string;
  price: number;
};

type CleanCustomProduct = {
  name: string;
  category: string;
  salePrice: number;
  material?: string;
  dimensions?: string;
  imageUrl?: string;
  details?: string;
};

type DraftItem = {
  id: string;
  kind: "existing" | "fullyCustom";
  product?: SalesProduct;
  customProduct?: CleanCustomProduct;
  displayName: string;
  displayBarcode?: string;
  quantity: number;
  sellingPrice: number;
  modifications: CleanModification[];
  itemNote: string;
};

type SalesOrder = {
  id: string;
  status: SalesOrderStatus;
  customerName: string;
  salesperson: string;
  itemCount: number;
  total: number;
  createdAt: string;
};

export type SalesProduct = {
  product_id: number;
  barcode: string;
  name: string;
  category: string;
  material: string;
  dimensions: string;
  image_url: string | null;
  salePrice: number;
  current_amount: number;
};

type SalesModuleProps = {
  initialMode?: Exclude<SalesMode, "overview">;
  products: SalesProduct[];
  orders: SalesOrder[];
};

const currencyFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const statusLabels: Record<SalesOrderStatus, string> = {
  PENDING: "جديد",
  PROCESSING: "قيد التنفيذ",
  SHIPPED: "جاهز للتسليم",
  DELIVERED: "مكتمل",
  CANCELLED: "ملغي",
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createModification(): ModificationDraft {
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

function matchesSearch(item: SalesProduct, query: string) {
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

function parsePositiveNumber(value: string, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getCleanModifications(modifications: ModificationDraft[]) {
  return modifications
    .filter(
      (modification) =>
        modification.name.trim().length > 0 || modification.price.trim().length > 0,
    )
    .map((modification) => ({
      name: modification.name.trim(),
      price: parsePositiveNumber(modification.price),
    }));
}

function getModificationTotal(modifications: CleanModification[]) {
  return modifications.reduce((sum, modification) => sum + modification.price, 0);
}

function getItemUnitTotal(item: DraftItem) {
  return item.sellingPrice;
}

function getItemTotal(item: DraftItem) {
  return getItemUnitTotal(item) * item.quantity;
}

function getStatusClass(status: SalesOrderStatus) {
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

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function makeModificationDrafts(modifications: CleanModification[]) {
  return modifications.length > 0
    ? modifications.map((modification) => ({
        id: createId(),
        name: modification.name,
        price: String(modification.price),
      }))
    : [createModification()];
}

export function SalesModule({
  initialMode,
  products,
  orders: initialOrders,
}: SalesModuleProps) {
  const router = useRouter();
  const [mode] = useState<SalesMode>(initialMode ?? "overview");
  const [orderStep, setOrderStep] = useState<OrderStep>("select");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<SalesProduct | null>(null);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductCategory, setCustomProductCategory] = useState("");
  const [customProductMaterial, setCustomProductMaterial] = useState("");
  const [customProductDimensions, setCustomProductDimensions] = useState("");
  const [customProductImageUrl, setCustomProductImageUrl] = useState("");
  const [customProductDetails, setCustomProductDetails] = useState("");
  const [lookupDetailOpen, setLookupDetailOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [sellingPrice, setSellingPrice] = useState("");
  const [itemNote, setItemNote] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [modifications, setModifications] = useState<ModificationDraft[]>([
    createModification(),
  ]);
  const [cart, setCart] = useState<DraftItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>(null);
  const [discountValue, setDiscountValue] = useState("");
  const [manualTotalOverride, setManualTotalOverride] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [orders] = useState<SalesOrder[]>(initialOrders);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerMessage, setScannerMessage] = useState(
    "افتح الكاميرا لمسح الباركود أو أدخل الرقم يدويًا.",
  );
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const filteredProducts = useMemo(
    () => products.filter((item) => matchesSearch(item, query)).slice(0, 12),
    [products, query],
  );
  const originalTotal = cart.reduce((sum, item) => sum + getItemTotal(item), 0);
  const numericDiscountValue = parsePositiveNumber(discountValue);
  const discountAmount =
    discountType === "percentage"
      ? originalTotal * Math.min(numericDiscountValue, 100) * 0.01
      : discountType === "fixed"
        ? Math.min(numericDiscountValue, originalTotal)
        : 0;
  const calculatedTotal = Math.max(0, originalTotal - discountAmount);
  const manualTotal =
    manualTotalOverride.trim() === ""
      ? null
      : parsePositiveNumber(manualTotalOverride, calculatedTotal);
  const finalTotal = manualTotal ?? calculatedTotal;
  const currentModifications = getCleanModifications(modifications);
  const currentSellingPrice = parsePositiveNumber(
    sellingPrice,
    selectedProduct?.salePrice ?? 0,
  );
  const currentQuantity = Math.max(1, Math.floor(parsePositiveNumber(quantity, 1)));
  const currentItemTotal = currentSellingPrice * currentQuantity;
  const showHero = mode === "overview";

  useEffect(() => {
    const pendingToast = window.sessionStorage.getItem("sales-order-toast");
    const toastTimeout = pendingToast
      ? window.setTimeout(() => {
          window.sessionStorage.removeItem("sales-order-toast");
          setToast({
            type: "success",
            message: pendingToast,
          });
        }, 0)
      : null;

    return () => {
      if (toastTimeout !== null) {
        window.clearTimeout(toastTimeout);
      }

      void stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 4500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const resetDraftProduct = () => {
    setSelectedProduct(null);
    setQuantity("1");
    setSellingPrice("");
    setItemNote("");
    setEditingItemId(null);
    setModifications([createModification()]);
  };

  const resetCustomProduct = () => {
    setCustomProductName("");
    setCustomProductCategory("");
    setCustomProductMaterial("");
    setCustomProductDimensions("");
    setCustomProductImageUrl("");
    setCustomProductDetails("");
  };

  const startFullyCustomProduct = () => {
    resetDraftProduct();
    resetCustomProduct();
    setOrderStep("custom-product");
  };

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // The scanner can already be stopped while navigating or restarting.
      }
    }

    setScannerActive(false);
  }

  const selectProduct = (product: SalesProduct) => {
    setSelectedProduct(product);
    setQuantity("1");
    setSellingPrice(String(product.salePrice));
    setItemNote("");
    setEditingItemId(null);
    setModifications([createModification()]);
    resetCustomProduct();
    setOrderStep(mode === "new-order" ? "details" : "select");

    if (mode === "lookup") {
      setLookupDetailOpen(true);
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

  const saveDraftItem = (draftItem: DraftItem) => {
    setCart((current) =>
      editingItemId
        ? current.map((item) => (item.id === editingItemId ? draftItem : item))
        : [...current, draftItem],
    );
    resetDraftProduct();
    resetCustomProduct();
    setOrderStep("overview");
  };

  const addCurrentItemToCart = () => {
    if (!selectedProduct) {
      return;
    }

    saveDraftItem({
      id: editingItemId ?? createId(),
      kind: "existing",
      product: selectedProduct,
      displayName: selectedProduct.name,
      displayBarcode: selectedProduct.barcode,
      quantity: currentQuantity,
      sellingPrice: currentSellingPrice,
      modifications: currentModifications,
      itemNote: itemNote.trim(),
    });
  };

  const addFullyCustomItemToCart = () => {
    const name = customProductName.trim();
    const category = customProductCategory.trim();
    const salePrice = parsePositiveNumber(sellingPrice);

    if (!name) {
      setToast({ type: "error", message: "اسم المنتج المخصص مطلوب." });
      return;
    }

    if (!category) {
      setToast({ type: "error", message: "فئة المنتج المخصص مطلوبة." });
      return;
    }

    saveDraftItem({
      id: editingItemId ?? createId(),
      kind: "fullyCustom",
      displayName: name,
      quantity: currentQuantity,
      sellingPrice: currentSellingPrice,
      modifications: currentModifications,
      itemNote: itemNote.trim(),
      customProduct: {
        name,
        category,
        salePrice,
        material: customProductMaterial.trim() || undefined,
        dimensions: customProductDimensions.trim() || undefined,
        imageUrl: customProductImageUrl.trim() || undefined,
        details: customProductDetails.trim() || undefined,
      },
    });
  };

  const editItem = (item: DraftItem) => {
    setQuantity(String(item.quantity));
    setSellingPrice(String(item.sellingPrice));
    setItemNote(item.itemNote);
    setModifications(makeModificationDrafts(item.modifications));
    setEditingItemId(item.id);

    if (item.kind === "fullyCustom" && item.customProduct) {
      setSelectedProduct(null);
      setCustomProductName(item.customProduct.name);
      setCustomProductCategory(item.customProduct.category);
      setCustomProductMaterial(item.customProduct.material ?? "");
      setCustomProductDimensions(item.customProduct.dimensions ?? "");
      setCustomProductImageUrl(item.customProduct.imageUrl ?? "");
      setCustomProductDetails(item.customProduct.details ?? "");
      setOrderStep("custom-product");
      return;
    }

    if (item.product) {
      resetCustomProduct();
      setSelectedProduct(item.product);
      setOrderStep("customize");
    }
  };

  const finalizeOrder = async () => {
    if (cart.length === 0) {
      setToast({
        type: "error",
        message: "أضف منتجًا واحدًا على الأقل قبل إرسال الطلب.",
      });
      return;
    }

    if (!customerName.trim()) {
      setToast({
        type: "error",
        message: "اسم العميل مطلوب قبل إرسال الطلب.",
      });
      return;
    }

    setIsFinalizing(true);

    try {
      const result = await createSalesOrder({
        customerName,
        customerPhone,
        customerEmail,
        shippingAddress,
        orderNote,
        discountType,
        discountValue: numericDiscountValue,
        manualTotalOverride: manualTotal,
        items: cart.map((item) => {
          if (item.kind === "fullyCustom" && item.customProduct) {
            return {
              kind: "fullyCustom" as const,
              quantity: item.quantity,
              sellingPrice: item.sellingPrice,
              modifications: item.modifications,
              itemNote: item.itemNote,
              customProduct: item.customProduct,
            };
          }

          if (!item.product) {
            throw new Error("Selected product is missing from the order item.");
          }

          return {
            kind: "existing" as const,
            productId: item.product.product_id,
            quantity: item.quantity,
            sellingPrice: item.sellingPrice,
            modifications: item.modifications,
            itemNote: item.itemNote,
          };
        }),
      });

      setCart([]);
      resetDraftProduct();
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setShippingAddress("");
      setOrderNote("");
      setDiscountType(null);
      setDiscountValue("");
      setManualTotalOverride("");
      window.sessionStorage.setItem(
        "sales-order-toast",
        `${result.message}: ${result.orderNumber}`,
      );
      router.push("/sales");
      router.refresh();
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "تعذر إنشاء الطلب. راجع البيانات وحاول مرة أخرى.",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const startImprovedScanner = async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setScannerMessage("Camera scanning needs HTTPS on mobile.");
      setToast({
        type: "error",
        message: "Camera scanning needs HTTPS on mobile.",
      });
      return;
    }

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );

      setScannerMessage("Starting camera scanner...");
      setScannerActive(true);

      const scanner = new Html5Qrcode("sales-barcode-reader", {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
        ],
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.floor(Math.min(viewfinderWidth * 0.92, 460)),
            height: Math.floor(Math.min(viewfinderHeight * 0.32, 180)),
          }),
        },
        (decodedText) => {
          const barcode = decodedText.trim();
          const product = products.find((item) => item.barcode === barcode);

          setQuery(barcode);

          if (!product) {
            setScannerMessage(`Barcode was scanned, but no product matched: ${barcode}`);
            setToast({
              type: "error",
              message: `No product found for barcode: ${barcode}`,
            });
            return;
          }

          selectProduct(product);
          void stopScanner();
          setScannerMessage("Product found from barcode.");
          setToast({
            type: "success",
            message: `Found product: ${product.name}`,
          });
        },
        () => {},
      );

      setScannerMessage("Point the camera at the barcode inside the scan box.");
    } catch {
      void stopScanner();
      setScannerMessage("Could not start the camera scanner.");
      setToast({
        type: "error",
        message: "Could not start the camera scanner. Check camera permission.",
      });
    }
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
            onClick={scannerActive ? () => void stopScanner() : startImprovedScanner}
          >
            {scannerActive ? "إيقاف المسح" : "مسح بالكاميرا"}
          </Button>
          {mode === "new-order" && (
            <Button icon="plus" intent="success" onClick={startFullyCustomProduct}>
              منتج مخصص
            </Button>
          )}
        </div>

        <div className={styles.scannerBox}>
          <div id="sales-barcode-reader" className={styles.video} />

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
                src={item.image_url ?? "/images/home_stop_logo.png"}
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
              src={selectedProduct.image_url ?? "/images/home_stop_logo.png"}
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
            <div className={styles.row}>
              <Button icon="chevron-right" onClick={() => setOrderStep("select")}>
                رجوع
              </Button>
              <Button
                intent="primary"
                icon="arrow-left"
                onClick={() => setOrderStep("customize")}
              >
                تخصيص المنتج
              </Button>
            </div>
          )}
        </div>
      </aside>
    );
  };

  const renderCustomization = () => {
    if (!selectedProduct) {
      return null;
    }

    return (
      <section className={styles.panel}>
        <div className={styles.stack}>
          <div>
            <h2 className={styles.sectionTitle}>
              {editingItemId ? "تعديل المنتج في الطلب" : "تخصيص المنتج"}
            </h2>
            <p className={styles.muted}>
              السعر هنا لهذا الطلب فقط. إذا أضفت تعديلات سيتم إنشاء منتج مخصص جديد عند الإرسال.
            </p>
          </div>

          <div className={styles.formGrid}>
            <InputGroup
              leftIcon="dollar"
              min={0}
              placeholder="سعر البيع"
              type="number"
              value={sellingPrice}
              onValueChange={setSellingPrice}
            />
            <InputGroup
              leftIcon="numerical"
              min={1}
              placeholder="الكمية"
              type="number"
              value={quantity}
              onValueChange={setQuantity}
            />
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
                  placeholder="السعر الإضافي"
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

          <Button
            icon="plus"
            onClick={() =>
              setModifications((current) => [...current, createModification()])
            }
          >
            إضافة تعديل
          </Button>

          <InputGroup
            placeholder="ملاحظة على المنتج داخل الطلب"
            value={itemNote}
            onValueChange={setItemNote}
            fill
          />

          <div className={styles.priceBreakdown}>
            <div className={styles.priceRow}>
              <span>سعر البيع</span>
              <strong>{formatCurrency(currentSellingPrice)}</strong>
            </div>
            <div className={styles.priceRow}>
              <span>إجمالي التعديلات المسجلة</span>
              <strong>{formatCurrency(getModificationTotal(currentModifications))}</strong>
            </div>
            <div className={styles.priceRow}>
              <span>الكمية</span>
              <strong>{currentQuantity}</strong>
            </div>
            <div className={`${styles.priceRow} ${styles.totalRow}`}>
              <span>إجمالي المنتج</span>
              <strong>{formatCurrency(currentItemTotal)}</strong>
            </div>
          </div>

          <div className={styles.row}>
            <Button icon="chevron-right" onClick={() => setOrderStep("details")}>
              رجوع
            </Button>
            <Button intent="primary" icon="shopping-cart" onClick={addCurrentItemToCart}>
              {editingItemId ? "حفظ التعديل" : "إضافة إلى الطلب"}
            </Button>
          </div>
        </div>
      </section>
    );
  };

  const renderCustomProduct = () => (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <div>
          <h2 className={styles.sectionTitle}>
            {editingItemId ? "تعديل المنتج المخصص" : "إنشاء منتج مخصص"}
          </h2>
          <p className={styles.muted}>
            المنتج المخصص سيحصل على باركود رقمي تلقائي وسيتم إضافته كمنتج جديد داخل الطلب.
          </p>
        </div>

        <div className={styles.formGrid}>
          <InputGroup
            placeholder="اسم المنتج المخصص *"
            value={customProductName}
            onValueChange={setCustomProductName}
          />
          <InputGroup
            placeholder="الفئة *"
            value={customProductCategory}
            onValueChange={setCustomProductCategory}
          />
          <InputGroup
            leftIcon="dollar"
            min={0}
            placeholder="سعر البيع *"
            type="number"
            value={sellingPrice}
            onValueChange={setSellingPrice}
          />
          <InputGroup
            leftIcon="numerical"
            min={1}
            placeholder="الكمية"
            type="number"
            value={quantity}
            onValueChange={setQuantity}
          />
          <InputGroup
            placeholder="الخامة"
            value={customProductMaterial}
            onValueChange={setCustomProductMaterial}
          />
          <InputGroup
            placeholder="الأبعاد"
            value={customProductDimensions}
            onValueChange={setCustomProductDimensions}
          />
          <InputGroup
            placeholder="رابط الصورة"
            value={customProductImageUrl}
            onValueChange={setCustomProductImageUrl}
          />
          <InputGroup
            placeholder="تفاصيل إضافية"
            value={customProductDetails}
            onValueChange={setCustomProductDetails}
          />
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
                placeholder="السعر الإضافي"
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

        <Button
          icon="plus"
          onClick={() =>
            setModifications((current) => [...current, createModification()])
          }
        >
          إضافة تعديل
        </Button>

        <InputGroup
          placeholder="ملاحظة على المنتج داخل الطلب"
          value={itemNote}
          onValueChange={setItemNote}
          fill
        />

        <div className={styles.priceBreakdown}>
          <div className={styles.priceRow}>
            <span>سعر البيع</span>
            <strong>{formatCurrency(currentSellingPrice)}</strong>
          </div>
          <div className={styles.priceRow}>
            <span>الكمية</span>
            <strong>{currentQuantity}</strong>
          </div>
          <div className={`${styles.priceRow} ${styles.totalRow}`}>
            <span>إجمالي المنتج</span>
            <strong>{formatCurrency(currentItemTotal)}</strong>
          </div>
        </div>

        <div className={styles.row}>
          <Button icon="chevron-right" onClick={() => setOrderStep("select")}>
            رجوع
          </Button>
          <Button intent="primary" icon="shopping-cart" onClick={addFullyCustomItemToCart}>
            {editingItemId ? "حفظ التعديل" : "إضافة إلى الطلب"}
          </Button>
        </div>
      </div>
    </section>
  );
  const renderOrderOverview = () => (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <h2 className={styles.sectionTitle}>مراجعة الطلب</h2>

        <div className={styles.formGrid}>
          <InputGroup
            placeholder="اسم العميل *"
            value={customerName}
            onValueChange={setCustomerName}
          />
          <InputGroup
            placeholder="هاتف العميل"
            value={customerPhone}
            onValueChange={setCustomerPhone}
          />
          <InputGroup
            placeholder="البريد الإلكتروني"
            value={customerEmail}
            onValueChange={setCustomerEmail}
          />
          <InputGroup
            placeholder="عنوان التسليم"
            value={shippingAddress}
            onValueChange={setShippingAddress}
          />
        </div>

        <InputGroup
          placeholder="ملاحظة على الطلب"
          value={orderNote}
          onValueChange={setOrderNote}
          fill
        />

        <div className={styles.cartList}>
          {cart.map((item) => (
            <article key={item.id} className={styles.cartItem}>
              <div className={styles.cartItemHeader}>
                <div className={styles.stack}>
                  <h3 className={styles.productName}>{item.displayName}</h3>
                  {item.displayBarcode ? (
                    <span className={styles.barcode}>{item.displayBarcode}</span>
                  ) : (
                    <span className={styles.barcode}>منتج مخصص</span>
                  )}
                  <div className={styles.meta}>
                    <span>الكمية: {item.quantity}</span>
                    <span>سعر البيع: {formatCurrency(item.sellingPrice)}</span>
                    {item.modifications.length > 0 ? (
                      item.modifications.map((modification) => (
                        <span key={`${item.id}-${modification.name}`}>
                          {modification.name}: {formatCurrency(modification.price)}
                        </span>
                      ))
                    ) : (
                      <span>بدون تعديلات</span>
                    )}
                    {item.itemNote && <span>ملاحظة: {item.itemNote}</span>}
                  </div>
                </div>
                <strong>{formatCurrency(getItemTotal(item))}</strong>
              </div>
              <div className={styles.row}>
                <Button icon="edit" onClick={() => editItem(item)}>
                  تعديل
                </Button>
                <Button
                  icon="trash"
                  intent="danger"
                  onClick={() =>
                    setCart((current) => current.filter((cartItem) => cartItem.id !== item.id))
                  }
                >
                  حذف
                </Button>
              </div>
            </article>
          ))}
        </div>

        {cart.length === 0 && (
          <div className={styles.emptyState}>لم يتم إضافة منتجات إلى الطلب بعد.</div>
        )}

        <div className={styles.formGrid}>
          <div className={styles.segmented}>
            <Button
              intent={discountType === null ? "primary" : undefined}
              onClick={() => {
                setDiscountType(null);
                setDiscountValue("");
              }}
            >
              بدون خصم
            </Button>
            <Button
              intent={discountType === "percentage" ? "primary" : undefined}
              onClick={() => setDiscountType("percentage")}
            >
              خصم %
            </Button>
            <Button
              intent={discountType === "fixed" ? "primary" : undefined}
              onClick={() => setDiscountType("fixed")}
            >
              خصم ثابت
            </Button>
          </div>
          <InputGroup
            leftIcon="numerical"
            min={0}
            placeholder={discountType === "percentage" ? "نسبة الخصم" : "قيمة الخصم"}
            type="number"
            disabled={discountType === null}
            value={discountValue}
            onValueChange={setDiscountValue}
          />
          <InputGroup
            leftIcon="dollar"
            min={0}
            placeholder="تعديل الإجمالي النهائي يدويًا"
            type="number"
            value={manualTotalOverride}
            onValueChange={setManualTotalOverride}
          />
        </div>

        <div className={styles.priceBreakdown}>
          <div className={styles.priceRow}>
            <span>الإجمالي الأصلي</span>
            <strong>{formatCurrency(originalTotal)}</strong>
          </div>
          <div className={styles.priceRow}>
            <span>الخصم</span>
            <strong>{formatCurrency(discountAmount)}</strong>
          </div>
          {manualTotal !== null && (
            <div className={styles.priceRow}>
              <span>الإجمالي اليدوي</span>
              <strong>{formatCurrency(manualTotal)}</strong>
            </div>
          )}
          <div className={`${styles.priceRow} ${styles.totalRow}`}>
            <span>الإجمالي النهائي</span>
            <strong>{formatCurrency(finalTotal)}</strong>
          </div>
        </div>

        <div className={styles.cartActions}>
          <Button
            icon="plus"
            onClick={() => {
              resetDraftProduct();
              setOrderStep("select");
            }}
          >
            إضافة منتج آخر
          </Button>
          <Button
            intent="success"
            icon="tick"
            disabled={cart.length === 0 || isFinalizing}
            onClick={finalizeOrder}
          >
            {isFinalizing ? "جاري الحفظ..." : "إرسال الطلب"}
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
            <Link
              key={order.id}
              className={styles.orderLink}
              href={`/sales/orders/${encodeURIComponent(order.id)}`}
            >
              <article className={styles.orderCard}>
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
                  <span>العميل: {order.customerName}</span>
                  <span>المندوب: {order.salesperson}</span>
                  <span>{order.itemCount} منتج</span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}>
          {toast.message}
        </div>
      )}

      {showHero && (
        <section className={styles.hero}>
          <div className={styles.titleBlock}>
            <H1 className={styles.title}>المبيعات</H1>
            <p className={styles.subtitle}>
              ابحث عن المنتجات، امسح الباركود من الهاتف، وأنشئ طلبات مبيعات بتعديلات وأسعار واضحة.
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
                افتح قائمة المنتجات وابحث بالاسم أو الباركود أو امسح الكود من الهاتف.
              </p>
            </Link>
            <Link className={styles.actionCard} href="/sales/new-order">
              <span className={styles.actionIcon}>
                <Icon icon="plus" size={22} />
              </span>
              <h2 className={styles.actionTitle}>إنشاء طلب جديد</h2>
              <p className={styles.muted}>
                اختر منتجًا، عدل السعر أو المواصفات، ثم راجع الإجمالي قبل الإرسال.
              </p>
            </Link>
          </section>
          {renderOrders()}
        </>
      )}

      {(mode === "lookup" || mode === "new-order") && (
        <div className={styles.productGrid}>
          {mode === "new-order" && orderStep !== "overview" && cart.length > 0 && (
            <div className={styles.inlineSummary}>
              <strong>{cart.length} منتج في الطلب</strong>
              <Button icon="shopping-cart" onClick={() => setOrderStep("overview")}>
                مراجعة الطلب
              </Button>
            </div>
          )}
          {orderStep === "select" && renderProductSearch()}
          {orderStep === "details" && renderSelectedProduct()}
          {orderStep === "customize" && renderCustomization()}
          {mode === "new-order" && orderStep === "custom-product" && renderCustomProduct()}
          {mode === "new-order" && orderStep === "overview" && renderOrderOverview()}
        </div>
      )}

      {mode === "lookup" && selectedProduct && (
        <Dialog
          isOpen={lookupDetailOpen}
          onClose={() => {
            setLookupDetailOpen(false);
            setSelectedProduct(null);
          }}
          title={selectedProduct.name}
          icon="eye-open"
        >
          <div className={styles.lookupModal}>{renderSelectedProduct()}</div>
        </Dialog>
      )}
    </div>
  );
}
