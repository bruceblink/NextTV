import {PrismaClient} from "@/generated/prisma"
import bcrypt from "bcryptjs"
import {customers, invoices, revenue, users} from "@/app/lib/placeholder-data"

const prisma = new PrismaClient()

async function seedUsers() {
    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10)
        await prisma.user_info.upsert({
            where: {email: user.email},
            update: {},
            create: {
                username: user.username,
                email: user.email,
                password: hashedPassword,
            },
        })
    }
}

async function seedCustomers() {
    for (const customer of customers) {
        await prisma.customers.upsert({
            where: {id: customer.id},
            update: {},
            create: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                image_url: customer.image_url,
            },
        })
    }
}

async function seedInvoices() {
    for (const invoice of invoices) {
        const exists = await prisma.invoices.findFirst({
            where: {
                customer_id: invoice.customer_id,
                date: invoice.date,
                amount: invoice.amount,
                status: invoice.status,
            },
        });

        if (!exists) {
            await prisma.invoices.create({
                data: {
                    customer_id: invoice.customer_id,
                    amount: invoice.amount,
                    status: invoice.status,
                    date: invoice.date,
                },
            });
        }
    }
}

async function seedRevenue() {
    for (const rev of revenue) {
        await prisma.revenue.upsert({
            where: {month: rev.month},
            update: {},
            create: {
                month: rev.month,
                revenue: rev.revenue,
            },
        })
    }
}


async function main() {
    console.log("💾 Seeding database...")
    await seedUsers()
    await seedCustomers()
    await seedInvoices()
    await seedRevenue()
    console.log("✅ Database seeding completed")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
