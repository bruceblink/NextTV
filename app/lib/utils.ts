import {Revenue} from './definitions';

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
}
