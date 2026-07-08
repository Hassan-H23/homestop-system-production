"use client";

import {
  Button,
  Card,
  Dialog,
  Elevation,
  H1,
  H2,
  H3,
  HTMLSelect,
  Icon,
  InputGroup,
  type IconName,
} from "@/app/components/mantine-ui";
import { useMemo, useState } from "react";

type AnalyticsProduct = {
  id: string;
  name: string;
  category: string;
  unitCost: number;
  salePrice: number;
};

type AnalyticsEmployee = {
  id: string;
  name: string;
  role: string;
};

type AnalyticsOrderItem = {
  productId: string;
  quantity: number;
};

type AnalyticsOrder = {
  id: string;
  date: string;
  employeeId: string;
  items: AnalyticsOrderItem[];
};

type AnalyticsExpense = {
  id: string;
  date: string;
  category: string;
  amount: number;
};

type DailyMetric = {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  volume: number;
  expenses: number;
};

type RankedItem = {
  id: string;
  name: string;
  detail: string;
  value: number;
  helper: string;
};

type BreakdownRow = {
  id: string;
  date: string;
  name: string;
  detail: string;
  amount: number;
};

const products: AnalyticsProduct[] = [
  {
    id: "geo-table",
    name: "Geometric Table",
    category: "Tables",
    unitCost: 4800,
    salePrice: 8200,
  },
  {
    id: "marble-table",
    name: "Marble Table",
    category: "Tables",
    unitCost: 7200,
    salePrice: 12800,
  },
  {
    id: "gloss-mirror",
    name: "Gloss Mirror",
    category: "Mirrors",
    unitCost: 2100,
    salePrice: 4300,
  },
  {
    id: "aria-sofa",
    name: "Aria Sofa",
    category: "Sofas",
    unitCost: 11000,
    salePrice: 18500,
  },
  {
    id: "nora-chair",
    name: "Nora Lounge Chair",
    category: "Chairs",
    unitCost: 3600,
    salePrice: 6900,
  },
  {
    id: "crest-console",
    name: "Crest Console",
    category: "Storage",
    unitCost: 5400,
    salePrice: 9800,
  },
  {
    id: "luna-light",
    name: "Luna Pendant Light",
    category: "Lighting",
    unitCost: 1900,
    salePrice: 3900,
  },
  {
    id: "haven-bed",
    name: "Haven Bed Frame",
    category: "Beds",
    unitCost: 9800,
    salePrice: 16800,
  },
  {
    id: "metro-desk",
    name: "Metro Desk",
    category: "Desks",
    unitCost: 4100,
    salePrice: 7600,
  },
  {
    id: "velvet-ottoman",
    name: "Velvet Ottoman",
    category: "Decor",
    unitCost: 1700,
    salePrice: 3300,
  },
];

const employees: AnalyticsEmployee[] = [
  { id: "salma", name: "Salma Hassan", role: "Sales Lead" },
  { id: "omar", name: "Omar Nabil", role: "Floor Sales" },
  { id: "nour", name: "Nour Adel", role: "Online Sales" },
  { id: "youssef", name: "Youssef Amin", role: "Account Manager" },
];

const historicalMonths = [
  "2024-01",
  "2024-02",
  "2024-03",
  "2024-04",
  "2024-05",
  "2024-06",
  "2024-07",
  "2024-08",
  "2024-09",
  "2024-10",
  "2024-11",
  "2024-12",
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
];

const productSequence = products.map((product) => product.id);
const employeeSequence = employees.map((employee) => employee.id);

const historicalOrders: AnalyticsOrder[] = historicalMonths.flatMap((month, monthIndex) =>
  [5, 15, 25].map((day, dayIndex) => {
    const firstProduct = productSequence[(monthIndex + dayIndex) % productSequence.length];
    const secondProduct =
      productSequence[(monthIndex * 2 + dayIndex + 3) % productSequence.length];
    const thirdProduct =
      productSequence[(monthIndex * 3 + dayIndex + 6) % productSequence.length];
    const seasonalLift = (monthIndex % 6) + 1;

    return {
      id: `HIST-${month.replace("-", "")}-${day}`,
      date: `${month}-${String(day).padStart(2, "0")}`,
      employeeId: employeeSequence[(monthIndex + dayIndex) % employeeSequence.length],
      items: [
        { productId: firstProduct, quantity: 1 + ((seasonalLift + dayIndex) % 4) },
        { productId: secondProduct, quantity: 2 + ((monthIndex + dayIndex) % 3) },
        { productId: thirdProduct, quantity: 1 + ((monthIndex + dayIndex * 2) % 5) },
      ],
    };
  }),
);

