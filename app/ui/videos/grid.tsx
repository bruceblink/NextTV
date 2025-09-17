import { fetchFilteredVideos } from '@/app/lib/data';
import Image from "next/image";
import { Video } from "@/app/lib/definitions";
import {DoubanUrlUtils} from "@/app/lib/utils";

export default async function VideosGrid({query, category, type, tag, currentPage,}: {query: string; category: string; type: string; tag: string; currentPage: number; }) {
    // 获取video信息列表
    const res = await fetchFilteredVideos(query, category, type, tag, currentPage);
    const videos = res?.videos as Video[];

    return (
        <div
            className="grid gap-6 p-6"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // 自适应列数
                justifyItems: 'center',
            }}
        >
            {videos.map((video, index) => (
                <div
                    key={index}
                    className="bg-gray-800 rounded-lg overflow-hidden w-full max-w-[400px] flex flex-col"
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

                    {/* 文字部分 */}
                    <div className="p-3 flex flex-col gap-1">
                        <h3 className="text-lg font-semibold text-white truncate">
                            {video.uri && (
                                <a
                                    href={DoubanUrlUtils.toHttps(video.uri)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                >
                                    {video.title}
                                </a>
                            )}
                        </h3>
                        {video.rating && (
                            <h4 className="text-sm font-medium text-yellow-400 truncate">{video.rating.value}</h4>
                        )}
                        {res.category === "tv" ? (
                            <>
                                <p className="text-xs text-gray-100 truncate">{video.episodes_info}</p>
                                <p className="text-xs text-gray-100 truncate">{video.card_subtitle}</p>
                            </>
                        ) : (
                            <p className="text-xs text-gray-100 truncate">{video.card_subtitle}</p>
                        )}

                    </div>
                </div>
            ))}
        </div>
    );
}
