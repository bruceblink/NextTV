import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import {customers, invoices, revenue, users} from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!);

async function seedUsers() {
    await sql`CREATE
    EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`
        CREATE TABLE IF NOT EXISTS user_info
        (
            id           BIGSERIAL PRIMARY KEY,
            email        VARCHAR(255) UNIQUE,
            username     VARCHAR(100) UNIQUE,
            password     TEXT, -- 本地登录密码哈希（可为空）
            display_name VARCHAR(255),
            avatar_url   TEXT,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `;

    return await Promise.all(
        users.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return sql`
                INSERT INTO user_info (username, email, password)
                VALUES (${user.username}, ${user.email}, ${hashedPassword}) ON CONFLICT (id) DO NOTHING;
            `;
        }),
    );
}

async function seedInvoices() {
    await sql`CREATE
    EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`
        CREATE TABLE IF NOT EXISTS invoices
        (
            id
            UUID
            DEFAULT
            uuid_generate_v4
        (
        ) PRIMARY KEY,
            customer_id UUID NOT NULL,
            amount INT NOT NULL,
            status VARCHAR
        (
            255
        ) NOT NULL,
            date DATE NOT NULL
            );
    `;

    return await Promise.all(
        invoices.map(
            (invoice) => sql`
                INSERT INTO invoices (customer_id, amount, status, date)
                VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status},
                        ${invoice.date}) ON CONFLICT (id) DO NOTHING;
            `,
        ),
    );
}

async function seedCustomers() {
    await sql`CREATE
    EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`
        CREATE TABLE IF NOT EXISTS customers
        (
            id
            UUID
            DEFAULT
            uuid_generate_v4
        (
        ) PRIMARY KEY,
            name VARCHAR
        (
            255
        ) NOT NULL,
            email VARCHAR
        (
            255
        ) NOT NULL,
            image_url VARCHAR
        (
            255
        ) NOT NULL
            );
    `;

    return await Promise.all(
        customers.map(
            (customer) => sql`
                INSERT INTO customers (id, name, email, image_url)
                VALUES (${customer.id}, ${customer.name}, ${customer.email},
                        ${customer.image_url}) ON CONFLICT (id) DO NOTHING;
            `,
        ),
    );
}

async function seedRevenue() {
    await sql`
        CREATE TABLE IF NOT EXISTS revenue
        (
            month
            VARCHAR
        (
            4
        ) NOT NULL UNIQUE,
            revenue INT NOT NULL
            );
    `;

    return await Promise.all(
        revenue.map(
            (rev) => sql`
                INSERT INTO revenue (month, revenue)
                VALUES (${rev.month}, ${rev.revenue}) ON CONFLICT (month) DO NOTHING;
            `,
        ),
    );
}

async function seedVideos() {

    return sql`
        CREATE TABLE IF NOT EXISTS video_info
        (
            id           BIGSERIAL PRIMARY KEY,
            title        VARCHAR(255) UNIQUE,
            rating       JSONB ,
            pic          TEXT, 
            is_new       BOOLEAN,
            uri          TEXT,
            episodes_info   TEXT,
            card_subtitle   TEXT,
            type          VARCHAR(128),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `;
}


export async function GET() {
    try {
        await sql.begin(() => [
            seedUsers(),
            seedCustomers(),
            seedInvoices(),
            seedRevenue(),
            seedVideos(),
        ]);
        return Response.json({message: 'Database seeded successfully'});
    } catch (error) {
        return Response.json({error}, {status: 500});
    }
}
