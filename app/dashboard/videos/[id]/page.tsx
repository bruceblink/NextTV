import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import {
    fetchVideoInfoById,
    upsertVideoToDB,
} from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from "next/image";
import {fetchDoubanDataById} from "@/app/lib/douban";

export const metadata: Metadata = {
    title: 'Video Detail',
};

export default async function Page({ params, searchParams,} :
   { params: Promise<{ id: string }> ; searchParams?: Promise<{ doubanId?: string }>; }) {
    const id = (await params).id; // await params
    const doubanId = (await searchParams)?.doubanId ?? ''; // await searchParams

    // 并发请求
    const [video, videoDouban] = await Promise.all([
        fetchVideoInfoById(id),
        doubanId ? fetchDoubanDataById(doubanId) : Promise.resolve(null),
    ]);

    // 如果本地数据库没有视频，直接 404
    if (!video) {
        notFound();
    }

    let videoDetail = {...video};
    // 如果从豆瓣获取到了视频详情数据，插入数据库
    if (videoDouban) {
        videoDetail = { ...videoDetail, ...videoDouban };
        await upsertVideoToDB(videoDetail);
    }

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Videos', href: '/dashboard/videos' },
                    {
                        label: 'Video Detail',
                        href: `/dashboard/videos/${id}`,
                        active: true,
                    },
                ]}
            />
            <h1>{videoDetail.title}</h1>
            <div className="bg-gray-800 rounded-lg overflow-hidden w-full max-w-[250px] flex flex-col">
                <div className="relative w-full aspect-[0.618]">
                    <Image
                        src={(videoDetail.pic as any).normal}
                        alt={`${video.title}'s image`}
                        fill
                        className="rounded-t-lg"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                </div>
            </div>
            <div>
                <span />
                上映时间：
                <span>{videoDetail.release_date as any}</span>
            </div>
        </main>
    );
}
