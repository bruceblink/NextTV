'use client';

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Search, X} from 'lucide-react';

const HOT_TAGS = ['电影', '电视剧', '动漫', '综艺', '动作', '科幻', '喜剧', '爱情'];

const FILTERS = {
    category: ['全部类型', '偶像', '爱情', '言情', '古装', '历史', '玄幻', '谍战', '历险', '都市', '科幻', '军旅', '喜剧', '武侠', '江湖', '罪案', '青春', '家庭', '战争'],
    region: ['全部地区', '大陆', '香港', '台湾', '日本', '韩国', '欧美', '英国', '泰国', '其它'],
    language: ['全部语言', '国语', '粤语', '英语', '韩语', '日语', '西班牙语', '法语', '德语', '意大利语', '泰国语', '其它'],
    year: ['全部年份', '今年', '去年', '更早', '90年代', '80年代', '怀旧'],
    quality: ['全部画质', '4K', '1080P', '900P', '720P'],
    status: ['全部状态', '全集', '连载中'],
};

export default function SearchAndFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 搜索状态
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // 筛选状态
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
        category: '全部类型',
        region: '全部地区',
        language: '全部语言',
        year: '全部年份',
        quality: '全部画质',
        status: '全部状态',
    });

    // 初始化历史搜索 + URL 参数
    useEffect(() => {
        const stored = localStorage.getItem('recentSearches');
        if (stored) setRecentSearches(JSON.parse(stored));

        const q = searchParams.get('type');
        if (q) setQuery(q);

        const newFilters = {...selectedFilters};
        Object.keys(FILTERS).forEach(key => {
            const val = searchParams.get(key);
            if (val) newFilters[key] = val;
        });
        setSelectedFilters(newFilters);
    }, []);

    const saveRecentSearches = (items: string[]) => {
        setRecentSearches(items);
        localStorage.setItem('recentSearches', JSON.stringify(items));
    };

    // 更新 URL 查询参数（默认值不生成参数）
    const updateURL = (paramsObj: Record<string, string>) => {
        const params = new URLSearchParams();
        if (paramsObj.type) params.set('type', paramsObj.type);
        Object.entries(paramsObj).forEach(([k, v]) => {
            if (v && !v.startsWith('全部')) { // 默认选项不加入 URL
                params.set(k, v);
            }
        });
        params.set('page', '1'); // 搜索/筛选重置分页
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const handleSearch = (value: string) => {
        if (!value.trim()) return;
        setQuery(value);
        setSelectedTag(null);

        const updated = [value, ...recentSearches.filter(v => v !== value)].slice(0, 10);
        saveRecentSearches(updated);

        updateURL({type: value, ...selectedFilters});
    };

    const handleFilterClick = (key: string, value: string) => {
        const newFilters = {...selectedFilters, [key]: value};
        setSelectedFilters(newFilters);
        updateURL({type: query, ...newFilters});
    };

    const removeSearch = (value: string) => {
        const updated = recentSearches.filter(v => v !== value);
        saveRecentSearches(updated);
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
            {/* 搜索框 */}
            <div className="flex items-center border rounded-2xl px-3 py-2 shadow-sm">
                <input
                    type="text"
                    className="flex-1 border-none outline-none px-2 text-sm"
                    placeholder="搜索影片、电视剧、动漫..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                />
                <button
                    onClick={() => handleSearch(query)}
                    className="ml-2 bg-blue-500 text-white px-3 py-1 rounded-xl flex items-center text-sm"
                >
                    <Search className="w-4 h-4 mr-1"/>
                    搜索
                </button>
            </div>

            {/* 历史搜索 */}
            {recentSearches.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium mb-2">最近搜索</h3>
                    <div className="flex flex-wrap gap-2">
                        {recentSearches.map(item => (
                            <div
                                key={item}
                                className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-gray-200"
                            >
                                <span onClick={() => handleSearch(item)}>{item}</span>
                                <X
                                    className="w-3 h-3 ml-2 cursor-pointer text-gray-500 hover:text-red-500"
                                    onClick={() => removeSearch(item)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 筛选器（风格统一） */}
            <div className="space-y-4">
                {Object.entries(FILTERS).map(([key, values]) => (
                    <div key={key}>
                        <h3 className="mb-2 font-semibold text-sm">{key}</h3>
                        <div className="flex flex-wrap gap-2">
                            {values.map(value => (
                                <button
                                    key={value}
                                    onClick={() => handleFilterClick(key, value)}
                                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                                        selectedFilters[key] === value
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
