import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: 'https://resume-bknd.onrender.com/health',
      },
      {
        source: '/api/analyze/job',
        destination: 'https://resume-bknd.onrender.com/analyze/job',
      },
      {
        source: '/api/resume/extract-text',
        destination: 'https://resume-bknd.onrender.com/resume/extract-text',
      },
      {
        source: '/api/resume/suggest-improvements',
        destination: 'https://resume-bknd.onrender.com/resume/suggest-improvements',
      },
      {
        source: '/api/convert/latex',
        destination: 'https://resume-bknd.onrender.com/convert/latex',
      },
    ];
  },
};

export default nextConfig;
