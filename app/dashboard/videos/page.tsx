import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Grid from '@/app/ui/videos/grid';
import {lusitana} from '@/app/ui/fonts';
import {InvoicesTableSkeleton} from '@/app/ui/skeletons';
import {Suspense} from 'react';
import {fetchInvoicesPages} from '@/app/lib/data';
import {Metadata} from 'next';

export const metadata: Metadata = {
    title: 'Videos',
};

export default async function Page(props: {
    searchParams?: Promise<{
        type?: string;
        tag?: string;
        page?: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    const type = searchParams?.type || '';
    const tag = searchParams?.type || '';
    const currentPage = Number(searchParams?.page) || 1;

    const totalPages = await fetchInvoicesPages(type);

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Videos</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Search placeholder="Search videos..."/>
            </div>
            <Suspense key={type + currentPage} fallback={<InvoicesTableSkeleton/>}>
                <Grid type={type} tag={tag} currentPage={currentPage}/>
            </Suspense>
            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages}/>
            </div>
        </div>
    );
}