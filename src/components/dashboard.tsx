
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, Pin } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '@/lib/config';
import { initialBuses, routes, busStops } from '@/lib/data';
import type { Bus, LatLng, Route } from '@/lib/types';
import Logo from './logo';
import BusIcon from './icons/bus-icon';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDistanceFromLatLonInKm } from '@/lib/utils';
import { Button } from './ui/button';
import { ArrowLeft, Users, Clock, MapPin, Route as RouteIcon, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

const CustomPolyline = ({ path, color }: { path: LatLng[]; color: string }) => {
    const map = useMap();
  
    useEffect(() => {
      if (!map || path.length === 0) return;
  
      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 6,
      });
  
      polyline.setMap(map);
  
      return () => {
        polyline.setMap(null);
      };
    }, [map, path, color]);
  
    return null;
  };

type DashboardProps = {
    selectedBusId: string;
    userStartLocation: string;
    userDestination: string;
}

const OnboardPrompt = ({ onOnboard, onCancel }: { onOnboard: () => void; onCancel: () => void; }) => (
    <div className="absolute bottom-4 right-4 z-20">
        <Card className="bg-background/90 backdrop-blur-sm border-primary/50 shadow-2xl">
            <CardHeader>
                <CardTitle>Bus Has Arrived!</CardTitle>
                <CardDescription>Are you ready to board?</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={onOnboard}>Onboard</Button>
            </CardFooter>
        </Card>
    </div>
);


