"use client";

import styles from "./employee.module.css";
import {
  employees as data,
  type EmployeeItem,
  type EmployeeStatus,
} from "./employeesData";
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

const statusMeta: Record<
  EmployeeStatus,
  { label: string; icon: "tick" | "time" | "pause"; className: string }
> = {
  active: {
    label: "نشط",
    icon: "tick",
    className: styles.statusSuccess,
  },
  onLeave: {
    label: "إجازة",
    icon: "time",
    className: styles.statusWarning,
  },
  suspended: {
    label: "موقوف",
    icon: "pause",
    className: styles.statusDanger,
  },
};

const salaryFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const compactEnglishSalaryFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatSalary(value: number) {
  return salaryFormatter.format(value);
}

function formatCompactEnglishSalary(value: number) {
  return `EGP ${compactEnglishSalaryFormatter.format(value)}`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
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

function uniqueOptions<T extends keyof EmployeeItem>(field: T) {
  return Array.from(new Set(data.map((employee) => employee[field] as string)));
}

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeItem | null>(null);
  const [prototypeModal, setPrototypeModal] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | null>(
    null,
  );
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const minSalaryValue = minSalary === "" ? null : Number(minSalary);
    const maxSalaryValue = maxSalary === "" ? null : Number(maxSalary);

    return data.filter((employee) => {
      const matchesPosition =
        selectedPositions.length === 0 ||
        selectedPositions.includes(employee.position);
      const matchesLocation =
        selectedLocations.length === 0 ||
        selectedLocations.includes(employee.location);
      const matchesRole =
        selectedRoles.length === 0 ||
        selectedRoles.includes(employee.systemRole);
      const matchesStatus =
        selectedStatus === null || employee.status === selectedStatus;
      const matchesMinSalary =
        minSalaryValue === null ||
        Number.isNaN(minSalaryValue) ||
        employee.salary >= minSalaryValue;
      const matchesMaxSalary =
        maxSalaryValue === null ||
        Number.isNaN(maxSalaryValue) ||
        employee.salary <= maxSalaryValue;

      if (
        !matchesPosition ||
        !matchesLocation ||
        !matchesRole ||
        !matchesStatus ||
        !matchesMinSalary ||
        !matchesMaxSalary
      ) {
        return false;
      }

      if (!trimmedQuery) {
        return true;
      }

      const searchableText = [
        employee.employeeCode,
        employee.name,
        employee.position,
        employee.location,
        employee.systemRole,
        employee.phone,
        employee.email,
        employee.department,
        employee.manager,
        statusMeta[employee.status].label,
      ].join(" ");

      return fuzzyIncludes(searchableText, trimmedQuery);
    });
  }, [
    maxSalary,
    minSalary,
    searchQuery,
    selectedLocations,
    selectedPositions,
    selectedRoles,
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

  const employeeStats = useMemo(
    () => ({
      totalEmployees: filteredData.length,
      activeEmployees: filteredData.filter(
        (employee) => employee.status === "active",
      ).length,
      monthlyPayroll: filteredData.reduce(
        (total, employee) => total + employee.salary,
        0,
      ),
      systemUsers: filteredData.filter(
        (employee) => employee.hasSystemAccess,
      ).length,
    }),
    [filteredData],
  );

  const positionOptions = useMemo(() => uniqueOptions("position"), []);
  const locationOptions = useMemo(() => uniqueOptions("location"), []);
  const roleOptions = useMemo(() => uniqueOptions("systemRole"), []);

  const resetToFirstPage = () => setCurrentPage(1);
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedPositions.length > 0 ||
    selectedLocations.length > 0 ||
    selectedRoles.length > 0 ||
    selectedStatus !== null ||
    minSalary !== "" ||
    maxSalary !== "";
  const activeFilterCount =
    (searchQuery.trim() !== "" ? 1 : 0) +
    selectedPositions.length +
    selectedLocations.length +
    selectedRoles.length +
    (selectedStatus !== null ? 1 : 0) +
    (minSalary !== "" || maxSalary !== "" ? 1 : 0);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetToFirstPage();
  };

  const toggleOption = (
    value: string,
    selectedValues: string[],
    setSelectedValues: (values: string[]) => void,
  ) => {
    setSelectedValues(
      selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value],
    );
    resetToFirstPage();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedPositions([]);
    setSelectedLocations([]);
    setSelectedRoles([]);
    setSelectedStatus(null);
    setMinSalary("");
    setMaxSalary("");
    resetToFirstPage();
  };

  const renderMultiSelectMenu = (
    allText: string,
    options: string[],
    selectedValues: string[],
    setSelectedValues: (values: string[]) => void,
  ) => (
    <Menu style={{ direction: "rtl" }}>
      <MenuItem
        text={allText}
        icon={selectedValues.length === 0 ? "tick" : "blank"}
        shouldDismissPopover={false}
        onClick={() => {
          setSelectedValues([]);
          resetToFirstPage();
        }}
      />
      {options.map((option) => (
        <MenuItem
          key={option}
          text={option}
          icon={selectedValues.includes(option) ? "tick" : "blank"}
          shouldDismissPopover={false}
          onClick={() => toggleOption(option, selectedValues, setSelectedValues)}
        />
      ))}
    </Menu>
  );

  return (
    <div className={styles.pageShell}>
      <Card elevation={Elevation.ONE} className={styles.employeeCard}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.headerTitle}>
                <Icon icon="people" size={25} />
                <H3 className={styles.title}>الموظفون</H3>
              </div>

              <p className={styles.headerDescription}>
                متابعة بيانات الموظفين، الرواتب، أماكن العمل، وصلاحيات استخدام النظام.
              </p>
            </div>

            <Button
              intent="primary"
              icon="plus"
              onClick={() =>
                setPrototypeModal({
                  title: "إضافة موظف جديد",
                  description:
                    "هذه نافذة تجريبية لإضافة موظف جديد. لن يتم حفظ أي بيانات في هذا النموذج الأولي.",
                })
              }
            >
              إضافة موظف جديد
            </Button>
          </div>
        </header>

        <div className={styles.statsRow}>
          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.iconContainer}>
                <Icon icon="people" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>إجمالي الموظفين</div>
                <div className={styles.statNumber}>
                  {employeeStats.totalEmployees}
                </div>
                <div className={styles.statSubtitle}>ضمن النتائج الحالية</div>
              </div>
            </div>
          </Card>

          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.successIconContainer}>
                <Icon icon="tick-circle" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>الموظفون النشطون</div>
                <div className={styles.statNumber}>
                  {employeeStats.activeEmployees}
                </div>
                <div className={styles.statSubtitle}>جاهزون للعمل</div>
              </div>
            </div>
          </Card>

          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.warningIconContainer}>
                <Icon icon="bank-account" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>إجمالي الرواتب الشهرية</div>
                <div className={styles.statNumber}>
                  {formatCompactEnglishSalary(employeeStats.monthlyPayroll)}
                </div>
                <div className={styles.statSubtitle}>للنتائج المعروضة</div>
              </div>
            </div>
          </Card>

          <Card elevation={Elevation.ONE} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.categoryIconContainer}>
                <Icon icon="key" size={26} />
              </div>
              <div className={styles.textContainer}>
                <div className={styles.statTitle}>مستخدمو النظام</div>
                <div className={styles.statNumber}>
                  {employeeStats.systemUsers}
                </div>
                <div className={styles.statSubtitle}>لديهم صلاحية دخول</div>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.toolbar}>
          <InputGroup
            className={styles.searchField}
            leftIcon="search"
            placeholder="بحث الموظفين"
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
            content={renderMultiSelectMenu(
              "كل المناصب",
              positionOptions,
              selectedPositions,
              setSelectedPositions,
            )}
          >
            <Button icon="filter" rightIcon="caret-down">
              {selectedPositions.length === 0
                ? "المنصب"
                : `المناصب (${selectedPositions.length})`}
            </Button>
          </PopoverNext>

          <PopoverNext
            placement="bottom-end"
            content={renderMultiSelectMenu(
              "كل أماكن العمل",
              locationOptions,
              selectedLocations,
              setSelectedLocations,
            )}
          >
            <Button icon="filter" rightIcon="caret-down">
              {selectedLocations.length === 0
                ? "مكان العمل"
                : `أماكن العمل (${selectedLocations.length})`}
            </Button>
          </PopoverNext>

          <PopoverNext
            placement="bottom-end"
            content={renderMultiSelectMenu(
              "كل أدوار النظام",
              roleOptions,
              selectedRoles,
              setSelectedRoles,
            )}
          >
            <Button icon="filter" rightIcon="caret-down">
              {selectedRoles.length === 0
                ? "دور النظام"
                : `أدوار النظام (${selectedRoles.length})`}
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
                {Object.entries(statusMeta).map(([statusKey, meta]) => (
                  <MenuItem
                    key={statusKey}
                    text={meta.label}
                    icon={selectedStatus === statusKey ? "tick" : "blank"}
                    onClick={() => {
                      setSelectedStatus(statusKey as EmployeeStatus);
                      resetToFirstPage();
                    }}
                  />
                ))}
              </Menu>
            }
          >
            <Button icon="filter" rightIcon="caret-down">
              {selectedStatus ? statusMeta[selectedStatus].label : "الحالة"}
            </Button>
          </PopoverNext>

          <div className={styles.salaryFilters}>
            <InputGroup
              className={styles.salaryInput}
              leftIcon="numerical"
              min={0}
              placeholder="أقل راتب"
              type="number"
              value={minSalary}
              onValueChange={(value) => {
                setMinSalary(value);
                resetToFirstPage();
              }}
            />
            <InputGroup
              className={styles.salaryInput}
              leftIcon="numerical"
              min={0}
              placeholder="أعلى راتب"
              type="number"
              value={maxSalary}
              onValueChange={(value) => {
                setMaxSalary(value);
                resetToFirstPage();
              }}
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
                  <th>الاسم</th>
                  <th>الراتب</th>
                  <th>المنصب</th>
                  <th>مكان العمل</th>
                  <th>الدور في النظام</th>
                  <th>الحالة</th>
                  <th>عرض</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((employee) => {
                  const status = statusMeta[employee.status];

                  return (
                    <tr key={employee.employeeCode}>
                      <td>
                        <div className={styles.employeeNameCell}>
                          <span className={styles.employeeAvatar}>
                            {employee.name.slice(0, 1)}
                          </span>
                          <div className={styles.employeeIdentity}>
                            <span className={styles.employeeName}>
                              {employee.name}
                            </span>
                            <span className={styles.employeeCode}>
                              {employee.employeeCode}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{formatSalary(employee.salary)}</td>
                      <td>{employee.position}</td>
                      <td>{employee.location}</td>
                      <td>{employee.systemRole}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${status.className}`}
                        >
                          <Icon icon={status.icon} size={14} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <Button
                          aria-label={`عرض بيانات ${employee.name}`}
                          icon="eye-open"
                          minimal
                          small
                          onClick={() => setSelectedEmployee(employee)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {paginatedData.length === 0 && (
            <div className={styles.emptyState}>لا توجد موظفين مطابقين</div>
          )}

          <div className={styles.tableFooter}>
            <span>
              عرض {paginatedData.length} من {filteredData.length} موظف
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
          isOpen={selectedEmployee !== null}
          onClose={() => setSelectedEmployee(null)}
          hasBackdrop
          canEscapeKeyClose
          canOutsideClickClose
        >
          <div className={styles.modalOverlay}>
            <Card className={styles.modalCard}>
              {selectedEmployee && (
                <>
                  <div className={styles.modalHeader}>
                    <span className={styles.modalAvatar}>
                      {selectedEmployee.name.slice(0, 1)}
                    </span>

                    <div className={styles.modalTitleBlock}>
                      <H3 className={styles.modalTitle}>
                        {selectedEmployee.name}
                      </H3>
                      <span
                        className={`${styles.statusBadge} ${styles.modalStatusBadge} ${
                          statusMeta[selectedEmployee.status].className
                        }`}
                      >
                        <Icon
                          icon={statusMeta[selectedEmployee.status].icon}
                          size={14}
                        />
                        {statusMeta[selectedEmployee.status].label}
                      </span>
                    </div>
                  </div>

                  <div className={styles.modalDetails}>
                    <div>
                      <strong>كود الموظف:</strong>{" "}
                      {selectedEmployee.employeeCode}
                    </div>
                    <div>
                      <strong>الرقم القومي:</strong>{" "}
                      {selectedEmployee.nationalId}
                    </div>
                    <div>
                      <strong>المنصب:</strong> {selectedEmployee.position}
                    </div>
                    <div>
                      <strong>القسم:</strong> {selectedEmployee.department}
                    </div>
                    <div>
                      <strong>مكان العمل:</strong> {selectedEmployee.location}
                    </div>
                    <div>
                      <strong>الدور في النظام:</strong>{" "}
                      {selectedEmployee.systemRole}
                    </div>
                    <div>
                      <strong>الراتب:</strong>{" "}
                      {formatSalary(selectedEmployee.salary)}
                    </div>
                    <div>
                      <strong>تاريخ التعيين:</strong>{" "}
                      {formatDate(selectedEmployee.hireDate)}
                    </div>
                    <div>
                      <strong>المدير المباشر:</strong> {selectedEmployee.manager}
                    </div>
                    <div>
                      <strong>الهاتف:</strong> {selectedEmployee.phone}
                    </div>
                    <div>
                      <strong>البريد الإلكتروني:</strong>{" "}
                      {selectedEmployee.email}
                    </div>
                    <div>
                      <strong>صلاحية الدخول:</strong>{" "}
                      {selectedEmployee.hasSystemAccess ? "متاحة" : "غير متاحة"}
                    </div>
                    <div className={styles.modalNotes}>
                      <strong>ملاحظات:</strong> {selectedEmployee.notes}
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                    <Button
                      icon="edit"
                      onClick={() =>
                        setPrototypeModal({
                          title: "تعديل بيانات الموظف",
                          description:
                            "هذه نافذة تجريبية لتعديل بيانات الموظف. لن يتم حفظ أي تغييرات.",
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
                          title: "حذف الموظف",
                          description:
                            "هذه نافذة تجريبية لتأكيد الحذف. لن يتم حذف أي بيانات فعلية.",
                        })
                      }
                    >
                      حذف
                    </Button>
                    <Button
                      intent="primary"
                      onClick={() => setSelectedEmployee(null)}
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
