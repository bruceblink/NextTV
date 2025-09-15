import Link from 'next/link';
import {MapIcon} from "@heroicons/react/16/solid";

export function DetailVideo({id}: { id: string }) {
    return (
        <Link
            href={`/dashboard/videos/${id}`}
            className="rounded-md border p-2 hover:bg-gray-100"
        >
            <MapIcon className="w-5"/>
        </Link>
    );
}
