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
        year: $("#content h1 span.year").text().replace(/[()]/g, "").trim(),
    };

    // 特殊字段处理
    const extractors: Record<string, () => any> = {
        导演: () =>
            $('a[rel="v:directedBy"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        编剧: () =>
            $('#info span:contains("编剧") .attrs a')
                .map((_, el) => $(el).text().trim())
                .get(),
        主演: () =>
            $('a[rel="v:starring"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        类型: () =>
            $('span[property="v:genre"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        上映日期: () =>
            $('span[property="v:initialReleaseDate"]')
                .map((_, el) => $(el).text().trim())
                .get(),
        片长: () => $('span[property="v:runtime"]').text().trim(),
    };

    // 基础字段
    for (const key of Object.keys(extractors)) {
        movieInfo[key] = extractors[key]();
    }

    // 解析 info 区域其他字段（制片国家/地区、语言、IMDb 等）
    $("#info .pl").each((_, el) => {
        const label = $(el).text().trim().replace(/:$/, "");
        if (extractors[label]) return; // 已经处理过的字段跳过

        const textNode = el.next;
        movieInfo[label] =
            textNode && textNode.type === "text" ? textNode.data.trim() : "";
    });

    return movieInfo;
}

const res = await fetchDoubanVideoInfo(URL);
console.log(res);