const orders: AnalyticsOrder[] = [
  ...historicalOrders,
  {
    id: "ORD-1001",
    date: "2026-06-17",
    employeeId: "salma",
    items: [
      { productId: "geo-table", quantity: 2 },
      { productId: "gloss-mirror", quantity: 3 },
      { productId: "velvet-ottoman", quantity: 4 },
    ],
  },
  {
    id: "ORD-1002",
    date: "2026-06-18",
    employeeId: "omar",
    items: [
      { productId: "aria-sofa", quantity: 1 },
      { productId: "nora-chair", quantity: 2 },
    ],
  },
  {
    id: "ORD-1003",
    date: "2026-06-19",
    employeeId: "nour",
    items: [
      { productId: "luna-light", quantity: 5 },
      { productId: "metro-desk", quantity: 1 },
    ],
  },
  {
    id: "ORD-1004",
    date: "2026-06-20",
    employeeId: "youssef",
    items: [
      { productId: "marble-table", quantity: 2 },
      { productId: "crest-console", quantity: 1 },
    ],
  },
  {
    id: "ORD-1005",
    date: "2026-06-21",
    employeeId: "salma",
    items: [
      { productId: "haven-bed", quantity: 1 },
      { productId: "gloss-mirror", quantity: 2 },
      { productId: "velvet-ottoman", quantity: 3 },
    ],
  },
  {
    id: "ORD-1006",
    date: "2026-06-22",
    employeeId: "omar",
    items: [
      { productId: "geo-table", quantity: 3 },
      { productId: "luna-light", quantity: 4 },
    ],
  },
  {
    id: "ORD-1007",
    date: "2026-06-23",
    employeeId: "nour",
    items: [
      { productId: "aria-sofa", quantity: 2 },
      { productId: "nora-chair", quantity: 3 },
    ],
  },
  {
    id: "ORD-1008",
    date: "2026-06-24",
    employeeId: "youssef",
    items: [
      { productId: "crest-console", quantity: 2 },
      { productId: "metro-desk", quantity: 2 },
      { productId: "velvet-ottoman", quantity: 2 },
    ],
  },
  {
    id: "ORD-1009",
    date: "2026-06-25",
    employeeId: "salma",
    items: [
      { productId: "marble-table", quantity: 1 },
      { productId: "gloss-mirror", quantity: 4 },
    ],
  },
  {
    id: "ORD-1010",
    date: "2026-06-26",
    employeeId: "omar",
    items: [
      { productId: "haven-bed", quantity: 2 },
      { productId: "nora-chair", quantity: 1 },
    ],
  },
  {
    id: "ORD-1011",
    date: "2026-06-27",
    employeeId: "nour",
    items: [
      { productId: "geo-table", quantity: 1 },
      { productId: "luna-light", quantity: 6 },
      { productId: "velvet-ottoman", quantity: 3 },
    ],
  },
  {
    id: "ORD-1012",
    date: "2026-06-28",
    employeeId: "youssef",
    items: [
      { productId: "aria-sofa", quantity: 1 },
      { productId: "crest-console", quantity: 2 },
    ],
  },
  {
    id: "ORD-1013",
    date: "2026-06-29",
    employeeId: "salma",
    items: [
      { productId: "marble-table", quantity: 2 },
      { productId: "metro-desk", quantity: 1 },
    ],
  },
  {
    id: "ORD-1014",
    date: "2026-06-30",
    employeeId: "omar",
    items: [
      { productId: "gloss-mirror", quantity: 3 },
      { productId: "luna-light", quantity: 4 },
      { productId: "nora-chair", quantity: 2 },
    ],
  },
  {
    id: "ORD-1015",
    date: "2026-07-01",
    employeeId: "nour",
    items: [
      { productId: "haven-bed", quantity: 1 },
      { productId: "geo-table", quantity: 2 },
    ],
  },
  {
    id: "ORD-1016",
    date: "2026-07-02",
    employeeId: "youssef",
    items: [
      { productId: "aria-sofa", quantity: 2 },
      { productId: "velvet-ottoman", quantity: 5 },
    ],
  },
  {
    id: "ORD-1017",
    date: "2026-07-03",
    employeeId: "salma",
    items: [
      { productId: "marble-table", quantity: 1 },
      { productId: "crest-console", quantity: 3 },
      { productId: "luna-light", quantity: 3 },
    ],
  },
  {
    id: "ORD-1018",
    date: "2026-07-04",
    employeeId: "omar",
    items: [
      { productId: "metro-desk", quantity: 3 },
      { productId: "gloss-mirror", quantity: 2 },
    ],
  },
  {
    id: "ORD-1019",
    date: "2026-07-05",
    employeeId: "nour",
    items: [
      { productId: "geo-table", quantity: 2 },
      { productId: "nora-chair", quantity: 2 },
      { productId: "luna-light", quantity: 4 },
    ],
  },
];

const expenses: AnalyticsExpense[] = [
  ...historicalMonths.flatMap((month, index) => [
    {
      id: `HIST-RENT-${month}`,
      date: `${month}-03`,
      category: "Rent",
      amount: 11800 + (index % 5) * 650,
    },
    {
      id: `HIST-MKT-${month}`,
      date: `${month}-12`,
      category: "Marketing",
      amount: 3600 + (index % 7) * 420,
    },
    {
      id: `HIST-LOG-${month}`,
      date: `${month}-21`,
      category: "Logistics",
      amount: 4300 + (index % 6) * 510,
    },
  ]),
  { id: "EXP-01", date: "2026-06-17", category: "Rent", amount: 14500 },
  { id: "EXP-02", date: "2026-06-19", category: "Marketing", amount: 6200 },
  { id: "EXP-03", date: "2026-06-21", category: "Logistics", amount: 7800 },
  { id: "EXP-04", date: "2026-06-24", category: "Utilities", amount: 3600 },
  { id: "EXP-05", date: "2026-06-27", category: "Maintenance", amount: 5200 },
  { id: "EXP-06", date: "2026-06-30", category: "Payroll Support", amount: 12500 },
  { id: "EXP-07", date: "2026-07-02", category: "Marketing", amount: 4800 },
  { id: "EXP-08", date: "2026-07-04", category: "Logistics", amount: 6800 },
];

const currencyFormatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-EG", {
  maximumFractionDigits: 1,
});

const defaultAnalyticsDate = new Date();
const defaultAnalyticsYear = String(defaultAnalyticsDate.getFullYear());
const defaultAnalyticsMonth = String(defaultAnalyticsDate.getMonth() + 1).padStart(2, "0");
const defaultComparisonDate = new Date(
  defaultAnalyticsDate.getFullYear(),
  defaultAnalyticsDate.getMonth() - 1,
  1,
);
const defaultComparisonYear = String(defaultComparisonDate.getFullYear());
const defaultComparisonMonth = String(defaultComparisonDate.getMonth() + 1).padStart(2, "0");

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function getYearKey(date: string) {
  return date.slice(0, 4);
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");

  return `${month}/${day}/${year}`;
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-EG", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatChartLabel(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return String(Number(value.slice(8, 10)));
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return formatMonthLabel(value);
  }

  return value;
}

function getMonthDays(year: string, month: string) {
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

  return Array.from(
    { length: daysInMonth },
    (_, index) => `${year}-${month}-${String(index + 1).padStart(2, "0")}`,
  );
}

