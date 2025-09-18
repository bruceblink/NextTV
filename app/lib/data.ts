import postgres from 'postgres';
import {
    CustomerField,
    CustomersTableType,
    DOUBAN_API_HEADER,
    InvoiceForm,
    InvoicesTable,
    LatestInvoiceRaw,
    Revenue,
} from './definitions';
import {DoubanUrlUtils, formatCurrency} from './utils';
import prisma from "@/app/lib/prisma";
import {Prisma} from "@/generated/prisma";

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
      ORDER BY invoices.date DESC
      LIMIT 5`;

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
        const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
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

export const ITEMS_PER_PAGE = 20;

export async function fetchFilteredInvoices(
    query: string,
    currentPage: number,
) {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    try {
        return await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
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
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
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
      SELECT
        invoices.id,
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
// 配置超时的常量
const REQUEST_TIMEOUT = 10000; // 超时控制（10秒）

async function fetchLatestDataFromDouban(
    currentPage: number,
): Promise<any> {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    const url = `https://m.douban.com/rexxar/api/v2/subject/recent_hot/movie?start=${start}&limit=${ITEMS_PER_PAGE}&category=最新&type=全部&ck=sLqV`;
    try {
        // 通过豆瓣接口获取视频的概要信息
        const res = await fetchDoubanData(url);
        if (res && res.items?.length) {
/*            // 延迟函数
            function delay(ms: number) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            // 获取概要信息中的uri
            const videos = res.items as Video[];
            const limit = pLimit(3); // 同时最多 3 个请求
            // 并发执行请求
            const videoInfos: VideoInfo[] = await Promise.all(
                videos.map(video =>
                    limit(async () => {
                        const video_url = DoubanUrlUtils.toHttps(video.uri ?? "");
                        // 更新uri为转换后的https地址
                        video.uri = video_url;
                        await delay(300 + Math.random() * 700); // 加入随机延迟
                        const video_detail = await DoubanUrlUtils.fetchDoubanVideoInfo(video_url);
                        return { ...video, ...video_detail } as VideoInfo;
                    })
                )
            );*/
            // 插入数据库
            await insertVideosToDB(res.items);
        }
    } catch (error) {
        console.error('请求豆瓣 API 失败:', error);
        throw new Error('无法获取影片数据');
    }
}

async function fetchDoubanData(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const fetchOptions: RequestInit = {
        signal: controller.signal,
        headers: DOUBAN_API_HEADER,
    };

    try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`HTTP 错误！状态码: ${response.status}`);
            return {};
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId); // 确保清除超时
        console.error("豆瓣 API 请求失败: ", error);
        return {};
    }
}

// 工具函数：把对象安全转换成 Prisma JSON
function toJsonValue(obj: any): Prisma.InputJsonValue {
    return obj ?? Prisma.JsonNull;
}

// 🔹 插入数据库
export async function insertVideosToDB(videos: any[]) {
    for (const video of videos) {
        try {
            await insertVideoToDB(video)
        } catch (err) {
            console.error("插入数据库失败:", err, video.title);
            throw err;
        }
    }
}


export async function insertVideoToDB(video: any) {

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
                uri: video.id ?? null,  // 这里的uri存放豆瓣影片的id
                episodes_info: video.episodes_info ?? "",
                card_subtitle: video.card_subtitle ?? null,
                category: video.category ?? "movie",

                // 🔹 新增的详细信息
                original_title: video.original_title?? "",
                intro: video.intro?? "",
                genres: toJsonValue(video.genres),
                director: toJsonValue(video.director),
                screenwriter: toJsonValue(video.screenwriter),
                actors: toJsonValue(video.actors),
                type: toJsonValue(video.type),
                production_country: toJsonValue(video.production_country),
                language: toJsonValue(video.language),
                release_year: video.release_year ?? null,
                release_date: toJsonValue(video.release_date),
                duration: toJsonValue(video.duration),
                aka: toJsonValue(video.aka),
                imdb: video.imdb ?? null,
            },
            update: {
                rating: toJsonValue(video.rating),
                pic: toJsonValue(video.pic),
                is_new: video.is_new ?? false,
                uri: video.id ?? null,  // 这里的uri存放豆瓣影片的id
                card_subtitle: video.card_subtitle ?? null,
                episodes_info: video.episodes_info ?? "",
                category: video.category ?? "movie",

                // 🔹 新增的详细信息
                original_title: video.original_title?? "",
                intro: video.intro?? "",
                genres: toJsonValue(video.genres),
                director: toJsonValue(video.director),
                screenwriter: toJsonValue(video.screenwriter),
                actors: toJsonValue(video.actors),
                type: toJsonValue(video.type),
                production_country: toJsonValue(video.production_country),
                language: toJsonValue(video.language),
                release_year: video.release_year ?? null,
                release_date: toJsonValue(video.release_date),
                duration: toJsonValue(video.duration),
                aka: toJsonValue(video.aka),
                imdb: video.imdb ?? null,
            },
        });
    } catch (err) {
        console.error("插入数据库失败:", err, video.title);
        throw err;
    }
}


/**
 *  查询最新电影资讯
 * @param query
 * @param category
 * @param _type
 * @param _tag
 * @param currentPage
 */
export async function fetchFilteredVideos(
    query: string,
    category: string,
    _type: string,
    _tag: string,
    currentPage: number,
): Promise<any> {
    const start = (currentPage - 1) * ITEMS_PER_PAGE || 0;
    // 从豆瓣API获取数据
    await fetchLatestDataFromDouban(currentPage);
    // 从数据库查询
    try {
        const [totalCount, videos] = await prisma.$transaction([
            prisma.video_info.count({
                where: {
                    AND: [
                        // 模糊匹配标题
                        query ? { title: { contains: query, mode: 'insensitive' } } : {},
                        // 精确匹配分类
                        category ? { card_subtitle: { contains: category, mode: 'insensitive' } } : {},
                        // 标签（假设你存储在 episodes_info 或 tag 字段里）
                        _tag ? { episodes_info: { contains: _tag } } : {},
                    ],
                },
            }),
            prisma.video_info.findMany({
                where: {
                    AND: [
                        query ? { title: { contains: query, mode: 'insensitive' } } : {},
                        category ? { card_subtitle: category } : {},
                        _tag ? { episodes_info: { contains: _tag } } : {},
                    ],
                },
                skip: start,
                take: ITEMS_PER_PAGE,
                orderBy: {
                    created_at: "asc",
                },
            }),
        ]);

        return { totalCount, videos };
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


export async function fetchDoubanDataById(douban_id: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const ut = new DoubanUrlUtils();
        return await ut.fetchDoubanVideoInfoById(douban_id);
    } catch (error) {
        clearTimeout(timeoutId); // 确保清除超时
        console.error("豆瓣 API 请求失败: ", error);
        return {};
    }
}