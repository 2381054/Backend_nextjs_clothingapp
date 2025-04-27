// src/lib/prisma.js
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export { prisma }
