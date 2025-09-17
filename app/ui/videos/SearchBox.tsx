'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search } from 'lucide-react';

const CATEGORY_MAP: Map<string, string> = new Map([
    ['电影', 'movie'],
    ['电视剧', 'tv'],
]);

const HOT_TAGS = ['动漫', '综艺', '纪录片', '短剧'];

interface SearchParams {
    query?: string;          // 搜索框输入
    type?: string;          // 分类框输入
    category?: string;       // 分类内部值
    tag?: string;            // 热门标签
    page?: number | string;  // 分页
}

export default function SearchBox() {
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const router = useRouter();

    // 初始化历史搜索
    useEffect(() => {
        const stored = localStorage.getItem('recentSearches');
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    }, []);

    // 保存历史搜索
    const saveRecentSearches = (items: string[]) => {
        setRecentSearches(items);
        localStorage.setItem('recentSearches', JSON.stringify(items));
    };

    // 统一搜索处理
    const handleSearch = (params: SearchParams) => {
        // 更新状态
        if (params.query !== undefined) setQuery(params.query);
        if (params.type !== undefined) setQuery(params.type);
        if (params.tag !== undefined) setSelectedTag(params.tag);
        if (params.category !== undefined) setSelectedCategory(params.category);

        // 保存历史搜索（只针对 query）
        if (params.query) {
            const updated = [params.query, ...recentSearches.filter(v => v !== params.query)].slice(0, 10);
            saveRecentSearches(updated);
        }

        // 拼接 URL 查询参数
        const urlParams = new URLSearchParams(window.location.search);
        if (params.query) urlParams.set('query', params.query);
        if (params.type) urlParams.set('query', params.type);
        if (params.category) urlParams.set('category', params.category);
        if (params.tag) urlParams.set('tag', params.tag);
        urlParams.set('page', (params.page ?? 1).toString());

        router.push(`${window.location.pathname}?${urlParams.toString()}`);
    };

    // 删除单条历史
    const removeSearch = (value: string) => {
        const updated = recentSearches.filter(v => v !== value);
        saveRecentSearches(updated);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
            {/* 搜索框 */}
            <div className="flex items-center border rounded-2xl px-3 py-2 shadow-sm">
                <input
                    type="text"
                    className="flex-1 border-none outline-none px-2 text-sm"
                    placeholder="搜索影片、电视剧、动漫..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch({ query, page: 1 })}
                />
                <button
                    onClick={() => handleSearch({ query, page: 1 })}
                    className="ml-2 bg-blue-500 text-white px-3 py-1 rounded-xl flex items-center text-sm"
                >
                    <Search className="w-4 h-4 mr-1" />
                    搜索
                </button>
            </div>

            {/* 历史搜索 */}
            {recentSearches.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium mb-2">最近搜索</h3>
                    <div className="flex flex-wrap gap-2">
                        {recentSearches.map((item) => (
                            <div
                                key={item}
                                className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-gray-200"
                            >
                                <span onClick={() => handleSearch({ query: item, page: 1 })}>{item}</span>
                                <X
                                    className="w-3 h-3 ml-2 cursor-pointer text-gray-500 hover:text-red-500"
                                    onClick={() => removeSearch(item)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 分类 category */}
            <div>
                <h3 className="text-sm font-medium mb-2">分类</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {Array.from(CATEGORY_MAP.entries()).map(([label, categoryValue]) => (
                        <button
                            key={label}
                            onClick={() => handleSearch({ category: categoryValue, page: 1 })}
                            className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${
                                selectedCategory === label
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 热门标签 */}
            <div>
                <h3 className="text-sm font-medium mb-2">热门标签</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {HOT_TAGS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => handleSearch({ tag, page: 1 })}
                            className={`px-4 py-1 rounded-full text-sm whitespace-nowrap ${
                                selectedTag === tag
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}