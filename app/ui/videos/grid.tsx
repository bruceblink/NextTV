import { fetchFilteredVideos } from '@/app/lib/data';
import Image from "next/image";
import { Video } from "@/app/lib/definitions";

export default async function VideosGrid({category, type, tag, currentPage,}: {category: string; type: string; tag: string; currentPage: number; }) {
    // 获取video信息列表
    const res = await fetchFilteredVideos(category, type, tag, currentPage);
    const videos = res?.items as Video[];

    return (
        <div
            className="grid gap-6 p-6 "
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                justifyItems: 'center',
            }}
        >
            {videos.map((video, index) => (
                <div
                    key={index}
                    className="bg-gray-800 rounded-lg overflow-hidden w-full max-w-[400px]"
                >

                    <div className="relative w-full aspect-[0.618]">
                        <Image
                            src={video.pic.normal}
                            alt={`${video.title}'s image`}
                            fill
                            className="rounded-t-lg"
                            style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                    </div>

                    <div className="p-3">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">{video.title}</h3>
                        {video.rating && (
                            <h4 className="text-sm font-medium text-yellow-400 mb-1">{video.rating.value}</h4>
                        )}
                        <p className="text-xs text-gray-100 truncate">{video.episodes_info}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
