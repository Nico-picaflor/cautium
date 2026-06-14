/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Landing page uses `textWrap: "balance"` which isn't in React.CSSProperties yet
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
