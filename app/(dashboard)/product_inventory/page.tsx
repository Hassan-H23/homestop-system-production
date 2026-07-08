"use client";

import Image from "next/image";
import styles from "./product_inventory.module.css";
import {
  inventoryItems as data,
  type InventoryItem as ProductItem,
} from "./inventoryData";
import {
  Button,
  Card,
  Elevation,
  H3,
  Icon,
  InputGroup,
  Menu,
  MenuItem,
  Overlay2,
  PopoverNext,
} from "@/app/components/mantine-ui";
import { useMemo, useState } from "react";

const itemsPerPage = 20;

const stockStatusLabels = {
  inStock: "متوفر في المخزون",
  lowStock: "مخزون منخفض",
  outOfStock: "نفد من المخزون",
};

const productLocations = [
  { id: "cairo-showroom", label: "معرض القاهرة" },
  { id: "giza-showroom", label: "معرض الجيزة" },
  { id: "main-warehouse", label: "المخزن الرئيسي" },
  { id: "alexandria-branch", label: "فرع الإسكندرية" },
] as const;

function getProductLocation(item: ProductItem) {
  const locationIndex =
    Number(item.barcode.slice(-4)) % productLocations.length;

  return productLocations[locationIndex];
}

function getStockStatus(item: ProductItem) {
  if (item.current_amount === 0) {
    return {
      key: "outOfStock",
      label: stockStatusLabels.outOfStock,
      icon: "cross" as const,
      intent: "danger" as const,
    };
  }

  if (item.current_amount < item.min_amount) {
    return {
      key: "lowStock",
      label: stockStatusLabels.lowStock,
      icon: "warning-sign" as const,
      intent: "warning" as const,
    };
  }

  return {
    key: "inStock",
    label: stockStatusLabels.inStock,
    icon: "tick" as const,
    intent: "success" as const,
  };
}

function getStatusClass(statusKey: string) {
  if (statusKey === "outOfStock") {
    return styles.statusDanger;
  }

  if (statusKey === "lowStock") {
    return styles.statusWarning;
  }

  return styles.statusSuccess;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function fuzzyIncludes(text: string, query: string) {
  const normalizedText = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }

  let queryIndex = 0;

  for (const character of normalizedText) {
    if (character === normalizedQuery[queryIndex]) {
      queryIndex += 1;
    }

    if (queryIndex === normalizedQuery.length) {
      return true;
    }
  }

  return false;
}

