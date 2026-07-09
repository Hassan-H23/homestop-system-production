"use client";

import { Card, Group, SimpleGrid, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { H1, Icon, type IconName } from "@/app/components/mantine-ui";
import Link from "next/link";
import styles from "./dashboard.module.css";

export type ServiceAction = {
  title: string;
  description: string;
  href: string;
  icon: IconName;
  tone: string;
};

export default function DashboardServices({
  services,
}: {
  services: ServiceAction[];
}) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.titleBlock}>
          <H1 className={styles.title}>لوحة التحكم</H1>
          <p className={styles.subtitle}>اختر الخدمة التي تريد العمل عليها.</p>
        </div>
      </section>

      <Card withBorder radius="md" shadow="xs" className={styles.actionsCard}>
        <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
          <div>
            <Text fw={700} size="lg">
              خدمات النظام
            </Text>
          </div>
          <ThemeIcon variant="light" color="gray" radius="md" size={42}>
            <Icon icon="dashboard" size={22} />
          </ThemeIcon>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing={0}>
          {services.map((service) => (
            <UnstyledButton
              key={service.href}
              component={Link}
              href={service.href}
              className={styles.action}
              aria-label={service.title}
            >
              <ThemeIcon variant="light" color={service.tone} radius="md" size={42}>
                <Icon icon={service.icon} size={22} />
              </ThemeIcon>
              <Text fw={700} size="sm" mt="sm" className={styles.actionTitle}>
                {service.title}
              </Text>
              <Text size="xs" c="dimmed" mt={4} className={styles.actionDescription}>
                {service.description}
              </Text>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      </Card>
    </div>
  );
}
