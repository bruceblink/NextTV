'use client';
import {useState} from 'react';

const FILTERS = {
    category: ['全部类型', '偶像', '爱情', '言情', '古装', '历史', '玄幻', '谍战', '历险', '都市', '科幻', '军旅', '喜剧', '武侠', '江湖', '罪案', '青春', '家庭', '战争'],
    region: ['全部地区', '大陆', '香港', '台湾', '日本', '韩国', '欧美', '英国', '泰国', '其它'],
    language: ['全部语言', '国语', '粤语', '英语', '韩语', '日语', '西班牙语', '法语', '德语', '意大利语', '泰国语', '其它'],
    year: ['全部年份', '今年', '去年', '更早', '90年代', '80年代', '怀旧'],
    quality: ['全部画质', '4K', '1080P', '900P', '720P'],
    status: ['全部状态', '全集', '连载中'],
};


export default function FilterBox() {
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
        category: '全部类型',
        region: '全部地区',
        language: '全部语言',
        year: '全部年份',
        quality: '全部画质',
        status: '全部状态',
    });

    const handleClick = (key: string, value: string) => {
        setSelectedFilters((prev) => ({...prev, [key]: value}));
        // TODO: 可以在这里触发搜索请求
    };

    return (
        <div className="p-4 bg-gray-900 text-white space-y-4">
            {Object.entries(FILTERS).map(([key, values]) => (
                <div key={key}>
                    <h3 className="mb-2 font-semibold">{key}</h3>
                    <div className="flex flex-wrap gap-2">
                        {values.map((value) => (
                            <button
                                key={value}
                                onClick={() => handleClick(key, value)}
                                className={`px-3 py-1 rounded ${
                                    selectedFilters[key] === value
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
