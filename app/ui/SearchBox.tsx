'use client';

import { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';

const HOT_TAGS = [
    '电影', '电视剧', '动漫', '综艺',
    '动作', '科幻', '喜剧', '爱情',
];

export default function SearchBox() {
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

    // 执行搜索
    const handleSearch = (value: string) => {
        if (!value.trim()) return;

        setQuery(value);
        setSelectedTag(null);

        // 更新历史
        const updated = [value, ...recentSearches.filter((v) => v !== value)].slice(0, 10);
        saveRecentSearches(updated);

        console.log('搜索:', value); // TODO: 替换为实际搜索逻辑
    };

    // 删除单条历史
    const removeSearch = (value: string) => {
        const updated = recentSearches.filter((v) => v !== value);
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                />
                <button
                    onClick={() => handleSearch(query)}
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

            {/* 热门标签 */}
            <div>
                <h3 className="text-sm font-medium mb-2">热门标签</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {HOT_TAGS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => {
                                setSelectedTag(tag);
                                handleSearch(tag);
                            }}
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
