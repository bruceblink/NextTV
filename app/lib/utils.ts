import {DOUBAN_API_HEADER, Revenue} from './definitions';
import axios from "axios";
import * as cheerio from "cheerio";

export const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });
};

export const formatDateToLocal = (
    dateStr: string,
    locale: string = 'en-US',
) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    };
    const formatter = new Intl.DateTimeFormat(locale, options);
    return formatter.format(date);
};

export const generateYAxis = (revenue: Revenue[]) => {
    // Calculate what labels we need to display on the y-axis
    // based on highest record and in 1000s
    const yAxisLabels = [];
    const highestRecord = Math.max(...revenue.map((month) => month.revenue));
    const topLabel = Math.ceil(highestRecord / 1000) * 1000;

    for (let i = topLabel; i >= 0; i -= 1000) {
        yAxisLabels.push(`$${i / 1000}K`);
    }

    return {yAxisLabels, topLabel};
};

export const generatePagination = (currentPage: number, totalPages: number) => {
    // If the total number of pages is 7 or less,
    // display all pages without any ellipsis.
    if (totalPages <= 7) {
        return Array.from({length: totalPages}, (_, i) => i + 1);
    }

    // If the current page is among the first 3 pages,
    // show the first 3, an ellipsis, and the last 2 pages.
    if (currentPage <= 3) {
        return [1, 2, 3, '...', totalPages - 1, totalPages];
    }

    // If the current page is among the last 3 pages,
    // show the first 2, an ellipsis, and the last 3 pages.
    if (currentPage >= totalPages - 2) {
        return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
    }

    // If the current page is somewhere in the middle,
    // show the first page, an ellipsis, the current page and its neighbors,
    // another ellipsis, and the last page.
    return [
        1,
        '...',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        '...',
        totalPages,
    ];
};

export class DoubanUrlUtils {
    /**
     * 将单个豆瓣自定义协议链接转换为网页可访问链接
     * @param doubanUrl 自定义协议链接，例如 douban://douban.com/movie/36221247
     * @returns 可在浏览器访问的 https 链接
     */
    static toHttps(doubanUrl: string): string {
        if (doubanUrl && !doubanUrl.startsWith("douban://")) {
            return doubanUrl;
        }

        const urlWithoutProtocol = doubanUrl.replace("douban://", "");

        if (urlWithoutProtocol.includes("/movie/")) {
            const id = urlWithoutProtocol.split("/movie/")[1];
            return `https://movie.douban.com/subject/${id}/`;
        }

        if (urlWithoutProtocol.includes("/tv/")) {
            const id = urlWithoutProtocol.split("/tv/")[1];
            return `https://movie.douban.com/subject/${id}/`; // 豆瓣网页电视剧也用 subject
        }

        // 其他类型链接原样返回
        return `https://${urlWithoutProtocol}`;
    }

    /**
     * 批量转换豆瓣自定义协议链接数组为网页链接
     * @param urls 链接数组
     * @returns 可在浏览器访问的 https 链接数组
     */
    static batchToHttps(urls: string[]): string[] {
        return urls.map(url => this.toHttps(url));
    }

    /**
     * 获取豆瓣电影信息
     */
     async fetchDoubanVideoInfo(id: string): Promise<Record<string, any>> {
        const URL =  (id: string) =>`https://movie.douban.com/subject/${id}`;
        try {
            const response = await axios.get(URL(id), {
                headers: DOUBAN_API_HEADER,
            });
            return this.parseDoubanMovieInfo(response.data);
        } catch (err) {
            console.error("抓取失败:", err);
            return {};
        }
    }

     async fetchDoubanVideoInfoFromApi(id: string): Promise<Record<string, any>>{
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
     parseDoubanMovieInfo(html: string): Record<string, any> {
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
    async fetchDoubanVideoInfoById(id: string) : Promise<Record<string, any>>{
        const [res1, res2] = await Promise.all([
            this.fetchDoubanVideoInfo(id),
            this.fetchDoubanVideoInfoFromApi(id),

        ]);
         // 后者的同名字段会覆盖前者
        return {...res1, ...res2};
    }

}
