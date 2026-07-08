export type EmployeeStatus = "active" | "onLeave" | "suspended";

export type EmployeeItem = {
  employeeCode: string;
  nationalId: string;
  name: string;
  salary: number;
  position: string;
  location: string;
  systemRole: string;
  status: EmployeeStatus;
  phone: string;
  email: string;
  hireDate: string;
  department: string;
  manager: string;
  hasSystemAccess: boolean;
  notes: string;
};

const names = [
  "أحمد محمود",
  "منى حسن",
  "كريم عادل",
  "سارة إبراهيم",
  "محمد سمير",
  "ياسمين فؤاد",
  "مصطفى علي",
  "ريم خالد",
  "حسام فتحي",
  "نورهان طارق",
  "عمر شريف",
  "دينا سامي",
  "محمود جمال",
  "هاجر ناصر",
  "أمنية عبد الله",
  "وليد أشرف",
  "ليلى مراد",
  "إسلام حمدي",
  "بسمة رامي",
  "شادي نبيل",
  "نجلاء مصطفى",
  "رامي يوسف",
  "مريم عادل",
  "خالد صبري",
];

const positions = [
  "مدير فرع",
  "محاسب",
  "مندوب مبيعات",
  "مشرف مخزن",
  "عامل مخزن",
  "عامل مصنع",
  "مسؤول مشتريات",
  "مسؤول خدمة عملاء",
  "فني إنتاج",
  "مدير عمليات",
];

const locations = [
  "الإدارة",
  "معرض القاهرة",
  "معرض الجيزة",
  "المخزن الرئيسي",
  "مصنع العبور",
  "فرع الإسكندرية",
];

const departments = [
  "الإدارة العامة",
  "الحسابات",
  "المبيعات",
  "المخازن",
  "الإنتاج",
  "خدمة العملاء",
  "المشتريات",
];

const systemRoles = [
  "مدير النظام",
  "محاسب",
  "مبيعات",
  "مدير",
  "عامل مخزن",
  "عامل مصنع",
  "بدون صلاحية",
];

const managers = [
  "أحمد محمود",
  "منى حسن",
  "كريم عادل",
  "سارة إبراهيم",
  "محمد سمير",
  "ياسمين فؤاد",
];

const notes = [
  "ملتزم بمواعيد الحضور والانصراف.",
  "يتابع طلبات العملاء اليومية.",
  "مسؤول عن جرد المخزون الأسبوعي.",
  "يمتلك خبرة قوية في تشغيل خطوط الإنتاج.",
  "يتولى مراجعة التقارير المالية.",
  "يحتاج إلى تجديد بيانات الملف الوظيفي.",
];

function getStatus(index: number): EmployeeStatus {
  if (index % 19 === 0) {
    return "suspended";
  }

  if (index % 8 === 0) {
    return "onLeave";
  }

  return "active";
}

export const employees: EmployeeItem[] = Array.from(
  { length: 72 },
  (_, index) => {
    const employeeNumber = index + 1;
    const systemRole = systemRoles[index % systemRoles.length];

    return {
      employeeCode: `EMP-${String(employeeNumber).padStart(4, "0")}`,
      nationalId: String(29801010000000 + employeeNumber * 13791),
      name: `${names[index % names.length]} ${String(employeeNumber).padStart(
        2,
        "0",
      )}`,
      salary: 6500 + (index % 12) * 1250 + Math.floor(index / 12) * 500,
      position: positions[index % positions.length],
      location: locations[index % locations.length],
      systemRole,
      status: getStatus(index),
      phone: `010${String(10000000 + employeeNumber * 7391).slice(0, 8)}`,
      email: `employee.${String(employeeNumber).padStart(3, "0")}@homestop.local`,
      hireDate: `202${index % 6}-${String((index % 12) + 1).padStart(
        2,
        "0",
      )}-${String((index % 26) + 1).padStart(2, "0")}`,
      department: departments[index % departments.length],
      manager: managers[index % managers.length],
      hasSystemAccess: systemRole !== "بدون صلاحية",
      notes: notes[index % notes.length],
    };
  },
);
