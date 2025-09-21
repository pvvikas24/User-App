'use client';

import React from 'react';
import Dashboard from '@/components/dashboard';
import { useParams } from 'next/navigation';

export default function TrackingPage() {
    const params = useParams();
    const busId = params.busId as string;
    const startLocation = params.start as string;
    const destination = params.destination as string;

    return <Dashboard 
        selectedBusId={busId}
        userStartLocation={startLocation}
        userDestination={destination}
    />;
}
