
'use client';

import React, { useEffect } from 'react';
import Dashboard from '@/components/dashboard';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTracking } from '@/contexts/TrackingContext';

export default function TrackingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { trackingState } = useTracking();

    const busId = params.busId as string;
    const startLocation = searchParams.get('start') as string;
    const destination = searchParams.get('destination') as string;
    
    // Get live bus position from query params
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const pathIndex = searchParams.get('pathIndex');
    
    useEffect(() => {
        if (trackingState !== 'tracking') {
            router.push('/');
        }
    }, [trackingState, router]);

    if (trackingState !== 'tracking' || !lat || !lng || !pathIndex) {
        return null;
    }

    const initialBusPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const initialPathIndex = parseInt(pathIndex, 10);

    return <Dashboard 
        selectedBusId={busId}
        userStartLocation={startLocation}
        userDestination={destination}
        initialBusPosition={initialBusPosition}
        initialPathIndex={initialPathIndex}
    />;
}
