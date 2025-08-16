'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified auth page
    router.replace('/auth');
  }, [router]);

  return null;
}