function shouldShowChartTick(index: number, total: number) {
  if (total <= 8) {
    return true;
  }

  const step = Math.ceil(total / 8);

  return index === 0 || index === total - 1 || index % step === 0;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function filterBreakdownRows(rows: BreakdownRow[], searchQuery: string, selectedDay: string) {
  const normalizedQuery = normalizeSearchText(searchQuery);

  return rows.filter((row) => {
    const matchesDay = selectedDay === "all" || row.date === selectedDay;
    const matchesSearch =
      normalizedQuery === "" ||
      normalizeSearchText(`${row.name} ${row.detail} ${formatDateLabel(row.date)}`).includes(
        normalizedQuery,
      );

    return matchesDay && matchesSearch;
  });
}

function productById(productId: string) {
  const product = products.find((item) => item.id === productId);

  if (!product) {
    throw new Error(`Missing analytics product: ${productId}`);
  }

  return product;
}

function employeeById(employeeId: string) {
  const employee = employees.find((item) => item.id === employeeId);

  if (!employee) {
    throw new Error(`Missing analytics employee: ${employeeId}`);
  }

  return employee;
}

function getOrderTotals(order: AnalyticsOrder) {
  return order.items.reduce(
    (totals, item) => {
      const product = productById(item.productId);
      const revenue = product.salePrice * item.quantity;
      const cost = product.unitCost * item.quantity;

      return {
        revenue: totals.revenue + revenue,
        cost: totals.cost + cost,
        profit: totals.profit + revenue - cost,
        volume: totals.volume + item.quantity,
      };
    },
    { revenue: 0, cost: 0, profit: 0, volume: 0 },
  );
}

function toPointPath(values: number[], width: number, height: number) {
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const xStep = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * xStep;
      const y = height - ((value - minValue) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function LineChart({
  data,
  valueKey,
  color,
  label,
}: {
  data: DailyMetric[];
  valueKey: "profit" | "revenue";
  color: string;
  label: string;
}) {
  const width = 680;
  const height = 210;
  const values = data.map((item) => item[valueKey]);
  const path = toPointPath(values, width, height);
  const maxValue = Math.max(...values, 1);
  const hasMultiplePoints = data.length > 1;

  return (
    <div className="h-72 w-full">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>Peak {formatCurrency(maxValue)}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height + 34}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label={label}
      >
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={(height / 3) * line}
            y2={(height / 3) * line}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}
        {hasMultiplePoints ? (
          <>
            <path
              d={`${path} L ${width} ${height} L 0 ${height} Z`}
              fill={color}
              opacity="0.12"
            />
            <path d={path} fill="none" stroke={color} strokeWidth="4" />
          </>
        ) : null}
        {values.map((value, index) => {
          const x = hasMultiplePoints ? (width / (data.length - 1)) * index : width / 2;
          const y = height - (value / maxValue) * height;

          return (
            <circle
              key={`${data[index].label}-${value}`}
              cx={x}
              cy={Number.isFinite(y) ? y : height}
              r="4"
              fill="#ffffff"
              stroke={color}
              strokeWidth="3"
            >
              <title>
                {`${formatDateLabel(data[index].label)} | ${label}: ${formatCurrency(value)}`}
              </title>
            </circle>
          );
        })}
        {data.map((item, index) => {
          if (!shouldShowChartTick(index, data.length)) {
            return null;
          }

          const x = hasMultiplePoints ? (width / (data.length - 1)) * index : width / 2;

          return (
            <text
              key={item.label}
              x={x}
              y={height + 28}
              textAnchor="middle"
              className="fill-slate-500 text-[11px]"
            >
              {formatChartLabel(item.label)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BarChart({ data }: { data: DailyMetric[] }) {
  const maxVolume = Math.max(...data.map((item) => item.volume), 1);
  const chartHeight = 224;

  return (
    <div className="flex h-72 items-end gap-2 border-b border-slate-200 pb-8">
      {data.map((item) => (
        <div
          key={item.label}
          className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
        >
          <div className="absolute bottom-full mb-2 hidden rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
            {item.volume} units
          </div>
          <div
            className="w-full rounded-t bg-cyan-600 transition-colors group-hover:bg-cyan-500"
            title={`${formatDateLabel(item.label)} | ${item.volume} units`}
            style={{
              height: `${Math.max((item.volume / maxVolume) * chartHeight, 12)}px`,
            }}
          />
          {shouldShowChartTick(data.indexOf(item), data.length) ? (
            <span className="absolute top-full mt-2 max-w-20 text-center text-[11px] text-slate-500">
              {formatChartLabel(item.label)}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: IconName;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <Icon icon={icon} size={20} />
      </span>
      <div>
        <H2 className="m-0 text-xl text-slate-950">{title}</H2>
        <p className="m-0 mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function BreakEvenChart({
  revenue,
  variableCost,
  expensesTotal,
}: {
  revenue: number;
  variableCost: number;
  expensesTotal: number;
}) {
  const totalCost = variableCost + expensesTotal;
  const maxValue = Math.max(revenue, totalCost, 1);
  const rows = [
    { label: "Revenue", value: revenue, color: "bg-emerald-600" },
    { label: "Product cost", value: variableCost, color: "bg-amber-500" },
    { label: "Expenses", value: expensesTotal, color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">{row.label}</span>
            <span className="text-slate-500">{formatCurrency(row.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${row.color}`}
              style={{ width: `${Math.max((row.value / maxValue) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
      <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Break-even gap:{" "}
        <strong className={revenue >= totalCost ? "text-emerald-700" : "text-rose-700"}>
          {formatCurrency(revenue - totalCost)}
        </strong>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  helper,
  icon,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  icon: IconName;
  tone: string;
}) {
  return (
    <Card elevation={Elevation.ONE} className="min-h-36 rounded-lg border border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-sm text-slate-500">{title}</p>
          <p className="m-0 mt-3 text-2xl font-bold text-slate-950">{value}</p>
          <p className="m-0 mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon icon={icon} size={22} />
        </span>
      </div>
    </Card>
  );
}

function RankingList({
  title,
  icon,
  items,
  formatter,
}: {
  title: string;
  icon: IconName;
  items: RankedItem[];
  formatter: (value: number) => string;
}) {
  return (
    <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
      <div className="mb-4 flex items-center gap-2">
        <Icon icon={icon} size={18} />
        <H3 className="m-0 text-lg">{title}</H3>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded border border-slate-100 bg-white p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-sm font-semibold text-slate-600">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="m-0 truncate font-semibold text-slate-900">{item.name}</p>
                <p className="m-0 text-sm text-slate-500">{item.detail}</p>
              </div>
            </div>
            <div className="shrink-0 text-left">
              <p className="m-0 font-semibold text-slate-900">{formatter(item.value)}</p>
              <p className="m-0 text-xs text-slate-500">{item.helper}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BreakdownTable({
  rows,
  maxHeightClass = "max-h-96",
}: {
  rows: BreakdownRow[];
  maxHeightClass?: string;
}) {
  return (
    <div className={`${maxHeightClass} overflow-auto rounded border border-slate-200`}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold">Date</th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold">Name</th>
            <th className="border-b border-slate-200 px-4 py-3 font-semibold">Detail</th>
            <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-slate-600">{formatDateLabel(row.date)}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
              <td className="px-4 py-3 text-slate-500">{row.detail}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                {formatCurrency(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">No entries found.</div>
      ) : null}
    </div>
  );
}

function BreakdownCard({
  title,
  icon,
  rows,
  total,
}: {
  title: string;
  icon: IconName;
  rows: BreakdownRow[];
  total: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState("all");
  const filteredRows = filterBreakdownRows(rows, searchQuery, selectedDay);
  const previewRows = rows.slice(0, 5);
  const dayOptions = [
    { label: "All days", value: "all" },
    ...Array.from(new Set(rows.map((row) => row.date)))
      .sort()
      .map((date) => ({
        label: formatDateLabel(date),
        value: date,
      })),
  ];

  return (
    <>
      <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Icon icon={icon} size={18} />
            <div>
              <H3 className="m-0 text-lg">{title}</H3>
              <p className="m-0 mt-1 text-sm text-slate-500">
                {rows.length} entries | {formatCurrency(total)}
              </p>
            </div>
          </div>
          <Button
            icon="maximize"
            text="Expand"
            onClick={() => setIsModalOpen(true)}
          />
        </div>
        <BreakdownTable rows={previewRows} maxHeightClass="max-h-80" />
        {rows.length > previewRows.length ? (
          <p className="m-0 mt-3 text-sm text-slate-500">
            Showing first {previewRows.length} entries. Expand to view and filter the full month.
          </p>
        ) : null}
      </Card>

      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        icon={icon}
        className="w-[min(980px,calc(100vw-32px))]"
      >
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-sm text-slate-500">
              {filteredRows.length} of {rows.length} entries | {formatCurrency(total)}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <InputGroup
                leftIcon="search"
                placeholder="Search by name or detail"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
              />
              <HTMLSelect
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.currentTarget.value)}
                options={dayOptions}
              />
            </div>
          </div>
          <BreakdownTable rows={filteredRows} maxHeightClass="max-h-[60vh]" />
        </div>
      </Dialog>
    </>
  );
}

function buildMonthAnalytics(selectedYear: string, selectedMonth: string) {
  const selectedMonthKey = `${selectedYear}-${selectedMonth}`;
  const filteredOrders = orders.filter((order) => getMonthKey(order.date) === selectedMonthKey);
  const filteredExpenses = expenses.filter(
    (expense) => getMonthKey(expense.date) === selectedMonthKey,
  );
  const productStats = new Map<
    string,
    {
      product: AnalyticsProduct;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
    }
  >();
  const categoryStats = new Map<
    string,
    { quantity: number; revenue: number; cost: number; profit: number }
  >();
  const employeeStats = new Map<
    string,
    { employee: AnalyticsEmployee; orders: number; revenue: number; profit: number }
  >();
  const dailyStats = new Map<string, DailyMetric>();
  const profitBreakdownRows: BreakdownRow[] = [];
  const expenseBreakdownRows: BreakdownRow[] = filteredExpenses.map((expense) => ({
    id: expense.id,
    date: expense.date,
    name: expense.category,
    detail: "Operating expense",
    amount: expense.amount,
  }));

  for (const day of getMonthDays(selectedYear, selectedMonth)) {
    dailyStats.set(day, {
      label: day,
      revenue: 0,
      cost: 0,
      profit: 0,
      volume: 0,
      expenses: 0,
    });
  }

  for (const order of filteredOrders) {
    const orderTotals = getOrderTotals(order);
    const employee = employeeById(order.employeeId);
    const employeeCurrent =
      employeeStats.get(order.employeeId) ?? {
        employee,
        orders: 0,
        revenue: 0,
        profit: 0,
      };

    employeeCurrent.orders += 1;
    employeeCurrent.revenue += orderTotals.revenue;
    employeeCurrent.profit += orderTotals.profit;
    employeeStats.set(order.employeeId, employeeCurrent);

    const dailyCurrent =
      dailyStats.get(order.date) ?? {
        label: order.date,
        revenue: 0,
        cost: 0,
        profit: 0,
        volume: 0,
        expenses: 0,
      };

    dailyCurrent.revenue += orderTotals.revenue;
    dailyCurrent.cost += orderTotals.cost;
    dailyCurrent.profit += orderTotals.profit;
    dailyCurrent.volume += orderTotals.volume;
    dailyStats.set(order.date, dailyCurrent);

    for (const item of order.items) {
      const product = productById(item.productId);
      const revenue = product.salePrice * item.quantity;
      const cost = product.unitCost * item.quantity;
      const profit = revenue - cost;
      profitBreakdownRows.push({
        id: `${order.id}-${product.id}`,
        date: order.date,
        name: product.name,
        detail: `${item.quantity} units | ${product.category} | ${employee.name}`,
        amount: profit,
      });

      const productCurrent =
        productStats.get(product.id) ?? {
          product,
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };

      productCurrent.quantity += item.quantity;
      productCurrent.revenue += revenue;
      productCurrent.cost += cost;
      productCurrent.profit += profit;
      productStats.set(product.id, productCurrent);

      const categoryCurrent =
        categoryStats.get(product.category) ?? {
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };

      categoryCurrent.quantity += item.quantity;
      categoryCurrent.revenue += revenue;
      categoryCurrent.cost += cost;
      categoryCurrent.profit += profit;
      categoryStats.set(product.category, categoryCurrent);
    }
  }

  for (const expense of filteredExpenses) {
    const dailyCurrent =
      dailyStats.get(expense.date) ?? {
        label: expense.date,
        revenue: 0,
        cost: 0,
        profit: 0,
        volume: 0,
        expenses: 0,
      };

    dailyCurrent.expenses += expense.amount;
    dailyStats.set(expense.date, dailyCurrent);
  }

  const productRows = Array.from(productStats.values());
  const categoryRows = Array.from(categoryStats.entries());
  const employeeRows = Array.from(employeeStats.values());
  const dailyRows = Array.from(dailyStats.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const totalRevenue = productRows.reduce((sum, item) => sum + item.revenue, 0);
  const productCost = productRows.reduce((sum, item) => sum + item.cost, 0);
  const grossProfit = productRows.reduce((sum, item) => sum + item.profit, 0);
  const expensesTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = grossProfit - expensesTotal;
  const totalVolume = productRows.reduce((sum, item) => sum + item.quantity, 0);
  const averageOrderValue = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;
  const averageOrderVolume = filteredOrders.length ? totalVolume / filteredOrders.length : 0;
  const emptyProductStat = {
    product: products[0],
    quantity: 0,
    revenue: 0,
    cost: 0,
    profit: 0,
  };
  const emptyEmployeeStat = {
    employee: employees[0],
    orders: 0,
    revenue: 0,
    profit: 0,
  };
  const bestSellingProduct = productRows.reduce(
    (best, item) => (item.quantity > best.quantity ? item : best),
    productRows[0] ?? emptyProductStat,
  );
  const highestProfitItem = productRows.reduce(
    (best, item) => (item.profit > best.profit ? item : best),
    productRows[0] ?? emptyProductStat,
  );
  const bestEmployee = employeeRows.reduce(
    (best, item) => (item.profit > best.profit ? item : best),
    employeeRows[0] ?? emptyEmployeeStat,
  );

  return {
    orderCount: filteredOrders.length,
    totalRevenue,
    productCost,
    grossProfit,
    expensesTotal,
    netProfit,
    totalVolume,
    averageOrderValue,
    averageOrderVolume,
    netMargin: totalRevenue ? (netProfit / totalRevenue) * 100 : 0,
    bestSellingProduct,
    highestProfitItem,
    bestEmployee,
    dailyRows,
    topProducts: productRows
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        detail: item.product.category,
        value: item.quantity,
        helper: `${formatCurrency(item.revenue)} revenue`,
      })),
    topCategories: categoryRows
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(([category, item]) => ({
        id: category,
        name: category,
        detail: `${item.quantity} units sold`,
        value: item.profit,
        helper: `${formatCurrency(item.revenue)} revenue`,
      })),
    profitItems: productRows
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        detail: `${item.quantity} units | ${item.product.category}`,
        value: item.profit,
        helper: `${item.revenue ? formatNumber((item.profit / item.revenue) * 100) : "0"}% margin`,
      })),
    employeeRanking: employeeRows
      .sort((a, b) => b.profit - a.profit)
      .map((item) => ({
        id: item.employee.id,
        name: item.employee.name,
        detail: `${item.employee.role} | ${item.orders} orders`,
        value: item.profit,
        helper: `${formatCurrency(item.revenue)} sales`,
      })),
    expenseRows: Array.from(
      filteredExpenses.reduce<Map<string, number>>((map, expense) => {
        map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
        return map;
      }, new Map()),
    ),
    profitBreakdownRows: profitBreakdownRows.sort((a, b) => a.date.localeCompare(b.date)),
    expenseBreakdownRows: expenseBreakdownRows.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

type MonthAnalytics = ReturnType<typeof buildMonthAnalytics>;

function buildReportText(label: string, analytics: MonthAnalytics) {
  const lines = [
    `HomeStop Analytics Report`,
    `Period: ${label}`,
    ``,
    `Summary`,
    `Revenue: ${formatCurrency(analytics.totalRevenue)}`,
    `Gross profit: ${formatCurrency(analytics.grossProfit)}`,
    `Expenses: ${formatCurrency(analytics.expensesTotal)}`,
    `Net profit: ${formatCurrency(analytics.netProfit)}`,
    `Net margin: ${formatNumber(analytics.netMargin)}%`,
    `Orders: ${analytics.orderCount}`,
    `Units sold: ${analytics.totalVolume}`,
    `Average order value: ${formatCurrency(analytics.averageOrderValue)}`,
    `Average order volume: ${formatNumber(analytics.averageOrderVolume)} units`,
    ``,
    `Highlights`,
    `Best selling product: ${analytics.bestSellingProduct.product.name} (${analytics.bestSellingProduct.quantity} units)`,
    `Highest profit item: ${analytics.highestProfitItem.product.name} (${formatCurrency(
      analytics.highestProfitItem.profit,
    )})`,
    `Best employee: ${analytics.bestEmployee.employee.name} (${formatCurrency(
      analytics.bestEmployee.profit,
    )})`,
    ``,
    `Top Products`,
    ...analytics.topProducts.map(
      (item, index) => `${index + 1}. ${item.name} | ${item.value} units | ${item.helper}`,
    ),
    ``,
    `Profit Breakdown`,
    `Date,Name,Detail,Amount`,
    ...analytics.profitBreakdownRows.map(
      (row) => `${formatDateLabel(row.date)},${row.name},${row.detail},${formatCurrency(row.amount)}`,
    ),
    ``,
    `Expense Breakdown`,
    `Date,Name,Detail,Amount`,
    ...analytics.expenseBreakdownRows.map(
      (row) => `${formatDateLabel(row.date)},${row.name},${row.detail},${formatCurrency(row.amount)}`,
    ),
  ];

  return lines.join("\n");
}

function MonthSelectControls({
  year,
  month,
  yearOptions,
  monthOptions,
  onYearChange,
  onMonthChange,
}: {
  year: string;
  month: string;
  yearOptions: { label: string; value: string }[];
  monthOptions: { label: string; value: string }[];
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <HTMLSelect
        value={year}
        onChange={(event) => onYearChange(event.currentTarget.value)}
        options={yearOptions}
      />
      <HTMLSelect
        value={month}
        onChange={(event) => onMonthChange(event.currentTarget.value)}
        options={monthOptions}
      />
    </div>
  );
}

function CompareMonthPanel({
  label,
  analytics,
}: {
  label: string;
  analytics: MonthAnalytics;
}) {
  const breakEvenReached = analytics.totalRevenue >= analytics.productCost + analytics.expensesTotal;

  return (
    <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <H3 className="m-0 text-xl">{label}</H3>
          <p className="m-0 mt-1 text-sm text-slate-500">
            {analytics.orderCount} orders | {analytics.totalVolume} units sold
          </p>
        </div>
        <span
          className={`rounded px-3 py-2 text-sm font-medium ${
            breakEvenReached
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {breakEvenReached ? "Break-even reached" : "Below break-even"}
        </span>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {[
          ["Revenue", formatCurrency(analytics.totalRevenue)],
          ["Net profit", formatCurrency(analytics.netProfit)],
          ["Expenses", formatCurrency(analytics.expensesTotal)],
          ["AOV", formatCurrency(analytics.averageOrderValue)],
        ].map(([title, value]) => (
          <div key={title} className="rounded border border-slate-200 bg-slate-50 p-3">
            <p className="m-0 text-xs text-slate-500">{title}</p>
            <p className="m-0 mt-1 text-lg font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded border border-slate-200 p-3">
        <p className="m-0 text-sm text-slate-500">Best seller</p>
        <p className="m-0 mt-1 font-semibold text-slate-900">
          {analytics.bestSellingProduct.product.name}
        </p>
        <p className="m-0 text-sm text-slate-500">
          {analytics.bestSellingProduct.quantity} units |{" "}
          {formatCurrency(analytics.bestSellingProduct.revenue)}
        </p>
      </div>

      <LineChart
        data={analytics.dailyRows}
        valueKey="profit"
        color="#2563eb"
        label="Daily profit"
      />
    </Card>
  );
}

export default function StatisticsPage() {
  const [selectedYear, setSelectedYear] = useState(defaultAnalyticsYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultAnalyticsMonth);
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonYear, setComparisonYear] = useState(defaultComparisonYear);
  const [comparisonMonth, setComparisonMonth] = useState(defaultComparisonMonth);
  const selectedMonthKey = `${selectedYear}-${selectedMonth}`;
  const comparisonMonthKey = `${comparisonYear}-${comparisonMonth}`;

  const yearOptions = useMemo(() => {
    const dates = [...orders.map((order) => order.date), ...expenses.map((expense) => expense.date)];
    const years = Array.from(new Set([...dates.map(getYearKey), defaultAnalyticsYear]))
      .sort()
      .reverse();

    return years.map((year) => ({ label: year, value: year }));
  }, []);

  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");

    return {
      label: new Intl.DateTimeFormat("en-EG", { month: "long" }).format(
        new Date(Number(selectedYear), index, 1),
      ),
      value: month,
    };
  });

  const filteredOrders = useMemo(
    () => orders.filter((order) => getMonthKey(order.date) === selectedMonthKey),
    [selectedMonthKey],
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((expense) => getMonthKey(expense.date) === selectedMonthKey),
    [selectedMonthKey],
  );

  const analytics = useMemo(() => {
    const productStats = new Map<
      string,
      {
        product: AnalyticsProduct;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();
    const categoryStats = new Map<
      string,
      { quantity: number; revenue: number; cost: number; profit: number }
    >();
    const employeeStats = new Map<
      string,
      { employee: AnalyticsEmployee; orders: number; revenue: number; profit: number }
    >();
    const dailyStats = new Map<string, DailyMetric>();
    const profitBreakdownRows: BreakdownRow[] = [];
    const expenseBreakdownRows: BreakdownRow[] = filteredExpenses.map((expense) => ({
      id: expense.id,
      date: expense.date,
      name: expense.category,
      detail: "Operating expense",
      amount: expense.amount,
    }));

    for (const day of getMonthDays(selectedYear, selectedMonth)) {
      dailyStats.set(day, {
        label: day,
        revenue: 0,
        cost: 0,
        profit: 0,
        volume: 0,
        expenses: 0,
      });
    }

    for (const order of filteredOrders) {
      const orderTotals = getOrderTotals(order);
      const employee = employeeById(order.employeeId);
      const employeeCurrent =
        employeeStats.get(order.employeeId) ?? {
          employee,
          orders: 0,
          revenue: 0,
          profit: 0,
        };

      employeeCurrent.orders += 1;
      employeeCurrent.revenue += orderTotals.revenue;
      employeeCurrent.profit += orderTotals.profit;
      employeeStats.set(order.employeeId, employeeCurrent);

      const dailyCurrent =
        dailyStats.get(order.date) ?? {
          label: order.date,
          revenue: 0,
          cost: 0,
          profit: 0,
          volume: 0,
          expenses: 0,
        };

      dailyCurrent.revenue += orderTotals.revenue;
      dailyCurrent.cost += orderTotals.cost;
      dailyCurrent.profit += orderTotals.profit;
      dailyCurrent.volume += orderTotals.volume;
      dailyStats.set(order.date, dailyCurrent);

      for (const item of order.items) {
        const product = productById(item.productId);
        const revenue = product.salePrice * item.quantity;
        const cost = product.unitCost * item.quantity;
        const profit = revenue - cost;
        profitBreakdownRows.push({
          id: `${order.id}-${product.id}`,
          date: order.date,
          name: product.name,
          detail: `${item.quantity} units | ${product.category} | ${employee.name}`,
          amount: profit,
        });
        const productCurrent =
          productStats.get(product.id) ?? {
            product,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };

        productCurrent.quantity += item.quantity;
        productCurrent.revenue += revenue;
        productCurrent.cost += cost;
        productCurrent.profit += profit;
        productStats.set(product.id, productCurrent);

        const categoryCurrent =
          categoryStats.get(product.category) ?? {
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };

        categoryCurrent.quantity += item.quantity;
        categoryCurrent.revenue += revenue;
        categoryCurrent.cost += cost;
        categoryCurrent.profit += profit;
        categoryStats.set(product.category, categoryCurrent);
      }
    }

    for (const expense of filteredExpenses) {
      const dailyCurrent =
        dailyStats.get(expense.date) ?? {
          label: expense.date,
          revenue: 0,
          cost: 0,
          profit: 0,
          volume: 0,
          expenses: 0,
        };

      dailyCurrent.expenses += expense.amount;
      dailyStats.set(expense.date, dailyCurrent);
    }

    const productRows = Array.from(productStats.values());
    const categoryRows = Array.from(categoryStats.entries());
    const employeeRows = Array.from(employeeStats.values());
    const dailyRows = Array.from(dailyStats.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    const totalRevenue = productRows.reduce((sum, item) => sum + item.revenue, 0);
    const productCost = productRows.reduce((sum, item) => sum + item.cost, 0);
    const grossProfit = productRows.reduce((sum, item) => sum + item.profit, 0);
    const expensesTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = grossProfit - expensesTotal;
    const totalVolume = productRows.reduce((sum, item) => sum + item.quantity, 0);
    const averageOrderValue = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;
    const averageOrderVolume = filteredOrders.length ? totalVolume / filteredOrders.length : 0;
    const emptyProductStat = {
      product: products[0],
      quantity: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    };
    const emptyEmployeeStat = {
      employee: employees[0],
      orders: 0,
      revenue: 0,
      profit: 0,
    };
    const bestSellingProduct = productRows.reduce(
      (best, item) => (item.quantity > best.quantity ? item : best),
      productRows[0] ?? emptyProductStat,
    );
    const highestProfitItem = productRows.reduce(
      (best, item) => (item.profit > best.profit ? item : best),
      productRows[0] ?? emptyProductStat,
    );
    const bestEmployee = employeeRows.reduce(
      (best, item) => (item.profit > best.profit ? item : best),
      employeeRows[0] ?? emptyEmployeeStat,
    );

    return {
      orderCount: filteredOrders.length,
      totalRevenue,
      productCost,
      grossProfit,
      expensesTotal,
      netProfit,
      totalVolume,
      averageOrderValue,
      averageOrderVolume,
      netMargin: totalRevenue ? (netProfit / totalRevenue) * 100 : 0,
      bestSellingProduct,
      highestProfitItem,
      bestEmployee,
      dailyRows,
      topProducts: productRows
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map((item) => ({
          id: item.product.id,
          name: item.product.name,
          detail: item.product.category,
          value: item.quantity,
          helper: `${formatCurrency(item.revenue)} revenue`,
        })),
      topCategories: categoryRows
        .sort(([, a], [, b]) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(([category, item]) => ({
          id: category,
          name: category,
          detail: `${item.quantity} units sold`,
          value: item.profit,
          helper: `${formatCurrency(item.revenue)} revenue`,
        })),
      profitItems: productRows
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5)
        .map((item) => ({
          id: item.product.id,
          name: item.product.name,
          detail: `${item.quantity} units | ${item.product.category}`,
          value: item.profit,
          helper: `${formatNumber((item.profit / item.revenue) * 100)}% margin`,
        })),
      employeeRanking: employeeRows
        .sort((a, b) => b.profit - a.profit)
        .map((item) => ({
          id: item.employee.id,
          name: item.employee.name,
          detail: `${item.employee.role} | ${item.orders} orders`,
          value: item.profit,
          helper: `${formatCurrency(item.revenue)} sales`,
        })),
      expenseRows: Array.from(
        filteredExpenses.reduce<Map<string, number>>((map, expense) => {
          map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount);
          return map;
        }, new Map()),
      ),
      profitBreakdownRows: profitBreakdownRows.sort((a, b) => a.date.localeCompare(b.date)),
      expenseBreakdownRows: expenseBreakdownRows.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [filteredExpenses, filteredOrders, selectedMonth, selectedYear]);

  const breakEvenReached = analytics.totalRevenue >= analytics.productCost + analytics.expensesTotal;
  const comparisonAnalytics = useMemo(
    () => buildMonthAnalytics(comparisonYear, comparisonMonth),
    [comparisonMonth, comparisonYear],
  );
  const selectedPeriodLabel = formatMonthLabel(selectedMonthKey);
  const comparisonPeriodLabel = formatMonthLabel(comparisonMonthKey);
  const handleDownloadReport = () => {
    const reportText = buildReportText(selectedPeriodLabel, analytics);
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `homestop-analytics-${selectedMonthKey}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div dir="ltr" className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3 text-slate-700">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Icon icon="timeline-area-chart" size={26} />
            </span>
            <div>
              <H1 className="m-0 text-3xl text-slate-950">Analytics</H1>
              <p className="m-0 mt-1 text-sm text-slate-500">
                Sales, profit, expenses, volume, and employee performance.
              </p>
            </div>
          </div>
        </div>
        <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  breakEvenReached ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <div>
                <p className="m-0 text-sm text-slate-500">Break-even status</p>
                <p className="m-0 font-semibold text-slate-900">
                  {breakEvenReached ? "Reached" : "Not reached"}
                </p>
              </div>
            </div>
            <Button icon="download" text="Download report" onClick={handleDownloadReport} />
            <Button
              icon="comparison"
              text={compareMode ? "Collapse comparison" : "Compare months"}
              intent={compareMode ? "primary" : undefined}
              onClick={() => setCompareMode((value) => !value)}
            />
          </div>
        </Card>
      </section>

      <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader
            title="Analytics period"
            description="The dashboard shows one month at a time. Choose the year and month to update every metric."
            icon="filter"
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-500">Showing</span>
            <HTMLSelect
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.currentTarget.value)}
              options={yearOptions}
            />
            <HTMLSelect
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.currentTarget.value)}
              options={monthOptions}
            />
            <span className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              {selectedPeriodLabel}
            </span>
          </div>
        </div>
      </Card>

      <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader
            title="Month comparison"
            description="Compare the selected analytics month against another month in a split-screen view."
            icon="comparison"
          />
          <Button
            icon={compareMode ? "chevron-up" : "chevron-down"}
            text={compareMode ? "Collapse" : "Expand"}
            onClick={() => setCompareMode((value) => !value)}
          />
        </div>

        {compareMode ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-4 rounded border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="m-0 mb-2 text-xs font-semibold uppercase text-slate-500">
                  Primary month
                </p>
                <MonthSelectControls
                  year={selectedYear}
                  month={selectedMonth}
                  yearOptions={yearOptions}
                  monthOptions={monthOptions}
                  onYearChange={setSelectedYear}
                  onMonthChange={setSelectedMonth}
                />
              </div>
              <div>
                <p className="m-0 mb-2 text-xs font-semibold uppercase text-slate-500">
                  Compare with
                </p>
                <MonthSelectControls
                  year={comparisonYear}
                  month={comparisonMonth}
                  yearOptions={yearOptions}
                  monthOptions={monthOptions}
                  onYearChange={setComparisonYear}
                  onMonthChange={setComparisonMonth}
                />
              </div>
            </div>

            <section className="grid gap-4 xl:grid-cols-2">
              <CompareMonthPanel label={selectedPeriodLabel} analytics={analytics} />
              <CompareMonthPanel label={comparisonPeriodLabel} analytics={comparisonAnalytics} />
            </section>
          </div>
        ) : null}
      </Card>

      <section className="space-y-4">
        <SectionHeader
          title="Performance summary"
          description="Core financial and order metrics for the selected period."
          icon="dashboard"
        />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total profit"
          value={formatCurrency(analytics.netProfit)}
          helper={`${formatNumber(analytics.netMargin)}% net margin`}
          icon="dollar"
          tone="bg-emerald-100 text-emerald-700"
        />
        <MetricCard
          title="Expenses"
          value={formatCurrency(analytics.expensesTotal)}
          helper={`${formatCurrency(analytics.grossProfit)} gross profit`}
          icon="credit-card"
          tone="bg-rose-100 text-rose-700"
        />
        <MetricCard
          title="Average order value"
          value={formatCurrency(analytics.averageOrderValue)}
          helper={`${filteredOrders.length} orders tracked`}
          icon="shopping-cart"
          tone="bg-sky-100 text-sky-700"
        />
        <MetricCard
          title="Average order volume"
          value={`${formatNumber(analytics.averageOrderVolume)} units`}
          helper={`${analytics.totalVolume} total units sold`}
          icon="layers"
          tone="bg-amber-100 text-amber-700"
        />
      </section>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Business highlights"
          description="The strongest product, profit item, and employee in the selected period."
          icon="star"
        />
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          title="Best selling product"
          value={analytics.bestSellingProduct.product.name}
          helper={`${analytics.bestSellingProduct.quantity} units | ${formatCurrency(
            analytics.bestSellingProduct.revenue,
          )}`}
          icon="star"
          tone="bg-indigo-100 text-indigo-700"
        />
        <MetricCard
          title="Highest profit item"
          value={analytics.highestProfitItem.product.name}
          helper={`${formatCurrency(analytics.highestProfitItem.profit)} profit`}
          icon="predictive-analysis"
          tone="bg-emerald-100 text-emerald-700"
        />
        <MetricCard
          title="Best employee"
          value={analytics.bestEmployee.employee.name}
          helper={`${formatCurrency(analytics.bestEmployee.profit)} profit generated`}
          icon="person"
          tone="bg-violet-100 text-violet-700"
        />
      </section>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Trends"
          description="Daily profit and volume for the selected month."
          icon="timeline-line-chart"
        />
      <section className="grid gap-4 xl:grid-cols-2">
        <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <H2 className="m-0 text-xl">Daily profit</H2>
              <p className="m-0 mt-1 text-sm text-slate-500">
                Gross profit before operating expenses.
              </p>
            </div>
            <span className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              {selectedPeriodLabel}
            </span>
          </div>
          <LineChart
            data={analytics.dailyRows}
            valueKey="profit"
            color="#059669"
            label="Gross profit"
          />
        </Card>

        <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <H2 className="m-0 text-xl">Daily volume</H2>
              <p className="m-0 mt-1 text-sm text-slate-500">
                Units sold across all categories.
              </p>
            </div>
            <span className="rounded bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              {selectedPeriodLabel}
            </span>
          </div>
          <BarChart data={analytics.dailyRows} />
        </Card>
      </section>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Costs and break-even"
          description="Compare revenue, product cost, and operating expenses."
          icon="comparison"
        />
      <section className="grid gap-4 xl:grid-cols-3">
        <Card elevation={Elevation.ONE} className="rounded-lg border border-slate-200">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <H2 className="m-0 text-xl">Break-even chart</H2>
              <p className="m-0 mt-1 text-sm text-slate-500">
                Revenue compared with product cost and operating expenses.
              </p>
            </div>
            <Icon icon="comparison" size={22} />
          </div>
          <BreakEvenChart
            revenue={analytics.totalRevenue}
            variableCost={analytics.productCost}
            expensesTotal={analytics.expensesTotal}
          />
        </Card>

        <BreakdownCard
          title="Profit breakdown"
          icon="series-derived"
          rows={analytics.profitBreakdownRows}
          total={analytics.grossProfit}
        />
        <BreakdownCard
          title="Expense breakdown"
          icon="pie-chart"
          rows={analytics.expenseBreakdownRows}
          total={analytics.expensesTotal}
        />
      </section>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Rankings"
          description="Top products, categories, profit generators, and employees."
          icon="chart"
        />
      <section className="grid gap-4 xl:grid-cols-2">
        <RankingList
          title="Best selling products"
          icon="chart"
          items={analytics.topProducts}
          formatter={(value) => `${value} units`}
        />
        <RankingList
          title="Best product by category"
          icon="grouped-bar-chart"
          items={analytics.topCategories}
          formatter={formatCurrency}
        />
        <RankingList
          title="Highest profit items"
          icon="series-derived"
          items={analytics.profitItems}
          formatter={formatCurrency}
        />
        <RankingList
          title="Employee performance"
          icon="people"
          items={analytics.employeeRanking}
          formatter={formatCurrency}
        />
      </section>
      </section>
    </div>
  );
}
