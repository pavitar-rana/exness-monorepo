import { prisma } from "../src/index.ts";

const seed = async () => {
  await prisma.user.create({
    data: {
      email: "ranapavitar14@gmail.com",
      name: "pavitar",
    },
  });
};

seed();
