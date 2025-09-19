import {NextConfig} from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {protocol: 'https', hostname: 'img1.doubanio.com'},
            {protocol: 'https', hostname: 'img2.doubanio.com'},
            {protocol: 'https', hostname: 'img3.doubanio.com'},
            {protocol: 'https', hostname: 'img4.doubanio.com'},
            {protocol: 'https', hostname: 'img5.doubanio.com'},
            {protocol: 'https', hostname: 'img6.doubanio.com'},
            {protocol: 'https', hostname: 'img7.doubanio.com'},
            {protocol: 'https', hostname: 'img8.doubanio.com'},
            {protocol: 'https', hostname: 'img9.doubanio.com'},
        ],
    },
};

export default nextConfig;