const Dashboard = ({ selectedBusId }: DashboardProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const start = searchParams.get('start');
  const destination = searchParams.get('destination');
  const { toast } = useToast();

  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LatLng | null>(null);

  const initialCenter = useMemo(() => {
    const bus = initialBuses.find(b => b.id === selectedBusId);
    return bus ? bus.position : { lat: 31.1471, lng: 75.3412 }; // Default to Punjab center
  }, [selectedBusId]);

  const [status, setStatus] = useState('Bus is en-route to your location');
  const [onboard, setOnboard] = useState(false);
  const [showOnboardPrompt, setShowOnboardPrompt] = useState(false);

  const selectedBus = useMemo(() => buses.find(b => b.id === selectedBusId), [buses, selectedBusId]);
  const route = useMemo(() => routes.find(r => r.id === selectedBus?.routeId), [selectedBus]);
  
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  const onboardTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMissedBus = useCallback(() => {
    setShowOnboardPrompt(false);
    toast({
        title: "Bus has left",
        description: "You missed the bus. Please search for another one.",
        variant: "destructive",
    });
    setTimeout(() => router.push('/'), 2000);
  },[router, toast]);

  useEffect(() => {
    const targetLocation = onboard ? destinationLocation : userLocation;
    if (targetLocation && selectedBus) {
      const dist = getDistanceFromLatLonInKm(
        targetLocation.lat,
        targetLocation.lng,
        selectedBus.position.lat,
        selectedBus.position.lng
      );
      setDistance(dist);

      const AVERAGE_SPEED_KMPH = 20; // Slowed down average speed
      const etaHours = dist / AVERAGE_SPEED_KMPH;
      setEta(Math.round(etaHours * 60));
    }
  }, [selectedBus, userLocation, destinationLocation, onboard]);

  useEffect(() => {
    const startStop = busStops.find(s => s.name === start);
    const destStop = busStops.find(s => s.name === destination);
    if(startStop) setUserLocation(startStop.position);
    if(destStop) setDestinationLocation(destStop.position);
  }, [start, destination]);

  useEffect(() => {
    if (!userLocation || !selectedBus || onboard) return;

    const distanceToUser = getDistanceFromLatLonInKm(
        selectedBus.position.lat,
        selectedBus.position.lng,
        userLocation.lat,
        userLocation.lng
    );

    if(distanceToUser < 0.1 && !showOnboardPrompt) { // smaller threshold for arrival
        setShowOnboardPrompt(true);
    }

  }, [selectedBus, userLocation, onboard, showOnboardPrompt]);

  useEffect(() => {
      if (showOnboardPrompt) {
          onboardTimeoutRef.current = setTimeout(handleMissedBus, 5000);
      }
      return () => {
          if (onboardTimeoutRef.current) {
              clearTimeout(onboardTimeoutRef.current);
          }
      };
  }, [showOnboardPrompt, handleMissedBus]);

  const handleOnboard = () => {
    if (onboardTimeoutRef.current) {
        clearTimeout(onboardTimeoutRef.current);
    }
    setOnboard(true);
    setShowOnboardPrompt(false);
    setStatus('You are onboard. Heading to destination.');
  }

  const handleCancelOnboard = () => {
      if (onboardTimeoutRef.current) {
        clearTimeout(onboardTimeoutRef.current);
      }
      setShowOnboardPrompt(false);
      router.back();
  }

  useEffect(() => {
    const interval = setInterval(() => {
        if (!selectedBus || !route) return;

        setBuses(prevBuses =>
            prevBuses.map(bus => {
                if (bus.id !== selectedBus.id) return bus;

                // Find the segment of the route the bus is on
                let currentSegmentIndex = -1;
                for (let i = 0; i < route.path.length - 1; i++) {
                    const distToStart = getDistanceFromLatLonInKm(bus.position.lat, bus.position.lng, route.path[i].lat, route.path[i].lng);
                    const distToEnd = getDistanceFromLatLonInKm(bus.position.lat, bus.position.lng, route.path[i+1].lat, route.path[i+1].lng);
                    const segmentLength = getDistanceFromLatLonInKm(route.path[i].lat, route.path[i].lng, route.path[i+1].lat, route.path[i+1].lng);
                    if (distToStart + distToEnd - segmentLength < 0.1) { // Check if bus is on segment
                        currentSegmentIndex = i;
                        break;
                    }
                }

                if (currentSegmentIndex === -1) {
                    // Snap to the closest point if not on a segment
                    let closestIndex = 0;
                    let minDistance = Infinity;
                    route.path.forEach((p, index) => {
                        const dist = getDistanceFromLatLonInKm(bus.position.lat, bus.position.lng, p.lat, p.lng);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestIndex = index;
                        }
                    });
                    currentSegmentIndex = closestIndex < route.path.length - 1 ? closestIndex : route.path.length - 2;
                }
                
                const destinationStop = busStops.find(s => s.name === destination);
                if (destinationStop && onboard) {
                    const distToDestination = getDistanceFromLatLonInKm(bus.position.lat, bus.position.lng, destinationStop.position.lat, destinationStop.position.lng);
                    if (distToDestination < 0.1) {
                        clearInterval(interval);
                        setStatus('You have arrived at your destination.');
                        return bus;
                    }
                }

                const targetPoint = route.path[currentSegmentIndex + 1];
                const distanceToTarget = getDistanceFromLatLonInKm(bus.position.lat, bus.position.lng, targetPoint.lat, targetPoint.lng);
                
                const speedKmph = 20; // km/h
                const intervalSeconds = 2;
                const distanceCovered = (speedKmph * (intervalSeconds / 3600));

                if (distanceToTarget <= distanceCovered) {
                    // Snap to the target point and move to the next segment in the next iteration
                    if (currentSegmentIndex + 2 >= route.path.length) {
                        clearInterval(interval);
                        return { ...bus, position: targetPoint };
                    }
                    return { ...bus, position: targetPoint };
                } else {
                    // Interpolate position
                    const fraction = distanceCovered / distanceToTarget;
                    const newLat = bus.position.lat + (targetPoint.lat - bus.position.lat) * fraction;
                    const newLng = bus.position.lng + (targetPoint.lng - bus.position.lng) * fraction;
                    return { ...bus, position: { lat: newLat, lng: newLng } };
                }
            })
        );
    }, 2000); 

    return () => clearInterval(interval);
}, [selectedBus, route, destination, onboard]);
  
  const pathToUser = useMemo(() => {
      if (!selectedBus || !userLocation || onboard) return [];
      const route = routes.find(r => r.id === selectedBus.routeId);
      if (!route) return [];

      let busIndexOnPath = -1;
      let minDistanceSoFar = Infinity;
      route.path.forEach((p, index) => {
          const dist = getDistanceFromLatLonInKm(selectedBus.position.lat, selectedBus.position.lng, p.lat, p.lng);
          if (dist < minDistanceSoFar) {
              minDistanceSoFar = dist;
              busIndexOnPath = index;
          }
      });
      

      const userStop = busStops.find(s => s.name === start);
      if(!userStop) return [];
      const userStopPathIndex = route.path.findIndex(p => p.lat === userStop.position.lat && p.lng === userStop.position.lng);

      if (busIndexOnPath === -1 || userStopPathIndex === -1 || busIndexOnPath >= userStopPathIndex) return [];
      
      return route.path.slice(busIndexOnPath, userStopPathIndex + 1);

  }, [selectedBus, userLocation, onboard, start]);
  
  const pathFromUserToDestination = useMemo(() => {
    if (!selectedBus || !destinationLocation || !onboard) return [];
    const route = routes.find(r => r.id === selectedBus.routeId);
    if (!route) return [];
  
    let busIndexOnPath = -1;
    let minDistanceSoFar = Infinity;
      route.path.forEach((p, index) => {
          const dist = getDistanceFromLatLonInKm(selectedBus.position.lat, selectedBus.position.lng, p.lat, p.lng);
          if (dist < minDistanceSoFar) {
              minDistanceSoFar = dist;
              busIndexOnPath = index;
          }
      });
  
    const destStop = busStops.find(s => s.name === destination);
    if(!destStop) return [];
    const destStopPathIndex = route.path.findIndex(p => p.lat === destStop.position.lat && p.lng === destStop.position.lng);
  
    if (busIndexOnPath === -1 || destStopPathIndex === -1 || busIndexOnPath >= destStopPathIndex) return [];
    
    return route.path.slice(busIndexOnPath, destStopPathIndex + 1);
  
  }, [selectedBus, destinationLocation, onboard, destination]);


  return (
    <div className="flex flex-col h-screen bg-background">
        <header className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => router.back()} className="shadow-lg">
                <ArrowLeft className="h-5 w-5" />
            </Button>
             <div className="p-1 rounded-lg">
                <Logo />
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
            <Tabs defaultValue="map" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="map">Live Map</TabsTrigger>
                    <TabsTrigger value="details">Ride Details</TabsTrigger>
                </TabsList>
                <TabsContent value="map" className="h-[calc(100vh-150px)] relative">
                    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                        <Map
                            mapId="punjab-roadways-map"
                            defaultCenter={initialCenter}
                            defaultZoom={12}
                            disableDefaultUI={false}
                            gestureHandling={'greedy'}
                            className="h-full w-full"
                        >
                            {userLocation && !onboard && (
                                <AdvancedMarker position={userLocation} title="Your Location">
                                <Pin><div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div></Pin>
                                </AdvancedMarker>
                            )}

                            {destinationLocation && (
                                <AdvancedMarker position={destinationLocation} title="Your Destination">
                                <Pin background={'#4ade80'} glyphColor={'#000000'} borderColor={'#16a34a'} />
                                </AdvancedMarker>
                            )}
                            
                            {selectedBus && (
                                <AdvancedMarker
                                key={selectedBus.id}
                                position={selectedBus.position}
                                >
                                <BusIcon className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer drop-shadow-lg" />
                                </AdvancedMarker>
                            )}

                            {!onboard && <CustomPolyline path={pathToUser} color="hsl(var(--primary))" />}
                            {onboard && <CustomPolyline path={pathFromUserToDestination} color="#22c55e" />}
                        </Map>
                         {showOnboardPrompt && <OnboardPrompt onOnboard={handleOnboard} onCancel={handleCancelOnboard} />}
                    </APIProvider>
                </TabsContent>
                <TabsContent value="details">
                   {selectedBus && (
                     <div className="p-4 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-primary font-bold">Bus #{selectedBus.id}</CardTitle>
                                <CardDescription>{route?.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <div className="flex items-center gap-2 text-amber-400 font-semibold mb-4">
                                    <RouteIcon className="h-4 w-4" />
                                    <span>{status}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">ETA</p>
                                            <p className="font-bold">{eta !== null ? `${eta} mins` : 'Calculating...'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Distance</p>
                                            <p className="font-bold">{distance !== null ? `${distance.toFixed(1)} km` : 'Calculating...'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Passengers</p>
                                            <p className="font-bold">{selectedBus.passengerCount}</p>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Wind className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Type</p>
                                            <p className="font-bold">{selectedBus.type}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Your Journey</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p><span className="font-semibold">From:</span> {start}</p>
                                <p><span className="font-semibold">To:</span> {destination}</p>
                            </CardContent>
                        </Card>
                     </div>
                   )}
                </TabsContent>
            </Tabs>
        </main>

    </div>
  );
};

export default Dashboard;

    