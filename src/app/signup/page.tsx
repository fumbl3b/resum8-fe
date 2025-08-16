'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified auth page with signup mode
    router.replace('/auth?mode=signup');
  }, [router]);

  return null;
}