export default function ProductInventoryPage() {
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [prototypeModal, setPrototypeModal] = useState<{
    title: string;
    description: string;
    variant?: "import";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    productLocations[0].id,
  );
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const minQuantityValue = minQuantity === "" ? null : Number(minQuantity);
    const maxQuantityValue = maxQuantity === "" ? null : Number(maxQuantity);

    return data.filter((item) => {
      const status = getStockStatus(item);
      const matchesLocation =
        getProductLocation(item).id === selectedLocationId;
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.category);
      const matchesStatus = !selectedStatus || status.key === selectedStatus;
      const matchesMaterial =
        selectedMaterials.length === 0 ||
        selectedMaterials.includes(item.material);
      const matchesMinQuantity =
        minQuantityValue === null ||
        Number.isNaN(minQuantityValue) ||
        item.current_amount >= minQuantityValue;
      const matchesMaxQuantity =
        maxQuantityValue === null ||
        Number.isNaN(maxQuantityValue) ||
        item.current_amount <= maxQuantityValue;

      if (
        !matchesLocation ||
        !matchesCategory ||
        !matchesStatus ||
        !matchesMaterial ||
        !matchesMinQuantity ||
        !matchesMaxQuantity
      ) {
        return false;
      }

      if (!trimmedQuery) {
        return true;
      }

      const searchableText = [
        item.barcode,
        item.name,
        item.category,
        item.material,
        item.dimensions,
        getProductLocation(item).label,
        String(item.current_amount),
        status.label,
      ].join(" ");

      return fuzzyIncludes(searchableText, trimmedQuery);
    });
  }, [
    maxQuantity,
    minQuantity,
    searchQuery,
    selectedCategories,
    selectedLocationId,
    selectedMaterials,
    selectedStatus,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    pageStartIndex,
    pageStartIndex + itemsPerPage,
  );
  const showPagination = totalPages > 1;

  const inventoryStats = useMemo(
    () => ({
      inStockCount: filteredData.filter(
        (item) => item.current_amount >= item.min_amount,
      ).length,
      lowStockCount: filteredData.filter(
        (item) =>
          item.current_amount > 0 && item.current_amount < item.min_amount,
      ).length,
      outOfStockCount: filteredData.filter((item) => item.current_amount === 0)
        .length,
      categoryCount: new Set(filteredData.map((item) => item.category)).size,
    }),
    [filteredData],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(data.map((item) => item.category))),
    [],
  );
  const materialOptions = useMemo(
    () => Array.from(new Set(data.map((item) => item.material))),
    [],
  );
  const selectedLocation =
    productLocations.find((location) => location.id === selectedLocationId) ??
    productLocations[0];

  const resetToFirstPage = () => setCurrentPage(1);
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategories.length > 0 ||
    selectedStatus !== null ||
    selectedMaterials.length > 0 ||
    minQuantity !== "" ||
    maxQuantity !== "";
  const activeFilterCount =
    (searchQuery.trim() !== "" ? 1 : 0) +
    selectedCategories.length +
    (selectedStatus !== null ? 1 : 0) +
    selectedMaterials.length +
    (minQuantity !== "" || maxQuantity !== "" ? 1 : 0);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetToFirstPage();
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
    resetToFirstPage();
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((currentCategories) =>
      currentCategories.includes(category)
        ? currentCategories.filter((item) => item !== category)
        : [...currentCategories, category],
    );
    resetToFirstPage();
  };

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
    resetToFirstPage();
  };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials((currentMaterials) =>
      currentMaterials.includes(material)
        ? currentMaterials.filter((item) => item !== material)
        : [...currentMaterials, material],
    );
    resetToFirstPage();
  };

  const handleMinQuantityChange = (value: string) => {
    setMinQuantity(value);
    resetToFirstPage();
  };

  const handleMaxQuantityChange = (value: string) => {
    setMaxQuantity(value);
    resetToFirstPage();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedStatus(null);
    setSelectedMaterials([]);
    setMinQuantity("");
    setMaxQuantity("");
    resetToFirstPage();
  };

  const categoryFilterLabel =
    selectedCategories.length === 0
      ? "الفئة"
      : `الفئات (${selectedCategories.length})`;
  const materialFilterLabel =
    selectedMaterials.length === 0
      ? "المواد"
      : `المواد (${selectedMaterials.length})`;

  return (
    <div className={styles.pageShell}>
      <Card elevation={Elevation.ONE} className={styles.inventoryCard}>
        <header className={styles.header}>
          <div>
            <div className={styles.headerTitle}>
              <Icon icon="cube" size={25} />
              <H3 className={styles.title}>مخزون المنتجات</H3>
            </div>

            <p className={styles.headerDescription}>
              متابعة المنتجات الجاهزة، مراجعة الكميات المتاحة، والتنبيه عند
              انخفاض المخزون.
            </p>
          </div>

          <div className={styles.headerActions}>
            <PopoverNext
              placement="bottom-end"
              content={
                <Menu style={{ direction: "rtl" }}>
                  {productLocations.map((location) => (
                    <MenuItem
                      key={location.id}
                      icon={
                        location.id === selectedLocationId ? "tick" : "blank"
                      }
                      text={location.label}
                      onClick={() => handleLocationChange(location.id)}
                    />
                  ))}
                </Menu>
              }
            >
              <Button icon="map-marker" rightIcon="caret-down">
                {selectedLocation.label}
              </Button>
            </PopoverNext>

            <Button
              intent="primary"
              icon="plus"
              onClick={() =>
                setPrototypeModal({
                  title: "إضافة منتجات جديدة",
                  description:
                    "اسحب ملف Excel أو CSV هنا، أو اختر إضافة منتج يدويًا. هذا نموذج أولي للعرض فقط.",
                  variant: "import",
                })
              }
            >
              إضافة منتج جديد
            </Button>
          </div>
        </header>

        <div className={styles.statsRow}>
          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.iconContainer}>
                <Icon icon="tick" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>منتجات متوفرة</div>
                <div className={styles.statNumber}>
                  {inventoryStats.inStockCount}
                </div>
                <div className={styles.statSubtitle}>متاحة للبيع</div>
              </div>
            </div>
          </Card>

          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.warningIconContainer}>
                <Icon icon="warning-sign" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>مخزون منخفض</div>
                <div className={styles.statNumber}>
                  {inventoryStats.lowStockCount}
                </div>
                <div className={styles.statSubtitle}>تحتاج إعادة تعبئة</div>
              </div>
            </div>
          </Card>

          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.dangerIconContainer}>
                <Icon icon="cross" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>غير متوفرة</div>
                <div className={styles.statNumber}>
                  {inventoryStats.outOfStockCount}
                </div>
                <div className={styles.statSubtitle}>نفدت حاليا</div>
              </div>
            </div>
          </Card>

          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.categoryIconContainer}>
                <Icon icon="th" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>الفئات</div>
                <div className={styles.statNumber}>
                  {inventoryStats.categoryCount}
                </div>
                <div className={styles.statSubtitle}>فئات</div>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.toolbar}>
          <InputGroup
            className={styles.searchField}
            leftIcon="search"
            placeholder="بحث المنتجات"
            rightElement={
              searchQuery ? (
                <Button
                  aria-label="مسح البحث"
                  icon="cross"
                  minimal
                  onClick={() => handleSearchChange("")}
                />
              ) : undefined
            }
            value={searchQuery}
            onValueChange={handleSearchChange}
            fill
          />

          <PopoverNext
            placement="bottom-end"
            content={
              <Menu style={{ direction: "ltr" }}>
                <MenuItem
                  text="All Categories"
                  icon={selectedCategories.length === 0 ? "tick" : "blank"}
                  shouldDismissPopover={false}
                  onClick={() => {
                    setSelectedCategories([]);
                    resetToFirstPage();
                  }}
                />
                {categoryOptions.map((category) => (
                  <MenuItem
                    key={category}
                    icon={
                      selectedCategories.includes(category) ? "tick" : "blank"
                    }
                    text={category}
                    shouldDismissPopover={false}
                    onClick={() => toggleCategory(category)}
                  />
                ))}
              </Menu>
            }
          >
            <Button icon="filter" rightIcon="caret-down">
              {categoryFilterLabel}
            </Button>
          </PopoverNext>

          <PopoverNext
            placement="bottom-end"
            content={
              <Menu style={{ direction: "rtl" }}>
                <MenuItem
                  text="كل الحالات"
                  onClick={() => handleStatusChange(null)}
                />
                <MenuItem
                  text={stockStatusLabels.inStock}
                  onClick={() => handleStatusChange("inStock")}
                />
                <MenuItem
                  text={stockStatusLabels.lowStock}
                  onClick={() => handleStatusChange("lowStock")}
                />
                <MenuItem
                  text={stockStatusLabels.outOfStock}
                  onClick={() => handleStatusChange("outOfStock")}
                />
              </Menu>
            }
          >
            <Button icon="caret-down">
              {selectedStatus
                ? stockStatusLabels[
                    selectedStatus as keyof typeof stockStatusLabels
                  ]
                : "الحالة"}
            </Button>
          </PopoverNext>

          <PopoverNext
            placement="bottom-end"
            content={
              <Menu style={{ direction: "ltr" }}>
                <MenuItem
                  text="All Materials"
                  icon={selectedMaterials.length === 0 ? "tick" : "blank"}
                  shouldDismissPopover={false}
                  onClick={() => {
                    setSelectedMaterials([]);
                    resetToFirstPage();
                  }}
                />
                {materialOptions.map((material) => (
                  <MenuItem
                    key={material}
                    icon={
                      selectedMaterials.includes(material) ? "tick" : "blank"
                    }
                    text={material}
                    shouldDismissPopover={false}
                    onClick={() => toggleMaterial(material)}
                  />
                ))}
              </Menu>
            }
          >
            <Button icon="filter" rightIcon="caret-down">
              {materialFilterLabel}
            </Button>
          </PopoverNext>

          <div className={styles.quantityFilters}>
            <InputGroup
              className={styles.quantityInput}
              leftIcon="numerical"
              min={0}
              placeholder="أقل كمية"
              type="number"
              value={minQuantity}
              onValueChange={handleMinQuantityChange}
            />
            <InputGroup
              className={styles.quantityInput}
              leftIcon="numerical"
              min={0}
              placeholder="أعلى كمية"
              type="number"
              value={maxQuantity}
              onValueChange={handleMaxQuantityChange}
            />
          </div>

          <Button
            className={styles.clearFiltersButton}
            icon="filter-remove"
            disabled={!hasActiveFilters}
            onClick={clearFilters}
          >
            مسح الفلاتر
            {activeFilterCount > 0 && (
              <span className={styles.filterCount}>{activeFilterCount}</span>
            )}
          </Button>
        </div>

        <div className={styles.tablePanel}>
          <div className={styles.tableScroll}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>الحالة</th>
                  <th>صورة</th>
                  <th>الباركود</th>
                  <th>اسم المنتج</th>
                  <th>الكمية</th>
                  <th>الفئة</th>
                  <th>المواد</th>
                  <th>الأبعاد</th>
                  <th>عرض</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => {
                  const status = getStockStatus(item);

                  return (
                    <tr key={item.barcode}>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            status.key,
                          )}`}
                        >
                          <Icon icon={status.icon} size={14} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={40}
                          height={40}
                          unoptimized
                          className={styles.productImage}
                        />
                      </td>
                      <td>{item.barcode}</td>
                      <td>
                        <div className={styles.productCell}>
                          <span className={styles.productName}>
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td>{item.current_amount}</td>
                      <td>{item.category}</td>
                      <td>{item.material}</td>
                      <td>{item.dimensions}</td>
                      <td>
                        <Button
                          aria-label="عرض المنتج"
                          icon="eye-open"
                          minimal
                          small
                          onClick={() => setSelectedItem(item)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {paginatedData.length === 0 && (
            <div className={styles.emptyState}>لا توجد منتجات مطابقة</div>
          )}

          <div className={styles.tableFooter}>
            <span>
              عرض {paginatedData.length} من {filteredData.length} منتج
            </span>

            {showPagination && (
              <div className={styles.pagination}>
                <Button
                  icon="chevron-right"
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  السابق
                </Button>

                <div className={styles.pageButtons}>
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;

                    return (
                      <Button
                        key={pageNumber}
                        intent={
                          activePage === pageNumber ? "primary" : undefined
                        }
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  icon="chevron-left"
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  التالي
                </Button>
              </div>
            )}
          </div>
        </div>

        <Overlay2
          isOpen={selectedItem !== null}
          onClose={() => setSelectedItem(null)}
          hasBackdrop
          canEscapeKeyClose
          canOutsideClickClose
        >
          <div className={styles.modalOverlay}>
            <Card className={styles.modalCard}>
              {selectedItem && (
                <>
                  <div className={styles.modalHeader}>
                    <Image
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      width={100}
                      height={100}
                      unoptimized
                      className={styles.modalImage}
                    />

                    <div className={styles.modalTitleBlock}>
                      <H3 className={styles.modalTitle}>{selectedItem.name}</H3>
                      {(() => {
                        const status = getStockStatus(selectedItem);

                        return (
                          <span
                            className={`${styles.statusBadge} ${styles.modalStatusBadge} ${getStatusClass(
                              status.key,
                            )}`}
                          >
                            <Icon icon={status.icon} size={14} />
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className={styles.modalDetails}>
                    <p>
                      <strong>الباركود:</strong> {selectedItem.barcode}
                    </p>
                    <p>
                      <strong>الفئة:</strong> {selectedItem.category}
                    </p>
                    <p>
                      <strong>المادة:</strong> {selectedItem.material}
                    </p>
                    <p>
                      <strong>الأبعاد:</strong> {selectedItem.dimensions}
                    </p>
                    <p>
                      <strong>الكمية الحالية:</strong>{" "}
                      {selectedItem.current_amount}
                    </p>
                    <p>
                      <strong>الحد الأدنى:</strong> {selectedItem.min_amount}
                    </p>
                    <p>
                      <strong>الحد الأقصى:</strong> {selectedItem.max_amount}
                    </p>
                  </div>

                  <div className={styles.modalActions}>
                    <Button
                      icon="edit"
                      onClick={() =>
                        setPrototypeModal({
                          title: "تعديل بيانات المنتج",
                          description:
                            "هذه نافذة تجريبية لتعديل بيانات المنتج. لن يتم حفظ أي تغييرات.",
                        })
                      }
                    >
                      تعديل
                    </Button>
                    <Button
                      icon="trash"
                      intent="danger"
                      onClick={() =>
                        setPrototypeModal({
                          title: "حذف المنتج",
                          description:
                            "هذه نافذة تجريبية لتأكيد الحذف. لن يتم حذف أي بيانات فعلية.",
                        })
                      }
                    >
                      حذف
                    </Button>
                    <Button
                      intent="primary"
                      onClick={() => setSelectedItem(null)}
                    >
                      إغلاق
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </Overlay2>

        <Overlay2
          isOpen={prototypeModal !== null}
          onClose={() => setPrototypeModal(null)}
          hasBackdrop
          canEscapeKeyClose
          canOutsideClickClose
        >
          <div className={styles.modalOverlay}>
            <Card className={styles.prototypeModalCard}>
              {prototypeModal && (
                <>
                  <H3 className={styles.modalTitle}>{prototypeModal.title}</H3>
                  <p className={styles.prototypeDescription}>
                    {prototypeModal.description}
                  </p>
                  {prototypeModal.variant === "import" && (
                    <>
                      <div className={styles.dropZone}>
                        <Icon icon="cloud-upload" size={34} />
                        <div className={styles.dropZoneTitle}>
                          اسحب ملف Excel أو CSV هنا
                        </div>
                        <div className={styles.dropZoneText}>
                          الصيغ المدعومة: .xlsx, .xls, .csv
                        </div>
                        <Button icon="document-open" minimal>
                          اختيار ملف
                        </Button>
                      </div>

                      <div className={styles.manualOption}>
                        <span>أو أضف منتجًا واحدًا بدون ملف</span>
                        <Button icon="edit" intent="primary" outlined>
                          إضافة يدويًا
                        </Button>
                      </div>
                    </>
                  )}
                  <div className={styles.modalActions}>
                    <Button
                      intent="primary"
                      onClick={() => setPrototypeModal(null)}
                    >
                      إغلاق
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </Overlay2>
      </Card>
    </div>
  );
}
