import Pagination from '@/app/ui/invoices/pagination';
import Grid from '@/app/ui/videos/grid';
import {lusitana} from '@/app/ui/fonts';
import {Suspense} from 'react';
import {Metadata} from 'next';
import {ITEMS_PER_PAGE} from '@/app/lib/data';
import SearchBox from '@/app/ui/videos/SearchBox';
import {VideosGridSkeleton} from "@/app/ui/skeletons";

export const metadata: Metadata = {
    title: 'Videos',
};

export default async function Page(props: {
    searchParams?: Promise<{
        query?: string;
        category?: string;
        type?: string;
        tag?: string;
        page?: string;
    }>;
}) {
    // 获取URL地址栏参数
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const category = searchParams?.category || '';
    const type = searchParams?.type || '';
    const tag = searchParams?.tag || '';
    const currentPage = Number(searchParams?.page) || 1;

    const total = 500;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Videos</h1>
            </div>
            <div className="flex items-center justify-between gap-2 ">
                <SearchBox/>
            </div>

            <Suspense key={type + tag + currentPage} fallback={<VideosGridSkeleton/>}>
                <Grid query={query} category={category} type={type} tag={tag} currentPage={currentPage}/>
            </Suspense>
            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages}/>
            </div>
        </div>
    );
}