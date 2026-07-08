"use client";

import {
  ActionIcon,
  Avatar,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  ChevronDown,
  Home,
  LogOut,
  Settings,
  User,
  UserCog,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const signedInUser = {
  name: "مستخدم النظام",
  role: "مدير النظام",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-nowrap items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <Image
            src="/images/home_stop_logo.png"
            alt="HomeStop"
            width={128}
            height={55}
            className="h-auto w-16 shrink-0 sm:w-32"
            priority
          />

          <div className="flex min-w-0 flex-nowrap items-center justify-end gap-2 sm:gap-3">
            <Menu width={220} position="bottom-end" withArrow shadow="md">
              <Menu.Target>
                <UnstyledButton className="h-11 w-11 shrink-0 rounded-md border border-slate-200 bg-white px-1 transition-colors hover:bg-slate-50 sm:h-14 sm:w-56 sm:px-3">
                  <Group gap={8} wrap="nowrap" className="h-full min-w-0 justify-center sm:justify-start">
                    <Avatar color="gray" radius="xl" size={34} className="shrink-0">
                      <User size={18} />
                    </Avatar>
                    <div className="hidden min-w-0 flex-1 text-right sm:block">
                      <Text size="sm" fw={700} truncate>
                        {signedInUser.name}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {signedInUser.role}
                      </Text>
                    </div>
                    <ChevronDown size={16} className="hidden shrink-0 text-slate-500 sm:block" />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>الحساب</Menu.Label>
                <Menu.Item leftSection={<UserCog size={16} />}>
                  الملف الشخصي
                </Menu.Item>
                <Menu.Item leftSection={<Settings size={16} />}>
                  الإعدادات
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<LogOut size={16} />}>
                  تسجيل الخروج
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <ActionIcon
              aria-label="الرئيسية"
              component={Link}
              href="/dashboard"
              radius="md"
              size={42}
              title="الرئيسية"
              variant="subtle"
              className="shrink-0"
            >
              <Home size={20} />
            </ActionIcon>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </section>
    </main>
  );
}
