"use server";

import { prisma } from "@repo/db";

const getUser = async ({ email }: { email: string }) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  console.log("user : ", user);

  if (!user) {
    return { message: "user not found" };
  }

  return { message: "user found", user };
};

export { getUser };
