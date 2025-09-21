import postgres from 'postgres';
import {CustomerField, CustomersTableType, InvoiceForm, InvoicesTable, LatestInvoiceRaw, Revenue,} from './definitions';
import {formatCurrency} from './utils';
import prisma from "@/app/lib/prisma";
import {Prisma} from "@/generated/prisma";
import {fetchAndUpsertDoubanData} from "@/app/lib/douban";

const sql = postgres(process.env.DATABASE_URL!);

export async function fetchRevenue() {
    try {
        // Artificially delay a response for demo purposes.
        // Don't do this in production :)

        // console.log('Fetching revenue data...');
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        return await sql<Revenue[]>`SELECT *
                                    FROM revenue`;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch revenue data.');
    }
}

export async function fetchLatestInvoices() {
    try {
        const data = await sql<LatestInvoiceRaw[]>`
            SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
            FROM invoices
                     JOIN customers ON invoices.customer_id = customers.id
            ORDER BY invoices.date DESC LIMIT 5`;

        return data.map((invoice) => ({
            ...invoice,
            amount: formatCurrency(invoice.amount),
        }));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch the latest invoices.');
    }
}

export async function fetchCardData() {
    try {
        // You can probably combine these into a single SQL query
        // However, we are intentionally splitting them to demonstrate
        // how to initialize multiple queries in parallel with JS.
        const invoiceCountPromise = sql`SELECT COUNT(*)
                                        FROM invoices`;
        const customerCountPromise = sql`SELECT COUNT(*)
                                         FROM customers`;
        const invoiceStatusPromise = sql`SELECT SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)    AS "paid",
                                                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
                                         FROM invoices`;

        const data = await Promise.all([
            invoiceCountPromise,
            customerCountPromise,
            invoiceStatusPromise,
        ]);

        const numberOfInvoices = Number(data[0][0].count ?? '0');
        const numberOfCustomers = Number(data[1][0].count ?? '0');
        const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
        const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');

        return {
            numberOfCustomers,
            numberOfInvoices,
            totalPaidInvoices,
            totalPendingInvoices,
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch card data.');
    }
}

export const ITEMS_PER_PAGE = 16;

export async function fetchFilteredInvoices(
    query: string,
    currentPage: number,
) {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    try {
        return await sql<InvoicesTable[]>`
            SELECT invoices.id,
                   invoices.amount,
                   invoices.date,
                   invoices.status,
                   customers.name,
                   customers.email,
                   customers.image_url
            FROM invoices
                     JOIN customers ON invoices.customer_id = customers.id
            WHERE customers.name ILIKE ${`%${query}%`}
               OR
                customers.email ILIKE ${`%${query}%`}
               OR
                invoices.amount::text ILIKE ${`%${query}%`}
               OR
                invoices.date::text ILIKE ${`%${query}%`}
               OR
                invoices.status ILIKE ${`%${query}%`}
            ORDER BY invoices.date DESC
                LIMIT ${ITEMS_PER_PAGE}
            OFFSET ${offset}
        `;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices.');
    }
}

export async function fetchInvoicesPages(query: string) {
    try {
        const data = await sql`SELECT COUNT(*)
                               FROM invoices
                                        JOIN customers ON invoices.customer_id = customers.id
                               WHERE customers.name ILIKE ${`%${query}%`}
                                  OR
                                   customers.email ILIKE ${`%${query}%`}
                                  OR
                                   invoices.amount::text ILIKE ${`%${query}%`}
                                  OR
                                   invoices.date::text ILIKE ${`%${query}%`}
                                  OR
                                   invoices.status ILIKE ${`%${query}%`}
        `;

        return Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch total number of invoices.');
    }
}

export async function fetchInvoiceById(id: string) {
    try {
        const data = await sql<InvoiceForm[]>`
            SELECT invoices.id,
                   invoices.customer_id,
                   invoices.amount,
                   invoices.status
            FROM invoices
            WHERE invoices.id = ${id};
        `;

        const invoice = data.map((invoice) => ({
            ...invoice,
            // Convert amount from cents to dollars
            amount: invoice.amount / 100,
        }));

        return invoice[0];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoice.');
    }
}

export async function fetchCustomers() {
    try {
        return await sql<CustomerField[]>`
            SELECT id,
                   name
            FROM customers
            ORDER BY name
        `;
    } catch (err) {
        console.error('Database Error:', err);
        throw new Error('Failed to fetch all customers.');
    }
}

export async function fetchFilteredCustomers(query: string) {
    try {
        const data = await sql<CustomersTableType[]>`
            SELECT customers.id,
                   customers.name,
                   customers.email,
                   customers.image_url,
                   COUNT(invoices.id)                                                         AS total_invoices,
                   SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
                   SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END)    AS total_paid
            FROM customers
                     LEFT JOIN invoices ON customers.id = invoices.customer_id
            WHERE customers.name ILIKE ${`%${query}%`}
               OR customers.email ILIKE ${`%${query}%`}
            GROUP BY customers.id, customers.name, customers.email, customers.image_url
            ORDER BY customers.name
        `;

        return data.map((customer) => ({
            ...customer,
            total_pending: formatCurrency(customer.total_pending),
            total_paid: formatCurrency(customer.total_paid),
        }));
    } catch (err) {
        console.error('Database Error:', err);
        throw new Error('Failed to fetch customer table.');
    }
}

// 工具函数：把对象安全转换成 Prisma JSON
function toJsonValue(obj: any): Prisma.InputJsonValue {
    return obj ?? Prisma.JsonNull;
}

/**
 * 批量插入多条Video,唯一约束冲突则跳过
 * @param videos
 */
export async function insertVideosToDB(videos: any[]) {
    try {
        await prisma.video_info.createMany({
            data: videos.map(video => ({
                title: video.title ?? "",
                rating: toJsonValue(video.rating),
                pic: toJsonValue(video.pic),
                is_new: video.is_new ?? false,
                uri: video.uri ?? null,
                episodes_info: video.episodes_info ?? "",
                card_subtitle: video.card_subtitle ?? null,
                type: video.type ?? "movie",

                // 详细信息
                original_title: video.original_title ?? "",
                intro: video.intro ?? "",
                genres: toJsonValue(video.genres),
                director: toJsonValue(video.director),
                screenwriter: toJsonValue(video.screenwriter),
                actors: toJsonValue(video.actors),
                production_country: toJsonValue(video.production_country),
                language: toJsonValue(video.language),
                release_year: video.release_year ?? null,
                release_date: toJsonValue(video.release_date),
                duration: toJsonValue(video.duration),
                aka: toJsonValue(video.aka),
                imdb: video.imdb ?? null,
            })),
            skipDuplicates: true, // 避免唯一约束冲突
        });
    } catch (err) {
        console.error("批量插入数据库失败:", err);
        throw err;
    }
}


/**
 * 插入更新单挑video信息
 * @param video
 */
export async function upsertVideoToDB(video: any) {
    try {
        await prisma.video_info.upsert({
            where: {
                title_episodes_info: {
                    title: video.title ?? "",
                    episodes_info: video.episodes_info ?? "",
                },
            },
            create: {
                title: video.title ?? "",
                rating: toJsonValue(video.rating),
                pic: toJsonValue(video.pic),
                is_new: video.is_new ?? false,
                uri: video.uri ?? null,
                episodes_info: video.episodes_info ?? "",
                card_subtitle: video.card_subtitle ?? null,
                type: video.type ?? "movie",

                // 详细信息
                original_title: video.original_title ?? "",
                intro: video.intro ?? "",
                genres: toJsonValue(video.genres),
                director: toJsonValue(video.director),
                screenwriter: toJsonValue(video.screenwriter),
                actors: toJsonValue(video.actors),
                production_country: toJsonValue(video.production_country),
                language: toJsonValue(video.language),
                release_year: video.release_year ?? null,
                release_date: toJsonValue(video.release_date),
                duration: toJsonValue(video.duration),
                aka: toJsonValue(video.aka),
                imdb: video.imdb ?? null,
            },
            update: {
                ...(video.rating !== undefined && {rating: toJsonValue(video.rating)}),
                ...(video.pic !== undefined && {pic: toJsonValue(video.pic)}),
                is_new: video.is_new ?? false,
                ...(video.uri !== undefined && {uri: video.uri}),
                ...(video.episodes_info !== undefined && {episodes_info: video.episodes_info}),
                ...(video.card_subtitle !== undefined && {card_subtitle: video.card_subtitle}),
                ...(video.type !== undefined && {type: video.type}),

                // 详细信息
                ...(video.original_title !== undefined && {original_title: video.original_title}),
                ...(video.intro !== undefined && {intro: video.intro}),
                ...(video.genres !== undefined && {genres: toJsonValue(video.genres)}),
                ...(video.director !== undefined && {director: toJsonValue(video.director)}),
                ...(video.screenwriter !== undefined && {screenwriter: toJsonValue(video.screenwriter)}),
                ...(video.actors !== undefined && {actors: toJsonValue(video.actors)}),
                ...(video.production_country !== undefined && {production_country: toJsonValue(video.production_country)}),
                ...(video.language !== undefined && {language: toJsonValue(video.language)}),
                ...(video.release_year !== undefined && {release_year: video.release_year}),
                ...(video.release_date !== undefined && {release_date: toJsonValue(video.release_date)}),
                ...(video.duration !== undefined && {duration: toJsonValue(video.duration)}),
                ...(video.aka !== undefined && {aka: video.aka}),
                ...(video.imdb !== undefined && {imdb: video.imdb}),
            },
        });
    } catch (err) {
        console.error("插入数据库失败:", err, video.title);
        throw err;
    }
}


/**
 *  查询最新电影资讯
 * @param query  电影标题的查询条件
 * @param category 分类: [热门, 最新, 豆瓣高分, 冷门佳作...]等
 * @param _type 类型: [华语，欧美...]
 * @param _tag  标签: [剧情, 动作,爱情]
 * @param currentPage 分页的当前页数
 */
export async function fetchFilteredVideos(
    query: string,
    category: string,
    _type: string,
    _tag: string,
    currentPage: number,
): Promise<any> {
    const start = (currentPage - 1) * ITEMS_PER_PAGE || 0;
    // 从豆瓣获取电影数据
    await fetchAndUpsertDoubanData(category, _type, currentPage);
    // 从数据库查询
    try {
        const [totalCount, videos] = await prisma.$transaction([
            prisma.video_info.count({
                where: {
                    AND: [
                        // 模糊匹配标题
                        query ? {title: {contains: query, mode: 'insensitive'}} : {},
                        // 精确匹配分类
                        category ? {card_subtitle: {contains: category, mode: 'insensitive'}} : {},
                        // 标签（假设你存储在 episodes_info 或 tag 字段里）
                        _tag ? {episodes_info: {contains: _tag}} : {},
                    ],
                },
            }),
            prisma.video_info.findMany({
                where: {
                    AND: [
                        query ? {title: {contains: query, mode: 'insensitive'}} : {},
                        category ? {card_subtitle: category} : {},
                        _tag ? {episodes_info: {contains: _tag}} : {},
                    ],
                },
                skip: start,
                take: ITEMS_PER_PAGE,
                orderBy: {
                    created_at: "asc",
                },
            }),
        ]);

        return {totalCount, videos};
    } catch (err) {
        console.error("查询数据库失败:", err);
    }
}

export async function fetchVideoInfoById(id: string) {
    try {
        return await prisma.video_info.findUnique({
            where: {
                id: id,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch video.');
    }
}