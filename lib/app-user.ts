import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function syncCurrentClerkUser() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const firstName = user.firstName ?? email?.split("@")[0] ?? "Clerk";
  const lastName = user.lastName ?? "User";
  const phone = user.primaryPhoneNumber?.phoneNumber ?? `clerk:${user.id}`;

  const appUser = await prisma.appUser.upsert({
    where: {
      clerkId: user.id,
    },
    create: {
      clerkId: user.id,
      email,
      firstName,
      lastName,
      imageUrl: user.imageUrl,
    },
    update: {
      email,
      firstName,
      lastName,
      imageUrl: user.imageUrl,
    },
  });

  if (email) {
    await prisma.employee.upsert({
      where: {
        email,
      },
      create: {
        employeeCode: `CLK-${user.id}`,
        firstName,
        lastName,
        nationalId: `clerk:${user.id}`,
        phone,
        email,
        department: "Sales",
        position: "Sales Employee",
        salary: "0",
        hireDate: new Date(),
        notes: "Created automatically from Clerk sign-up.",
      },
      update: {
        firstName,
        lastName,
        phone,
      },
    });
  }

  return appUser;
}
