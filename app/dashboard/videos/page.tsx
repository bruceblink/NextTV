import Pagination from '@/app/ui/invoices/pagination';
import Grid from '@/app/ui/videos/grid';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchFilteredVideos, ITEMS_PER_PAGE } from '@/app/lib/data';
import SearchBox from '@/app/ui/SearchBox';

export const metadata: Metadata = {
    title: 'Videos',
};

export default async function Page(props: {
    searchParams?: Promise<{
        category?:string;
        type?: string;
        tag?: string;
        page?: string;
    }>;
}) {
    // 获取URL地址栏参数
    const searchParams = await props.searchParams;
    const category = searchParams?.category || '最新';
    const type = searchParams?.type || '全部';
    const tag = searchParams?.tag || '';
    const currentPage = Number(searchParams?.page) || 1;

    const res = await fetchFilteredVideos(category, type, tag, currentPage);

    const total = res.total as number;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Videos</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <SearchBox />
            </div>

            <Suspense key={type + tag + currentPage}>
                <Grid category={category} type={type} tag={tag} currentPage={currentPage} />
            </Suspense>
            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages}/>
            </div>
        </div>
    );
}