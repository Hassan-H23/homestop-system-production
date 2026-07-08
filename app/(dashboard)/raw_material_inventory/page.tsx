"use client";

import styles from "./raw_material_inventory.module.css";
import {
  factories,
  rawMaterialItems,
  type RawMaterialItem,
} from "./RawMaterialData";
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
  Switch,
} from "@/app/components/mantine-ui";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";

const itemsPerPage = 20;

const stockStatusLabels = {
  inStock: "متوفر",
  lowStock: "تحتاج طلب",
  outOfStock: "نفدت",
};

function getStockStatus(item: RawMaterialItem) {
  if (item.currentAmount === 0) {
    return {
      key: "outOfStock",
      label: stockStatusLabels.outOfStock,
      icon: "cross" as const,
    };
  }

  if (item.currentAmount < item.minAmount) {
    return {
      key: "lowStock",
      label: stockStatusLabels.lowStock,
      icon: "warning-sign" as const,
    };
  }

  return {
    key: "inStock",
    label: stockStatusLabels.inStock,
    icon: "tick" as const,
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

export default function RawMaterialInventoryPage() {
  const [selectedItem, setSelectedItem] = useState<RawMaterialItem | null>(null);
  const [prototypeModal, setPrototypeModal] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [selectedFactoryId, setSelectedFactoryId] = useState(factories[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<string[]>(
    [],
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");
  const [reorderOnly, setReorderOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const selectedFactory = factories.find(
    (factory) => factory.id === selectedFactoryId,
  );

  const factoryData = useMemo(
    () =>
      rawMaterialItems.filter((item) => item.factoryId === selectedFactoryId),
    [selectedFactoryId],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(factoryData.map((item) => item.category))),
    [factoryData],
  );
  const resourceTypeOptions = useMemo(
    () => Array.from(new Set(factoryData.map((item) => item.resourceType))),
    [factoryData],
  );

  const filteredData = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const minQuantityValue = minQuantity === "" ? null : Number(minQuantity);
    const maxQuantityValue = maxQuantity === "" ? null : Number(maxQuantity);

    return factoryData.filter((item) => {
      const status = getStockStatus(item);
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.category);
      const matchesType =
        selectedResourceTypes.length === 0 ||
        selectedResourceTypes.includes(item.resourceType);
      const matchesStatus = !selectedStatus || status.key === selectedStatus;
      const matchesReorderOnly =
        !reorderOnly || item.currentAmount <= item.minAmount;
      const matchesMinQuantity =
        minQuantityValue === null ||
        Number.isNaN(minQuantityValue) ||
        item.currentAmount >= minQuantityValue;
      const matchesMaxQuantity =
        maxQuantityValue === null ||
        Number.isNaN(maxQuantityValue) ||
        item.currentAmount <= maxQuantityValue;

      if (
        !matchesCategory ||
        !matchesType ||
        !matchesStatus ||
        !matchesReorderOnly ||
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
        item.resourceType,
        item.category,
        item.unit,
        String(item.currentAmount),
        status.label,
      ].join(" ");

      return fuzzyIncludes(searchableText, trimmedQuery);
    });
  }, [
    factoryData,
    maxQuantity,
    minQuantity,
    reorderOnly,
    searchQuery,
    selectedCategories,
    selectedResourceTypes,
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
      totalMaterials: filteredData.length,
      reorderCount: filteredData.filter(
        (item) => item.currentAmount > 0 && item.currentAmount < item.minAmount,
      ).length,
      outOfStockCount: filteredData.filter((item) => item.currentAmount === 0)
        .length,
      categoryCount: new Set(filteredData.map((item) => item.category)).size,
    }),
    [filteredData],
  );

  const resetToFirstPage = () => setCurrentPage(1);
  const toggleSelection = (
    value: string,
    selectedValues: string[],
    setSelectedValues: Dispatch<SetStateAction<string[]>>,
  ) => {
    setSelectedValues(
      selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value],
    );
    resetToFirstPage();
  };

  const handleFactoryChange = (factoryId: string) => {
    setSelectedFactoryId(factoryId);
    setSelectedCategories([]);
    setSelectedResourceTypes([]);
    setSelectedStatus(null);
    setMinQuantity("");
    setMaxQuantity("");
    setReorderOnly(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedResourceTypes([]);
    setSelectedStatus(null);
    setMinQuantity("");
    setMaxQuantity("");
    setReorderOnly(false);
    resetToFirstPage();
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategories.length > 0 ||
    selectedResourceTypes.length > 0 ||
    selectedStatus !== null ||
    minQuantity !== "" ||
    maxQuantity !== "" ||
    reorderOnly;
  const activeFilterCount =
    (searchQuery.trim() !== "" ? 1 : 0) +
    selectedCategories.length +
    selectedResourceTypes.length +
    (selectedStatus !== null ? 1 : 0) +
    (minQuantity !== "" || maxQuantity !== "" ? 1 : 0) +
    (reorderOnly ? 1 : 0);

  const categoryFilterLabel =
    selectedCategories.length === 0
      ? "الفئة"
      : `الفئات (${selectedCategories.length})`;
  const typeFilterLabel =
    selectedResourceTypes.length === 0
      ? "نوع الخام"
      : `أنواع الخام (${selectedResourceTypes.length})`;

  return (
    <div className={styles.pageShell}>
      <Card elevation={Elevation.ONE} className={styles.inventoryCard}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.headerTitle}>
                <Icon icon="layers" size={25} />
                <H3 className={styles.title}>مخزون المواد الخام</H3>
              </div>

              <p className={styles.headerDescription}>
                متابعة الخامات حسب المصنع، نوع الخام، الفئة، وحدود إعادة الطلب.
              </p>
            </div>

            <div className={styles.headerControls}>
              <PopoverNext
                placement="bottom-end"
                content={
                  <Menu style={{ direction: "rtl" }}>
                    {factories.map((factory) => (
                      <MenuItem
                        key={factory.id}
                        icon={
                          factory.id === selectedFactoryId ? "tick" : "blank"
                        }
                        text={`${factory.name} - ${factory.city}`}
                        onClick={() => handleFactoryChange(factory.id)}
                      />
                    ))}
                  </Menu>
                }
              >
                <Button icon="office" rightIcon="caret-down">
                  {selectedFactory?.name ?? "اختر المصنع"}
                </Button>
              </PopoverNext>

              <Button
                intent="primary"
                icon="plus"
                onClick={() =>
                  setPrototypeModal({
                    title: "إضافة خامة جديدة",
                    description:
                      "هذه نافذة تجريبية لإضافة خامة جديدة. لن يتم حفظ أي بيانات في هذا النموذج الأولي.",
                  })
                }
              >
                إضافة خامة جديدة
              </Button>
            </div>
          </div>
        </header>

        <div className={styles.statsRow}>
          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.iconContainer}>
                <Icon icon="database" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>مواد مسجلة</div>
                <div className={styles.statNumber}>
                  {inventoryStats.totalMaterials}
                </div>
                <div className={styles.statSubtitle}>داخل المصنع المحدد</div>
              </div>
            </div>
          </Card>

          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.warningIconContainer}>
                <Icon icon="warning-sign" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>تحتاج إعادة طلب</div>
                <div className={styles.statNumber}>
                  {inventoryStats.reorderCount}
                </div>
                <div className={styles.statSubtitle}>أقل من الحد الأدنى</div>
              </div>
            </div>
          </Card>

          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.dangerIconContainer}>
                <Icon icon="cross" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>نفدت بالكامل</div>
                <div className={styles.statNumber}>
                  {inventoryStats.outOfStockCount}
                </div>
                <div className={styles.statSubtitle}>تحتاج إجراء عاجل</div>
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
                <div className={styles.statSubtitle}>ضمن النتائج الحالية</div>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.toolbar}>
          <InputGroup
            className={styles.searchField}
            leftIcon="search"
            placeholder="بحث الخامات"
            rightElement={
              searchQuery ? (
                <Button
                  aria-label="مسح البحث"
                  icon="cross"
                  minimal
                  onClick={() => {
                    setSearchQuery("");
                    resetToFirstPage();
                  }}
                />
              ) : undefined
            }
            value={searchQuery}
            onValueChange={(value) => {
              setSearchQuery(value);
              resetToFirstPage();
            }}
            fill
          />

          <PopoverNext
            placement="bottom-end"
            content={
              <Menu style={{ direction: "rtl" }}>
                <MenuItem
                  text="كل الفئات"
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
                    onClick={() =>
                      toggleSelection(
                        category,
                        selectedCategories,
                        setSelectedCategories,
                      )
                    }
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
                  text="كل الأنواع"
                  icon={
                    selectedResourceTypes.length === 0 ? "tick" : "blank"
                  }
                  shouldDismissPopover={false}
                  onClick={() => {
                    setSelectedResourceTypes([]);
                    resetToFirstPage();
                  }}
                />
                {resourceTypeOptions.map((resourceType) => (
                  <MenuItem
                    key={resourceType}
                    icon={
                      selectedResourceTypes.includes(resourceType)
                        ? "tick"
                        : "blank"
                    }
                    text={resourceType}
                    shouldDismissPopover={false}
                    onClick={() =>
                      toggleSelection(
                        resourceType,
                        selectedResourceTypes,
                        setSelectedResourceTypes,
                      )
                    }
                  />
                ))}
              </Menu>
            }
          >
            <Button icon="filter" rightIcon="caret-down">
              {typeFilterLabel}
            </Button>
          </PopoverNext>

          <PopoverNext
            placement="bottom-end"
            content={
              <Menu style={{ direction: "rtl" }}>
                <MenuItem
                  text="كل الحالات"
                  icon={selectedStatus === null ? "tick" : "blank"}
                  onClick={() => {
                    setSelectedStatus(null);
                    resetToFirstPage();
                  }}
                />
                <MenuItem
                  text={stockStatusLabels.inStock}
                  icon={selectedStatus === "inStock" ? "tick" : "blank"}
                  onClick={() => {
                    setSelectedStatus("inStock");
                    resetToFirstPage();
                  }}
                />
                <MenuItem
                  text={stockStatusLabels.lowStock}
                  icon={selectedStatus === "lowStock" ? "tick" : "blank"}
                  onClick={() => {
                    setSelectedStatus("lowStock");
                    resetToFirstPage();
                  }}
                />
                <MenuItem
                  text={stockStatusLabels.outOfStock}
                  icon={selectedStatus === "outOfStock" ? "tick" : "blank"}
                  onClick={() => {
                    setSelectedStatus("outOfStock");
                    resetToFirstPage();
                  }}
                />
              </Menu>
            }
          >
            <Button icon="filter" rightIcon="caret-down">
              {selectedStatus
                ? stockStatusLabels[
                    selectedStatus as keyof typeof stockStatusLabels
                  ]
                : "الحالة"}
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
              onValueChange={(value) => {
                setMinQuantity(value);
                resetToFirstPage();
              }}
            />
            <InputGroup
              className={styles.quantityInput}
              leftIcon="numerical"
              min={0}
              placeholder="أعلى كمية"
              type="number"
              value={maxQuantity}
              onValueChange={(value) => {
                setMaxQuantity(value);
                resetToFirstPage();
              }}
            />
          </div>

          <Switch
            className={styles.reorderSwitch}
            checked={reorderOnly}
            label="مواد تحتاج طلب فقط"
            onChange={() => {
              setReorderOnly((value) => !value);
              resetToFirstPage();
            }}
          />

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
                  <th>Barcode</th>
                  <th>عرض</th>
                  <th>نوع الخام</th>
                  <th>الفئة</th>
                  <th>الكمية</th>
                  <th>الحد الأدنى</th>
                  <th>الحد الأقصى</th>
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
                      <td>{item.barcode}</td>
                      <td>
                        <Button
                          aria-label="عرض الخامة"
                          icon="eye-open"
                          minimal
                          small
                          onClick={() => setSelectedItem(item)}
                        />
                      </td>
                      <td className={styles.resourceName}>
                        {item.resourceType}
                      </td>
                      <td>{item.category}</td>
                      <td>
                        {item.currentAmount} {item.unit}
                      </td>
                      <td>
                        {item.minAmount} {item.unit}
                      </td>
                      <td>
                        {item.maxAmount} {item.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {paginatedData.length === 0 && (
            <div className={styles.emptyState}>لا توجد خامات مطابقة</div>
          )}

          <div className={styles.tableFooter}>
            <span>
              عرض {paginatedData.length} من {filteredData.length} مادة خام
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
                    <div className={styles.modalTitleBlock}>
                      <H3 className={styles.modalTitle}>
                        {selectedItem.resourceType}
                      </H3>
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
                      <strong>Barcode:</strong> {selectedItem.barcode}
                    </p>
                    <p>
                      <strong>الفئة:</strong> {selectedItem.category}
                    </p>
                    <p>
                      <strong>المصنع:</strong>{" "}
                      {selectedFactory?.name ?? selectedItem.factoryId}
                    </p>
                    <p>
                      <strong>الكمية الحالية:</strong>{" "}
                      {selectedItem.currentAmount} {selectedItem.unit}
                    </p>
                    <p>
                      <strong>الحد الأدنى:</strong> {selectedItem.minAmount}{" "}
                      {selectedItem.unit}
                    </p>
                    <p>
                      <strong>الحد الأقصى:</strong> {selectedItem.maxAmount}{" "}
                      {selectedItem.unit}
                    </p>
                  </div>

                  <div className={styles.modalActions}>
                    <Button
                      icon="edit"
                      onClick={() =>
                        setPrototypeModal({
                          title: "تعديل بيانات الخامة",
                          description:
                            "هذه نافذة تجريبية لتعديل بيانات الخامة. لن يتم حفظ أي تغييرات.",
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
                          title: "حذف الخامة",
                          description:
                            "هذه نافذة تجريبية لتأكيد الحذف. لن يتم حذف أي بيانات فعلية.",
                        })
                      }
                    >
                      حذف
                    </Button>
                    <Button intent="primary" onClick={() => setSelectedItem(null)}>
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
