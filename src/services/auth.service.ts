import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ServiceError } from "@/lib/service-error";
import type { z } from "zod";
import type { registerUserSchema } from "@/lib/validations/user";

type RegisterInput = z.infer<typeof registerUserSchema>;

export async function registerUser(input: RegisterInput) {
  const { name, email, password } = input;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new ServiceError("Email already in use", 409, "CONFLICT");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailVerified: new Date(),
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
          access_token: hashedPassword,
        },
      },
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
