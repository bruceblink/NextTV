
// 配置超时的常量
import {insertVideosToDB, ITEMS_PER_PAGE} from "@/app/lib/data";
import {DOUBAN_API_HEADER, Video} from "@/app/lib/definitions";
import axios from "axios";
import * as cheerio from "cheerio";

const REQUEST_TIMEOUT = 10000; // 超时控制（10秒）

/**
 *  通过豆瓣 API获取电影资讯
 * @param category 分类: [热门、最新、豆瓣高分，冷门佳作...]等
 * @param type 类型: [华语，欧美...]
 * @param currentPage
 */
export async function fetchLatestDataFromDouban(
    category: string,
    type?: string,
    currentPage?: number,
): Promise<any> {
    const start = ((currentPage ?? 1) - 1) * ITEMS_PER_PAGE;

    const url = `https://m.douban.com/rexxar/api/v2/subject/recent_hot/movie?start=${start}&limit=${ITEMS_PER_PAGE}&category=${category}&type=${type}&ck=sLqV`;
    try {
        // 通过豆瓣接口获取视频的概要信息
        const res = await _fetchDoubanData(url);

        if (res && res.items?.length) {
            const videos = res.items as Video[];
            // 将uri替换为豆瓣id
            const final_videos = videos.map(video => {
                return { ...video, uri: video.id };
            });
            // 插入数据库
            await insertVideosToDB(final_videos);
        }
    } catch (error) {
        console.error('请求豆瓣 API 失败:', error);
        throw new Error('无法获取影片数据');
    }
}

async function _fetchDoubanData(url: string): Promise<any> {
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

export async function fetchDoubanDataById(douban_id: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        return await fetchDoubanVideoInfoById(douban_id);
    } catch (error) {
        clearTimeout(timeoutId); // 确保清除超时
        console.error("豆瓣 API 请求失败: ", error);
        return {};
    }
}

/**
 * 获取豆瓣电影信息
 */
async function fetchDoubanVideoInfo(id: string): Promise<Record<string, any>> {
    const URL =  (id: string) =>`https://movie.douban.com/subject/${id}`;
    try {
        const response = await axios.get(URL(id), {
            headers: DOUBAN_API_HEADER,
        });
        return parseDoubanMovieInfo(response.data);
    } catch (err) {
        console.error("抓取失败:", err);
        return {};
    }
}

async function fetchDoubanVideoInfoFromApi(id: string): Promise<Record<string, any>>{
    const URL_API = (id: string) => `https://m.douban.com/rexxar/api/v2/movie/${id}`;
    try {
        const response = await axios.get(URL_API(id), {
            headers: DOUBAN_API_HEADER,
        });
        const data = response.data;

        const durations = data.durations as string[];
        const durationsResult = durations.map(dura => {
            const match = dura.match(/\d+/);
            return match ? parseInt(match[0], 10) : null;
        });

        return {
            original_title: data.original_title,
            release_year: parseInt(data.year),
            intro: data.intro,
            director: data.directors,
            language: data.languages,
            actors: data.actors,
            duration: durationsResult,
            production_country: data.countries,
            aka: data.aka
        }
    } catch (err) {
        console.error("抓取失败:", err);
        return {};
    }
}

/**
 * 解析豆瓣 HTML
 */
function parseDoubanMovieInfo(html: string): Record<string, any> {
    const $ = cheerio.load(html);

    const movieInfo: Record<string, any> = {};

    // 英文 key 的提取器
    const extractors: Record<string, () => any> = {
        // 编剧
        screenwriter: () =>
            $('#info span:contains("编剧") .attrs a')
                .map((_, el) => $(el).text().trim())
                .get(),
        // 类型
        genres: () =>
            $('span[property="v:genre"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        // 上映日期
        release_date: () =>
            $('span[property="v:initialReleaseDate"]')
                .map((_, el) => $(el).text().trim())
                .get(),
    };

    // 基础字段（英文 key）
    for (const key of Object.keys(extractors)) {
        movieInfo[key] = extractors[key]();
    }

    // info 区域其他字段（IMDb）
    $("#info .pl").each((_, el) => {
        const label = $(el).text().trim().replace(/:$/, "");
        const textNode = el.next;
        const value =
            textNode && textNode.type === "text" ? textNode.data.trim() : "";

        switch (label) {
            case "IMDb":
                movieInfo.imdb = value;
                break;
            default:
                break;
        }
    });

    return movieInfo;
}

/**
 *  根据豆瓣id过去视频详情信息
 * @param id
 */
async function fetchDoubanVideoInfoById(id: string) : Promise<Record<string, any>>{
    const [res1, res2] = await Promise.all([
        fetchDoubanVideoInfo(id),
        fetchDoubanVideoInfoFromApi(id),

    ]);
    // 后者的同名字段会覆盖前者
    return {...res1, ...res2};
}