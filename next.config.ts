import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Auth endpoints
      {
        source: '/api/auth/:path*',
        destination: 'https://resume-bknd.onrender.com/auth/:path*',
      },
      // Health endpoints
      {
        source: '/api/health',
        destination: 'https://resume-bknd.onrender.com/health',
      },
      {
        source: '/api/version',
        destination: 'https://resume-bknd.onrender.com/version',
      },
      // Resume endpoints
      {
        source: '/api/resumes/:path*',
        destination: 'https://resume-bknd.onrender.com/resumes/:path*',
      },
      // Analysis endpoints
      {
        source: '/api/analyze/:path*',
        destination: 'https://resume-bknd.onrender.com/analyze/:path*',
      },
      // Comparison endpoints
      {
        source: '/api/compare/:path*',
        destination: 'https://resume-bknd.onrender.com/compare/:path*',
      },
      // Document endpoints
      {
        source: '/api/document/:path*',
        destination: 'https://resume-bknd.onrender.com/document/:path*',
      },
      // Convert endpoints
      {
        source: '/api/convert/:path*',
        destination: 'https://resume-bknd.onrender.com/convert/:path*',
      },
      // Dashboard endpoints
      {
        source: '/api/me/:path*',
        destination: 'https://resume-bknd.onrender.com/me/:path*',
      },
    ];
  },
};

export default nextConfig;
