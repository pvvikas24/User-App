
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
    
    useEffect(() => {
        if (trackingState !== 'tracking') {
            router.push('/');
        }
    }, [trackingState, router]);

    if (trackingState !== 'tracking') {
        return null;
    }


    return <Dashboard 
        selectedBusId={busId}
        userStartLocation={startLocation}
        userDestination={destination}
    />;
}
