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

  const userData = {
    email,
    firstName,
    lastName,
    imageUrl: user.imageUrl,
  };

  const existingAppUser = email
    ? await prisma.appUser.findFirst({
        where: {
          OR: [{ clerkId: user.id }, { email }],
        },
      })
    : await prisma.appUser.findUnique({
        where: {
          clerkId: user.id,
        },
      });

  const appUser = existingAppUser
    ? await prisma.appUser.update({
        where: {
          app_user_id: existingAppUser.app_user_id,
        },
        data: {
          clerkId: user.id,
          ...userData,
        },
      })
    : await prisma.appUser.create({
        data: {
          clerkId: user.id,
          ...userData,
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
