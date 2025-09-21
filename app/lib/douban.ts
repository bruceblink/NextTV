import axios, {AxiosRequestConfig} from "axios";
import * as cheerio from "cheerio";
import {insertVideosToDB, ITEMS_PER_PAGE} from "@/app/lib/data";
import {Video} from "@/app/lib/definitions";

const REQUEST_TIMEOUT = 10000; // 10 秒超时

export const DOUBAN_API_HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Origin': 'https://movie.douban.com',
    'Referer': 'https://movie.douban.com/explore?',
    'Accept': 'application/json, text/plain, */*',
    'Cookie': 'll="108296"; bid=Yy4fcMVaTz0; _vwo_uuid_v2=DEDDB88D38ADE89FE8B880E5924C91791|5776df5806e256a0da98731dd0d2e045; __utma=30149280.1865394102.1758012698.1758012698.1758012698.1; __utmz=30149280.1758012698.1.1.utmcsr=movie.douban.com|utmccn=(referral)|utmcmd=referral|utmcct=/explore; _ga=GA1.1.1487530939.1758012790; _ga_RXNMP372GL=GS2.1.s1758012789$o1$g0$t1758012791$j58$l0$h0; dbcl2="223666985:5oShAVxYVAo"; push_noty_num=0; push_doumail_num=0; frodotk="01cc8c7aad01e62c0565a5700705b284"; talionusr="eyJpZCI6ICIyMjM2NjY5ODUiLCAibmFtZSI6ICJMIn0="; ck=sLqV; frodotk_db="4ceb998985e00eeee6c2cc9c91a02cca"'
}

/** -------------------- 类型定义 -------------------- */
export interface DoubanMovieInfo {
    original_title?: string;
    release_year?: number;
    intro?: string;
    director?: Array<{ name: string; id?: string }>;
    language?: string[];
    actors?: Array<{ name: string; id?: string }>;
    duration?: number[];
    production_country?: string[];
    aka?: string[];
    screenwriter?: string[];
    genres?: string[];
    release_date?: string[];
    imdb?: string;
}

/** -------------------- 通用请求 -------------------- */
async function axiosGetJson<T = any>(url: string, config?: AxiosRequestConfig): Promise<T | null> {
    try {
        const res = await axios.get<T>(url, {
            timeout: REQUEST_TIMEOUT,
            headers: DOUBAN_API_HEADER,
            ...config,
        });
        return res.data;
    } catch (err) {
        console.error(`请求失败: ${url}`, err);
        return null;
    }
}

/** -------------------- 获取最新电影列表并入库 -------------------- */
export async function fetchAndUpsertDoubanData(
    category: string,
    type?: string,
    currentPage: number = 1
) {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const url = `https://m.douban.com/rexxar/api/v2/subject/recent_hot/movie?start=${start}&limit=${ITEMS_PER_PAGE}&category=${category}&type=${type}&ck=sLqV`;

    const data = await axiosGetJson<{ items?: Video[] }>(url);
    if (!data?.items?.length) return;

    const videos = data.items.map(video => ({...video, uri: video.id}));
    await insertVideosToDB(videos);
}

/** -------------------- 按 ID 获取豆瓣电影信息 -------------------- */
export async function fetchDoubanVideoInfoById(id: string): Promise<DoubanMovieInfo> {
    const [htmlData, apiData] = await Promise.all([
        fetchDoubanVideoInfoHtml(id),
        fetchDoubanVideoInfoApi(id),
    ]);

    // 后者覆盖前者
    return {...htmlData, ...apiData};
}

/** -------------------- HTML 解析 -------------------- */
async function fetchDoubanVideoInfoHtml(id: string): Promise<DoubanMovieInfo> {
    const url = `https://movie.douban.com/subject/${id}`;
    const html = await axiosGetJson<string>(url, {responseType: "text"});
    if (!html) return {};

    const $ = cheerio.load(html);
    const movieInfo: DoubanMovieInfo = {};

    movieInfo.screenwriter = $('#info span:contains("编剧") a')
        .map((_, el) => $(el).text().trim())
        .get();

    movieInfo.genres = $('span[property="v:genre"]')
        .map((_, el) => $(el).text().trim())
        .get();

    movieInfo.release_date = $('span[property="v:initialReleaseDate"]')
        .map((_, el) => $(el).text().trim())
        .get();

    $("#info .pl").each((_, el) => {
        const label = $(el).text().trim().replace(/:$/, "");
        const value = el.next?.type === "text" ? el.next.data.trim() : undefined;
        if (label === "IMDb" && value) movieInfo.imdb = value;
    });

    return movieInfo;
}

/** -------------------- 移动端 API 获取 -------------------- */
async function fetchDoubanVideoInfoApi(id: string): Promise<DoubanMovieInfo> {
    const url = `https://m.douban.com/rexxar/api/v2/movie/${id}`;
    const data = await axiosGetJson<any>(url);
    if (!data) return {};

    const durations = (data.durations || []).map((d: string) => {
        const match = d.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
    }).filter(Boolean) as number[];

    return {
        original_title: data.original_title,
        release_year: parseInt(data.year, 10),
        intro: data.intro,
        director: data.directors,
        language: data.languages,
        actors: data.actors,
        duration: durations,
        production_country: data.countries,
        aka: data.aka,
    };
}
