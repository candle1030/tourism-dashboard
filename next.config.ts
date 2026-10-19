import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 수업 예제는 기존(Previous Model) 캐시 방식을 사용합니다.
  // page.tsx는 searchParams를 사용하므로 요청 시마다 Supabase에서 최신 값을 읽습니다.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
