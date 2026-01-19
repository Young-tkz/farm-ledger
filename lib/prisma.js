import { PrismaClient } from '@prisma/client'

// Use a global variable so we don't create too many connections during development
const globalForPrisma = global

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma