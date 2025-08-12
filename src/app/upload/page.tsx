'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified flow
    router.replace('/resume-select');
  }, [router]);

  return null;
}