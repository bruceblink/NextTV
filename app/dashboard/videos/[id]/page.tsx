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

    // 如果从豆瓣获取到了视频详情数据，插入数据库
    if (videoDouban) {
        const merged = { ...video, ...videoDouban };
        await insertVideoToDB(merged);
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
