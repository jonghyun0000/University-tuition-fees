/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel에서는 output: 'export'가 필요 없다. generateStaticParams가 있으므로
  // 기본 빌드에서도 전 페이지가 빌드타임에 정적 생성된다(● SSG).
  // 'export'는 정적 호스팅으로 옮길 때만 켠다.
  trailingSlash: true,
};
export default nextConfig;
