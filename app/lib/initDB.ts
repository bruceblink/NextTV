// app/lib/initDB.ts
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { users, customers, invoices, revenue } from './placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!);

// -------------------- 模块级单例 --------------------
let initialized = false;

// -------------------- seed 函数 --------------------
async function seedUsers(tx: typeof sql) {
    await tx`
        CREATE TABLE IF NOT EXISTS user_info (
            id BIGSERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            username VARCHAR(100) UNIQUE,
            password TEXT,
            display_name VARCHAR(255),
            avatar_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
    `;
    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await tx`
            INSERT INTO user_info (username, email, password)
            VALUES (${user.username}, ${user.email}, ${hashedPassword})
                ON CONFLICT (email) DO NOTHING
        `;
    }
}

async function seedCustomers(tx: typeof sql) {
    await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
    await tx`
        CREATE TABLE IF NOT EXISTS customers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            image_url VARCHAR(255) NOT NULL
            );
    `;
    const [{ count }] = await tx<{ count: string }[]>`
        SELECT COUNT(*) as count FROM customers
    `;
    if (parseInt(count) === 0) {
        for (const customer of customers) {
            await tx`
                INSERT INTO customers (id, name, email, image_url)
                VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
            `;
        }
    }
}

async function seedInvoices(tx: typeof sql) {
    await tx`
        CREATE TABLE IF NOT EXISTS invoices (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            customer_id UUID NOT NULL,
            amount INT NOT NULL,
            status VARCHAR(255) NOT NULL,
            date DATE NOT NULL
            );
    `;
    const [{ count }] = await tx<{ count: string }[]>`
        SELECT COUNT(*) as count FROM invoices
    `;

    if (parseInt(count) === 0) {
        for (const invoice of invoices) {
            await tx`
                INSERT INTO invoices (customer_id, amount, status, date)
                VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
            `;
        }
    }
}

async function seedRevenue(tx: typeof sql) {
    await tx`
        CREATE TABLE IF NOT EXISTS revenue (
            month VARCHAR(4) NOT NULL UNIQUE,
            revenue INT NOT NULL
            );
    `;
    const [{ count }] = await tx<{ count: string }[]>`
        SELECT COUNT(*) as count FROM revenue
    `;

    if (parseInt(count) === 0) {
        for (const rev of revenue) {
            await tx`
                INSERT INTO revenue (month, revenue)
                VALUES (${rev.month}, ${rev.revenue})
            `;
        }
    }
}

async function seedVideos(tx: typeof sql) {
    await tx`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

    // 创建表
    await tx`
        CREATE TABLE IF NOT EXISTS video_info (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255),
            rating JSONB,
            pic JSONB,
            is_new BOOLEAN,
            uri TEXT,
            episodes_info TEXT,
            card_subtitle TEXT,
            type VARCHAR(128),
            date TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uniq_video_info UNIQUE (title, episodes_info)
            );
    `;

    // 创建或更新函数
    await tx`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = now();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `;

    // 创建触发器，如果不存在则创建
    await tx.unsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'update_video_info_updated_at'
            ) THEN
                CREATE TRIGGER update_video_info_updated_at
                BEFORE UPDATE ON video_info
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
            END IF;
        END
        $$;
    `);
}

// -------------------- 自动初始化函数 --------------------
export async function initDatabaseOnce() {
    if (initialized) return; // 已初始化过就直接返回
    initialized = true;

    console.log('💾 Database initialization started');

    try {
        await sql.begin(async (tx) => {
            await seedUsers(tx);
            await seedCustomers(tx);
            await seedInvoices(tx);
            await seedRevenue(tx);
            await seedVideos(tx);
        });
        console.log('✅ Database initialized successfully');
    } catch (err) {
        console.error('❌ Database initialization failed:', err);
    }
}

// -------------------- 一步到位：模块加载时自动初始化 --------------------
void initDatabaseOnce();
