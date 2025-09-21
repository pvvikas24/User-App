
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { initialBuses, routes, busStops } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, MapPin, IndianRupee } from 'lucide-react';
import { useTracking } from '@/contexts/TrackingContext';
import type { Route, Bus } from '@/lib/types';
import { getDistanceFromLatLonInKm } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/main-layout';

const BusListPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setTrackingState } = useTracking();
    
    const [liveBuses, setLiveBuses] = useState<Bus[]>(initialBuses);

    const start = searchParams.get('start');
    const destination = searchParams.get('destination');

    const startStopInfo = React.useMemo(() => busStops.find(s => s.name === start), [start]);

    // Simulate bus movement and passenger count for all buses
    useEffect(() => {
        const simulationInterval = setInterval(() => {
            setLiveBuses(currentBuses => {
                return currentBuses.map(bus => {
                    const route = routes.find(r => r.id === bus.routeId);
                    if (!route) return bus;

                    // --- Bus Position Simulation ---
                    let currentPathIndex = bus.currentPathIndex ?? 0;
                    
                    if (currentPathIndex >= route.path.length - 1) {
                        // Reset bus to start of the route to keep simulation running
                        return { ...bus, position: route.path[0], currentPathIndex: 0};
                    }

                    const nextPoint = route.path[currentPathIndex + 1];
                    
                    const AVERAGE_SPEED_KMPH = 1000;
                    const SIMULATION_TICK_SECONDS = 1;
                    const distancePerTick = (AVERAGE_SPEED_KMPH * (SIMULATION_TICK_SECONDS / 3600));

                    const distanceToNextPoint = getDistanceFromLatLonInKm(bus.position.lat, bus.position.lng, nextPoint.lat, nextPoint.lng);

                    let newPosition = { ...bus.position };

                    if (distancePerTick >= distanceToNextPoint) {
                        newPosition = nextPoint;
                        currentPathIndex++;
                    } else {
                        const fraction = distancePerTick / distanceToNextPoint;
                        newPosition = {
                            lat: bus.position.lat + (nextPoint.lat - bus.position.lat) * fraction,
                            lng: bus.position.lng + (nextPoint.lng - bus.position.lng) * fraction,
                        };
                    }
                    
                    // --- Passenger Simulation ---
                    let newPassengerCount = bus.passengerCount;
                    // 5% chance of passenger change every second to simulate discrete changes
                    if (Math.random() < 0.05) { 
                        const change = Math.floor(Math.random() * 6) - 3; // change between -3 and 3
                        newPassengerCount = Math.max(0, Math.min(60, newPassengerCount + change));
                    }
                    
                    let newCrowd: 'low' | 'medium' | 'high';
                    if (newPassengerCount < 20) {
                        newCrowd = 'low';
                    } else if (newPassengerCount < 45) {
                        newCrowd = 'medium';
                    } else {
                        newCrowd = 'high';
                    }

                    return {
                        ...bus,
                        position: newPosition,
                        currentPathIndex: currentPathIndex,
                        passengerCount: newPassengerCount,
                        crowd: newCrowd
                    };
                });
            });
        }, 1000); // Update every second

        return () => clearInterval(simulationInterval);
    }, []);

    const availableBuses = React.useMemo(() => {
        if (!start || !destination) return [];
        
        const destinationStopInfo = busStops.find(s => s.name === destination);
        
        if (!startStopInfo || !destinationStopInfo) return [];

        const relevantRoutes = routes.filter(r => {
            const startIndex = r.stops.indexOf(startStopInfo.id);
            const destIndex = r.stops.indexOf(destinationStopInfo.id);
            return startIndex !== -1 && destIndex !== -1 && startIndex < destIndex;
        });

        if (relevantRoutes.length === 0) return [];

        return liveBuses.filter(bus => {
            const busRoute = relevantRoutes.find(r => r.id === bus.routeId);
            if (!busRoute) return false;

            // Find the index of the bus's current position on its route path
            const busCurrentStopIndex = busRoute.stops.map(stopId => busStops.find(s => s.id === stopId)!).findIndex(stop => {
                if (!stop) return false;
                return getDistanceFromLatLonInKm(bus.position.lat, bus.position.lng, stop.position.lat, stop.position.lng) < 1; // within 1km of a stop
            });

            const userStartIndex = busRoute.stops.indexOf(startStopInfo.id);

            // Show bus if it's before the user's starting stop
            return busCurrentStopIndex <= userStartIndex;

        }).map(bus => {
            const distance = getDistanceFromLatLonInKm(
                startStopInfo.position.lat,
                startStopInfo.position.lng,
                bus.position.lat,
                bus.position.lng
            );
            return {
                ...bus,
                routeDetails: relevantRoutes.find(r => r.id === bus.routeId),
                distance,
            }
        }).sort((a, b) => a.distance - b.distance);
    }, [start, destination, liveBuses, startStopInfo]);

    const handleSelectBus = (busId: string, currentLat: number, currentLng: number, currentPathIndex: number) => {
        setTrackingState('tracking');
        router.push(`/tracking/${busId}?start=${start}&destination=${destination}&lat=${currentLat}&lng=${currentLng}&pathIndex=${currentPathIndex}`);
    };

    const handleGoBack = () => {
        router.push('/');
    }

    const getCrowdBadgeVariant = (crowd: 'low' | 'medium' | 'high') => {
        switch (crowd) {
            case 'low':
                return 'default';
            case 'medium':
                return 'secondary';
            case 'high':
                return 'destructive';
        }
    }

    return (
        <MainLayout>
            <div className="p-4 md:p-8">
                <header className="mb-8">
                </header>
                <main>
                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Buses</CardTitle>
                                <CardDescription>
                                    Showing buses from <span className="font-semibold text-primary">{start}</span> to <span className="font-semibold text-primary">{destination}</span>. Distances are updated live.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {availableBuses.length > 0 ? (
                                    availableBuses.map(bus => (
                                        <Card key={bus.id} className="bg-secondary/50">
                                            <CardHeader>
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-xl">Bus #{bus.id}</CardTitle>
                                                    <Badge variant={getCrowdBadgeVariant(bus.crowd)} className="capitalize">{bus.crowd} Crowd</Badge>
                                                </div>
                                                <CardDescription>{(bus.routeDetails as Route)?.name}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex justify-between items-center">
                                                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        <span>{bus.distance.toFixed(1)} km away</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="w-4 h-4 text-muted-foreground" />
                                                        <span>{bus.passengerCount} passengers</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                                        <IndianRupee className="w-4 h-4 text-muted-foreground" />
                                                        <span>{bus.ticketPrice}</span>
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleSelectBus(bus.id, bus.position.lat, bus.position.lng, bus.currentPathIndex ?? 0)} className="mt-4 sm:mt-0">
                                                    Track Bus <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No direct buses found for the selected route. They may be ahead of your stop.
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter>
                            <Button variant="outline" onClick={handleGoBack}>Go Back</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </main>
            </div>
        </MainLayout>
    );
};

export default BusListPage;
