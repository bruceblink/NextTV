import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    images: {
        domains: [  // 允许加载该域名的图片
            'img1.doubanio.com',
            'img2.doubanio.com',
            'img3.doubanio.com',
            'img4.doubanio.com',
            'img5.doubanio.com',
            'img6.doubanio.com',
            'img7.doubanio.com',
            'img8.doubanio.com',
            'img9.doubanio.com',
        ],
    },
};

export default nextConfig;
