import { syncCurrentClerkUser } from "@/lib/app-user";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await syncCurrentClerkUser();

  return <DashboardShell>{children}</DashboardShell>;
}
