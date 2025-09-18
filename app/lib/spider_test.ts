import axios from "axios";
import * as cheerio from "cheerio";

const DOUBAN_API_HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Origin': 'https://movie.douban.com',
    'Referer': 'https://movie.douban.com/explore?',
    'Accept': 'application/json, text/plain, */*',
    'Cookie': 'll="108296"; bid=Yy4fcMVaTz0; _vwo_uuid_v2=DEDDB88D38ADE89FE8B880E5924C91791|5776df5806e256a0da98731dd0d2e045; __utma=30149280.1865394102.1758012698.1758012698.1758012698.1; __utmz=30149280.1758012698.1.1.utmcsr=movie.douban.com|utmccn=(referral)|utmcmd=referral|utmcct=/explore; _ga=GA1.1.1487530939.1758012790; _ga_RXNMP372GL=GS2.1.s1758012789$o1$g0$t1758012791$j58$l0$h0; dbcl2="223666985:5oShAVxYVAo"; push_noty_num=0; push_doumail_num=0; frodotk="01cc8c7aad01e62c0565a5700705b284"; talionusr="eyJpZCI6ICIyMjM2NjY5ODUiLCAibmFtZSI6ICJMIn0="; ck=sLqV; frodotk_db="4ceb998985e00eeee6c2cc9c91a02cca"'
}

const URL =  (id: string) =>`https://movie.douban.com/subject/${id}`;

const URL_API = (id: string) => `https://m.douban.com/rexxar/api/v2/movie/${id}`;


/**
 * 获取豆瓣电影信息
 */
async function fetchDoubanVideoInfo(id: string): Promise<Record<string, any>> {
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
            release_year: data.year,
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

const [res1, res2] = await Promise.all([
    fetchDoubanVideoInfo("36176467"),
    fetchDoubanVideoInfoFromApi("36176467"),

]);

const merged = { ...res1, ...res2 }; // 后者的同名字段会覆盖前者
console.log(merged);

