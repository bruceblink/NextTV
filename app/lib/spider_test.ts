import axios from "axios";
import * as cheerio from "cheerio";

const URL = "https://movie.douban.com/subject/36221247/";

/**
 * 获取豆瓣电影信息
 */
async function fetchDoubanVideoInfo(url: string): Promise<Record<string, any>> {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                Referer: "https://movie.douban.com/",
            },
        });
        return parseDoubanMovieInfo(response.data);
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

    const movieInfo: Record<string, any> = {
        title: $("#content h1 span[property='v:itemreviewed']").text().trim(),
        release_year: parseInt($("#content h1 span.year").text().replace(/[()]/g, "").trim()) || null,
    };

    // 英文 key 的提取器
    const extractors: Record<string, () => any> = {
        director: () =>
            $('a[rel="v:directedBy"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        screenwriter: () =>
            $('#info span:contains("编剧") .attrs a')
                .map((_, el) => $(el).text().trim())
                .get(),
        actors: () =>
            $('a[rel="v:starring"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        type: () =>
            $('span[property="v:genre"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        release_date: () =>
            $('span[property="v:initialReleaseDate"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        duration: () => {
            const runtime = $('span[property="v:runtime"]').text().trim();
            const match = runtime.match(/\d+/); // 匹配第一个数字
            return match ? parseInt(match[0], 10) : null;
        },
    };

    // 基础字段（英文 key）
    for (const key of Object.keys(extractors)) {
        movieInfo[key] = extractors[key]();
    }

    // info 区域其他字段（制片国家/地区、语言、IMDb 等）
    $("#info .pl").each((_, el) => {
        const label = $(el).text().trim().replace(/:$/, "");
        const textNode = el.next;
        const value =
            textNode && textNode.type === "text" ? textNode.data.trim() : "";

        switch (label) {
            case "制片国家/地区":
                movieInfo.production_country = value;
                break;
            case "语言":
                movieInfo.language = value;
                break;
            case "IMDb":
                movieInfo.imdb = value;
                break;
            case "又名":
                movieInfo.aka = value;
                break;
            default:
                // 其他暂时忽略或存储到 extra
                if (!movieInfo.extra) movieInfo.extra = {};
                movieInfo.extra[label] = value;
        }
    });

    return movieInfo;
}

const res = await fetchDoubanVideoInfo(URL);
console.log(res);
