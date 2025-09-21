
'use client';
import React, { useEffect } from 'react';
import { useTracking } from '@/contexts/TrackingContext';
import SearchPage from '@/components/search-page';
import { useRouter } from 'next/navigation';


export default function Home() {
  const { trackingState } = useTracking();
  const router = useRouter();

  useEffect(() => {
    if (trackingState === 'not-authenticated') {
      router.push('/login');
    }
  }, [trackingState, router]);

  if (trackingState !== 'authenticated') {
    return null; // or a loading spinner
  }

  return <SearchPage />;
}
