import {PrismaClient} from "@/generated/prisma"
import {withAccelerate} from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
    prisma?: ReturnType<typeof createPrismaClient>
}

function createPrismaClient() {
    return new PrismaClient().$extends(withAccelerate())
}

// 先检查 globalForPrisma.prisma，如果存在就直接复用，否则才创建
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export default prisma
