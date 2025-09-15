import Form from '@/app/ui/videos/detail-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import {fetchInvoiceById, fetchCustomers} from '@/app/lib/data';
import {notFound} from 'next/navigation';
import {Metadata} from 'next';

export const metadata: Metadata = {
    title: 'Video Detail',
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers(),
    ]);

    if (!invoice) {
        notFound();
    }

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    {label: 'Videos', href: '/dashboard/videos'},
                    {
                        label: 'Video Detail',
                        href: `/dashboard/videos/${id}`,
                        active: true,
                    },
                ]}
            />
            <Form invoice={invoice} customers={customers}/>
        </main>
    );
}
