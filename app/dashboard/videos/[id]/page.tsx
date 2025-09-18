import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import {
    fetchVideoInfoById,
    fetchDoubanDataById,
    insertVideoToDB,
} from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Video Detail',
};

export default async function Page({
                                       params,
                                       searchParams,
                                   }: {
    params: { id: string };
    searchParams?: { doubanId?: string };
}) {
    const { id } = params;
    const doubanId = searchParams?.doubanId ?? '';

    // 并发请求
    const [video, videoDouban] = await Promise.all([
        fetchVideoInfoById(id),
        doubanId ? fetchDoubanDataById(doubanId) : Promise.resolve(null),
    ]);

    // 如果从豆瓣获取到了数据，插入数据库
    if (videoDouban) {
        await insertVideoToDB(videoDouban);
    }

    // 如果本地数据库没有视频，直接 404
    if (!video) {
        notFound();
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
        </main>
    );
}
