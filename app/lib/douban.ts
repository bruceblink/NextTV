
// 配置超时的常量
import {insertVideosToDB, ITEMS_PER_PAGE} from "@/app/lib/data";
import {DOUBAN_API_HEADER, Video} from "@/app/lib/definitions";
import {DoubanUrlUtils} from "@/app/lib/utils";

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
        const ut = new DoubanUrlUtils();
        return await ut.fetchDoubanVideoInfoById(douban_id);
    } catch (error) {
        clearTimeout(timeoutId); // 确保清除超时
        console.error("豆瓣 API 请求失败: ", error);
        return {};
    }
}