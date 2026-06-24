/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare Pages 不支持 Next.js 默认图片优化服务，直接使用原图
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
