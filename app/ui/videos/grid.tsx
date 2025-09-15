import { fetchFilteredVideos } from '@/app/lib/data';
import Image from "next/image";

export default async function VideosGrid({ query, currentPage,}: { query: string; currentPage: number; }) {
    // 获取video信息列表
    const videos = await fetchFilteredVideos(query, currentPage);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            {videos.map((video, index) => (
                <div key={index}>
                    <div className="h-48 bg-gray-300 rounded-lg mb-4">
                        <Image
                            src={video.pic}
                            className="mr-2 rounded-full"
                            width={28}
                            height={28}
                            alt={`${video.uri}'s profile picture`}
                        />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 truncate">{video.title}</h3>
                    <h3 className="text-xl font-semibold text-white mb-2 truncate">{video.rating?.value}</h3>
                    <p className="text-sm text-gray-100">{video.episodes_info}</p>
                </div>
            ))}
        </div>
    );
}