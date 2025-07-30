import 'server-only';

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from '@prisma/extension-accelerate'

// Create a typed extended client first
const prismaClient = new PrismaClient({ log: ['query'] }).$extends(withAccelerate())

// Use `typeof` to capture the correct extended type
type AcceleratedPrismaClient = typeof prismaClient

const globalForPrisma = global as unknown as { prisma: AcceleratedPrismaClient | undefined }

export const prisma = globalForPrisma.prisma || prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
