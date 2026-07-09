"use client";

import { ActionIcon, UnstyledButton } from "@mantine/core";
import { Show, SignInButton, SignOutButton, UserAvatar } from "@clerk/nextjs";
import { Home, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DashboardShell({
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
            <Show when="signed-out">
              <SignInButton mode="modal">
                <UnstyledButton className="h-11 shrink-0 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  تسجيل الدخول
                </UnstyledButton>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <UserAvatar />
              <SignOutButton redirectUrl="/sign-in">
                <ActionIcon
                  aria-label="تسجيل الخروج"
                  radius="md"
                  size={42}
                  title="تسجيل الخروج"
                  variant="subtle"
                  className="shrink-0"
                >
                  <LogOut size={20} />
                </ActionIcon>
              </SignOutButton>
            </Show>

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
