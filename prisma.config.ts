// prisma.config.ts
import "dotenv/config";

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "ts-node ./prisma/seed.ts",
  },
};