// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type User = {
    id: string;
    username: string;
    email: string;
    password: string;
    display_name: string;
    avatar_url: string;
    created_at: number;
    updated_at: number;
};

export type Customer = {
    id: string;
    name: string;
    email: string;
    image_url: string;
};

export type Invoice = {
    id: string;
    customer_id: string;
    amount: number;
    date: string;
    // In TypeScript, this is called a string union type.
    // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
    status: 'pending' | 'paid';
};

export type Revenue = {
    month: string;
    revenue: number;
};

export type LatestInvoice = {
    id: string;
    name: string;
    image_url: string;
    email: string;
    amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
    amount: number;
};

export type InvoicesTable = {
    id: string;
    customer_id: string;
    name: string;
    email: string;
    image_url: string;
    date: string;
    amount: number;
    status: 'pending' | 'paid';
};

export type CustomersTableType = {
    id: string;
    name: string;
    email: string;
    image_url: string;
    total_invoices: number;
    total_pending: number;
    total_paid: number;
};

export type FormattedCustomersTable = {
    id: string;
    name: string;
    email: string;
    image_url: string;
    total_invoices: number;
    total_pending: string;
    total_paid: string;
};

export type CustomerField = {
    id: string;
    name: string;
};

export type InvoiceForm = {
    id: string;
    customer_id: string;
    amount: number;
    status: 'pending' | 'paid';
};

export type BaseVideo  = {
    id: string;               // id
    title: string;            // 标题
    rating?: {                // 评分
        value: number;        // 分数值
        count?: number;       // 评分人数
        max?: number;         // 最高分
        start_count?: number; // 起始评分人数（可选）
    };
    pic: {                    // 图片
        normal: string;       // 正常尺寸
        large?: string;       // 大图（可选）
    };
    is_new?: boolean;         // 是否新上映
    uri?: string;             // 豆瓣地址
    episodes_info?: string;   // 更新集数
    card_subtitle?: string;   // 副标题
    category: string;            // 类型 tv/movie/等
};

export type Video = BaseVideo;

export type VideoInfo = BaseVideo & {
    original_title: string
    intro: string;
    director: JSON;
    screenwriter?: JSON;
    actors?: JSON;
    type?: JSON;
    genres?: JSON;
    production_country?: JSON;
    language?: string;
    release_year?: number;
    release_date?: string;
    duration: number;
    aka?: string;
    imdb?: string;
};

export const DOUBAN_API_HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Origin': 'https://movie.douban.com',
    'Referer': 'https://movie.douban.com/explore?',
    'Accept': 'application/json, text/plain, */*',
    'Cookie': 'll="108296"; bid=Yy4fcMVaTz0; _vwo_uuid_v2=DEDDB88D38ADE89FE8B880E5924C91791|5776df5806e256a0da98731dd0d2e045; __utma=30149280.1865394102.1758012698.1758012698.1758012698.1; __utmz=30149280.1758012698.1.1.utmcsr=movie.douban.com|utmccn=(referral)|utmcmd=referral|utmcct=/explore; _ga=GA1.1.1487530939.1758012790; _ga_RXNMP372GL=GS2.1.s1758012789$o1$g0$t1758012791$j58$l0$h0; dbcl2="223666985:5oShAVxYVAo"; push_noty_num=0; push_doumail_num=0; frodotk="01cc8c7aad01e62c0565a5700705b284"; talionusr="eyJpZCI6ICIyMjM2NjY5ODUiLCAibmFtZSI6ICJMIn0="; ck=sLqV; frodotk_db="4ceb998985e00eeee6c2cc9c91a02cca"'
}