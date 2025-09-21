'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { initialBuses, routes, busStops } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Wind } from 'lucide-react';
import Logo from '@/components/logo';

const BusListPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const start = searchParams.get('start');
    const destination = searchParams.get('destination');

    const availableBuses = React.useMemo(() => {
        if (!start || !destination) return [];
        return initialBuses.filter(bus => {
            const route = routes.find(r => r.id === bus.routeId);
            if (!route) return false;

            const startStopInfo = busStops.find(s => s.name === start);
            const destinationStopInfo = busStops.find(s => s.name === destination);

            if (!startStopInfo || !destinationStopInfo) return false;

            const startIndex = route.stops.indexOf(startStopInfo.id);
            const destinationIndex = route.stops.indexOf(destinationStopInfo.id);

            // The bus is available if both stops are on the route and the start stop comes before the destination stop.
            return startIndex !== -1 && destinationIndex !== -1 && startIndex < destinationIndex;
        });
    }, [start, destination]);

    const handleSelectBus = (busId: string) => {
        router.push(`/tracking/${busId}?start=${start}&destination=${destination}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="mb-8">
                <Logo />
            </header>
            <main>
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Buses</CardTitle>
                            <CardDescription>
                                Showing buses from <span className="font-semibold text-primary">{start}</span> to <span className="font-semibold text-primary">{destination}</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {availableBuses.length > 0 ? (
                                availableBuses.map(bus => {
                                    const route = routes.find(r => r.id === bus.routeId);
                                    return (
                                        <Card key={bus.id} className="bg-secondary/50">
                                            <CardHeader>
                                                <CardTitle className="text-xl">Bus #{bus.id}</CardTitle>
                                                <CardDescription>{route?.name}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex justify-between items-center">
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="w-4 h-4 text-muted-foreground" />
                                                        <span>{bus.passengerCount} passengers</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Wind className="w-4 h-4 text-muted-foreground" />
                                                        <span>{bus.type}</span>
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleSelectBus(bus.id)}>
                                                    Track Bus <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    No direct buses found for the selected route.
                                </p>
                            )}
                        </CardContent>
                         <CardFooter>
                           <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default BusListPage;
