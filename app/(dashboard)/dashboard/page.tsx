import { syncCurrentClerkUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import DashboardServices, { type ServiceAction } from "./DashboardServices";

const services: ServiceAction[] = [
  {
    title: "مخزون المواد الخام",
    description: "متابعة كميات الخامات والتنبيه عند انخفاض المخزون.",
    href: "/raw_material_inventory",
    icon: "box",
    tone: "blue",
  },
  {
    title: "مخزون المنتجات",
    description: "عرض المنتجات الجاهزة ومراجعة الكميات المتاحة.",
    href: "/product_inventory",
    icon: "cube",
    tone: "orange",
  },
  {
    title: "الموظفين",
    description: "إدارة بيانات الموظفين ومتابعة معلوماتهم الأساسية.",
    href: "/employees",
    icon: "people",
    tone: "green",
  },
  {
    title: "المبيعات",
    description: "بحث سريع عن المنتجات وإنشاء طلبات جديدة من الهاتف.",
    href: "/sales",
    icon: "barcode",
    tone: "teal",
  },
  {
    title: "الأوردرات",
    description: "متابعة الطلبات الحالية وحالة تنفيذ كل أوردر.",
    href: "/orders",
    icon: "shopping-cart",
    tone: "violet",
  },
  {
    title: "إحصائيات",
    description: "قراءة ملخصات الأداء والأرقام المهمة للنظام.",
    href: "/statistics",
    icon: "timeline-area-chart",
    tone: "red",
  },
];

export default async function DashboardPage() {
  const appUser = await syncCurrentClerkUser();
  const employee = appUser?.email
    ? await prisma.employee.findUnique({
        where: {
          email: appUser.email,
        },
        select: {
          role: true,
          status: true,
        },
      })
    : null;

  const isSalesEmployee =
    appUser?.role === "EMPLOYEE" &&
    employee?.role === "SALES" &&
    employee.status === "ACTIVE";

  const availableServices = isSalesEmployee
    ? services.filter((service) => service.href === "/sales")
    : services;

  return <DashboardServices services={availableServices} />;
}
