import {CheckIcon, ClockIcon} from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function VideoStatus({status}: { status: string }) {
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full px-2 py-1 text-xs',
                {
                    'bg-gray-100 text-gray-500': status === 'old',
                    'bg-red-500 text-white': status === 'is_new',
                },
            )}
        >
      {status === 'old' ? (
          <>
              Old
              <ClockIcon className="ml-1 w-4 text-gray-500"/>
          </>
      ) : null}
            {status === 'is_new' ? (
                <>
                    New
                    <CheckIcon className="ml-1 w-4 text-white"/>
                </>
            ) : null}
    </span>
    );
}
