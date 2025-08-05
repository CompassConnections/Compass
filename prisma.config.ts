import path from "node:path";

import 'dotenv/config'; // <-- This loads your .env file before Prisma runs
import type {PrismaConfig} from "prisma";

export default {
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  // views: {
  //   path: path.join("prisma", "views"),
  // },
  // typedSql: {
  //   path: path.join("prisma", "queries"),
  // }
} satisfies PrismaConfig;