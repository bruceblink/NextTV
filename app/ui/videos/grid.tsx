import Image from 'next/image';
import {DetailVideo} from '@/app/ui/videos/buttons';
import VideoStatus from '@/app/ui/videos/status';
import {formatCurrency, formatDateToLocal} from '@/app/lib/utils';
import {fetchFilteredVideos} from '@/app/lib/data';

export default async function VideosGrid({
                                                query,
                                                currentPage,
                                            }: {
    query: string;
    currentPage: number;
}) {
    const videos = await fetchFilteredVideos(query, currentPage);

    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                    <div className="md:hidden">
                        {videos?.map((video) => (
                            <div
                                key={video.id}
                                className="mb-2 w-full rounded-md bg-white p-4"
                            >
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div>
                                        <div className="mb-2 flex items-center">
                                            <Image
                                                src={video.image_url}
                                                className="mr-2 rounded-full"
                                                width={28}
                                                height={28}
                                                alt={`${video.name}'s profile picture`}
                                            />
                                            <p>{video.name}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">{video.email}</p>
                                    </div>
                                    <VideoStatus status={video.status}/>
                                </div>
                                <div className="flex w-full items-center justify-between pt-4">
                                    <div>
                                        <p className="text-xl font-medium">
                                            {formatCurrency(video.amount)}
                                        </p>
                                        <p>{formatDateToLocal(video.date)}</p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <DetailVideo id={video.id}/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <table className="hidden min-w-full text-gray-900 md:table">
                        <thead className="rounded-lg text-left text-sm font-normal">
                        <tr>
                            <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                                Video
                            </th>
                            <th scope="col" className="px-3 py-5 font-medium">
                                Rating
                            </th>
                            <th scope="col" className="px-3 py-5 font-medium">
                                Episodes
                            </th>
                            <th scope="col" className="px-3 py-5 font-medium">
                                Date
                            </th>
                            <th scope="col" className="px-3 py-5 font-medium">
                                Type
                            </th>
                            <th scope="col" className="relative py-3 pl-6 pr-3">
                                <span className="sr-only">Detail</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white">
                        {videos?.map((video) => (
                            <tr
                                key={video.id}
                                className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                            >
                                <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={video.image_url}
                                            className="rounded-full"
                                            width={28}
                                            height={28}
                                            alt={`${video.name}'s profile picture`}
                                        />
                                        <p></p>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3">
                                    {}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3">
                                    {}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3">
                                    {}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3">
                                    <VideoStatus status={video.status}/>
                                </td>
                                <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                    <div className="flex justify-end gap-3">
                                        <DetailVideo id={video.id}/>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
