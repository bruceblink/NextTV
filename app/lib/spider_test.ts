import axios from "axios";
import * as cheerio from "cheerio";

// 豆瓣 Top250 URL（第一页）
const URL = "https://movie.douban.com/subject/36221247/";
//const URL = "https://movie.douban.com/top250";


/**
 * 获取豆瓣电影信息
 * @param url 豆瓣电影详情页 URL
 */
async function fetchDoubanVideoInfo(url: string): Promise<Record<string, any>> {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://movie.douban.com/',
            },
        });

        return parseDoubanMovieInfo(response.data);
    } catch (err) {
        console.error('抓取失败:', err);
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
        year: $("#content h1 span.year").text().replace(/[()]/g, '').trim(),
        '导演': $('a[rel="v:directedBy"]').text(),
        '编剧': $('#info > span:nth-child(3) .attrs > a').map((_, el) => $(el).text().trim()).get(),
        '主演': $('a[rel="v:starring"]').map((_, el) => $(el).text()).get(),
        '类型': $('span[property="v:genre"]').map((_, el) => $(el).text().trim()).get(),
        '上映日期': $('span[property="v:initialReleaseDate"]').map((_, el) => $(el).text().trim()).get(),
        '片长': $('span[property="v:runtime"]').text().trim(),
    };
    $('#info .pl').each((_, el) => {
        const span = $(el);
        const label = span.text().trim().replace(/:$/, '');
        //const nextEl = span.next();

        if (!span) return;

        // 主演处理
        if (label === '主演' || label === '类型' || label === '上映日期' || label === '片长' || label === '导演' || label === '编剧') {

        } else {
            const textNode = span[0].next;
            movieInfo[label] = textNode && textNode.type === 'text'
                ? textNode.data.trim()
                : '';
        }
    });

    return movieInfo;
}


const res = await fetchDoubanVideoInfo(URL);

console.log(res)

