import { fetchFilteredVideos } from '@/app/lib/data';
import Image from "next/image";
import {Video} from "@/app/lib/definitions";

export default async function VideosGrid({category, type, tag, currentPage,}: {category: string; type: string; tag: string; currentPage: number; }) {
    // 获取video信息列表
    const res = await fetchFilteredVideos(category, type, tag, currentPage);

    const videos = res?.items as Video[]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            {videos.map((video, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 relative">
                    {/* 设置相对定位以便图片使用 fill 填充父容器 */}
                    <div className="relative w-full h-48 bg-gray-300 rounded-lg mb-4">
                        <Image
                            src={video.pic.normal}
                            alt={`${video.title}'s image`}
                            className="rounded-lg"
                            fill          // 使用 fill 填充父容器
                            style={{ objectFit: 'cover', objectPosition: 'center' }}  // 使用 style 来设置 objectFit 和 objectPosition
                        />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 truncate">{video.title}</h3>
                    {video.rating && (
                        <h4 className="text-lg font-medium text-yellow-400 mb-2">{video.rating.value}</h4>
                    )}
                    <p className="text-sm text-gray-100">{video.episodes_info}</p>
                </div>
            ))}
        </div>
    );
}