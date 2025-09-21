
'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';

type TrackingState = 'not-authenticated' | 'authenticated' | 'tracking';

interface TrackingContextType {
  trackingState: TrackingState;
  setTrackingState: (state: TrackingState) => void;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export const TrackingProvider = ({ children }: { children: ReactNode }) => {
  const [trackingState, setTrackingState] = useState<TrackingState>('not-authenticated');
  const router = useRouter();

  useEffect(() => {
    if (trackingState === 'not-authenticated') {
        router.push('/login');
    } else if (trackingState === 'authenticated') {
        router.push('/');
    }
  }, [trackingState, router]);


  return (
    <TrackingContext.Provider value={{ trackingState, setTrackingState }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};
