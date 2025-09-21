
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useTracking } from '@/contexts/TrackingContext';

const CustomPolyline = ({ path, color }: { path: LatLng[]; color: string }) => {
    const map = useMap();
  
    useEffect(() => {
      if (!map) return;
  
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

const GetDownPrompt = ({ onGetDown }: { onGetDown: () => void; }) => (
    <div className="absolute bottom-4 right-4 z-20">
        <Card className="bg-background/90 backdrop-blur-sm border-primary/50 shadow-2xl">
            <CardHeader>
                <CardTitle>Destination Reached!</CardTitle>
                <CardDescription>You have arrived at {useSearchParams().get('destination')}.</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end">
                <Button onClick={onGetDown}>Get Down</Button>
            </CardFooter>
        </Card>
    </div>
);


const Dashboard = ({ selectedBusId }: DashboardProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTrackingState } = useTracking();

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
  const [showGetDownPrompt, setShowGetDownPrompt] = useState(false);
  const [tripFinishedForUser, setTripFinishedForUser] = useState(false);

  const selectedBus = useMemo(() => buses.find(b => b.id === selectedBusId), [buses, selectedBusId]);
  const route = useMemo(() => routes.find(r => r.id === selectedBus?.routeId), [selectedBus]);
  
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  const onboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPathIndexRef = useRef(0);
  
  const AVERAGE_SPEED_KMPH = 1000; // Average speed of the bus in km/h

  const handleGoBack = () => {
    setTrackingState('authenticated');
    router.back();
  }

  const handleMissedBus = useCallback(() => {
    setShowOnboardPrompt(false);
    toast({
        title: "Bus has left",
        description: "You missed the bus. Please search for another one.",
        variant: "destructive",
    });
    setTimeout(() => {
        setTrackingState('authenticated');
        router.push('/');
    }, 2000);
  },[router, toast, setTrackingState]);
  

  useEffect(() => {
    let targetLocation = null;
    if (tripFinishedForUser) {
        targetLocation = route?.path[route.path.length-1] ?? null;
    } else {
        targetLocation = onboard ? destinationLocation : userLocation;
    }
   
    if (targetLocation && selectedBus) {
      const dist = getDistanceFromLatLonInKm(
        targetLocation.lat,
        targetLocation.lng,
        selectedBus.position.lat,
        selectedBus.position.lng
      );
      setDistance(dist);
      
      const etaHours = dist / AVERAGE_SPEED_KMPH;
      setEta(Math.round(etaHours * 60));
    }
  }, [selectedBus, userLocation, destinationLocation, onboard, tripFinishedForUser, route]);

  useEffect(() => {
    const startStop = busStops.find(s => s.name === start);
    const destStop = busStops.find(s => s.name === destination);
    if(startStop) setUserLocation(startStop.position);
    if(destStop) setDestinationLocation(destStop.position);
  }, [start, destination]);


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
      handleGoBack();
  }
  
  const handleGetDown = () => {
    setShowGetDownPrompt(false);
    setTripFinishedForUser(true);
    setStatus('Bus is continuing to its final destination.');
    toast({ title: "Trip Complete!", description: "Hope you had a pleasant journey."});
    
    // Allow bus to continue, then redirect user.
    setTimeout(() => {
        setTrackingState('authenticated');
        router.push('/');
    }, 3000);
  }

  useEffect(() => {
    if (!route || !userLocation || !destinationLocation) return;
  
    let closestPathIndex = -1;
    let minDistance = Infinity;

    route.path.forEach((point, index) => {
        const d = getDistanceFromLatLonInKm(initialBuses.find(b => b.id === selectedBusId)!.position.lat, initialBuses.find(b => b.id === selectedBusId)!.position.lng, point.lat, point.lng);
        if (d < minDistance) {
            minDistance = d;
            closestPathIndex = index;
        }
    });

    const userStopInfo = busStops.find(s => s.name === start);
    let userStopIndexOnPath = -1;
    if (userStopInfo) {
      let minUserStopDistance = Infinity;
      route.path.forEach((point, index) => {
        const d = getDistanceFromLatLonInKm(userStopInfo.position.lat, userStopInfo.position.lng, point.lat, point.lng);
        if (d < minUserStopDistance) {
          minUserStopDistance = d;
          userStopIndexOnPath = index;
        }
      });
    }

    if (closestPathIndex >= userStopIndexOnPath && userStopIndexOnPath > 0) {
      closestPathIndex = Math.max(0, userStopIndexOnPath - 10);
      const startPosition = route.path[closestPathIndex];
      setBuses(prevBuses => prevBuses.map(b => b.id === selectedBusId ? {...b, position: startPosition} : b));
    } else if (closestPathIndex === -1) {
      closestPathIndex = 0;
    }
    
    currentPathIndexRef.current = closestPathIndex;
  
    simulationIntervalRef.current = setInterval(() => {
      let currentPathIndex = currentPathIndexRef.current;
      setBuses(prevBuses => {
        const currentBus = prevBuses.find(b => b.id === selectedBusId);
        if (!currentBus) return prevBuses;
  
        let tickTargetLocation: LatLng;
        if (tripFinishedForUser) {
            tickTargetLocation = route.path[route.path.length-1];
        } else {
            tickTargetLocation = onboard ? destinationLocation : userLocation;
        }

        const distanceToFinalTarget = getDistanceFromLatLonInKm(currentBus.position.lat, currentBus.position.lng, tickTargetLocation.lat, tickTargetLocation.lng);

        const simulationTickSeconds = 0.1; 
        const distancePerTick = (AVERAGE_SPEED_KMPH * (simulationTickSeconds / 3600));

        if (distanceToFinalTarget < distancePerTick * 2) {
            if (tripFinishedForUser) {
                 if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
                 return prevBuses;
            }

            if (!onboard) {
                setStatus('Bus has arrived at your location.');
                setShowOnboardPrompt(true);
                if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            } else {
                setStatus('You have arrived at your destination.');
                setShowGetDownPrompt(true);
                if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            }
            return prevBuses.map(b => b.id === selectedBusId ? { ...b, position: tickTargetLocation } : b);
        }

        if (currentPathIndex >= route.path.length - 1) {
          if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
          return prevBuses;
        }

        let totalDistanceToTravel = distancePerTick;
        let newPosition = { ...currentBus.position };

        while (totalDistanceToTravel > 0 && currentPathIndex < route.path.length - 1) {
          const nextPoint = route.path[currentPathIndex + 1];
          const distanceToNextPoint = getDistanceFromLatLonInKm(newPosition.lat, newPosition.lng, nextPoint.lat, nextPoint.lng);

          if (totalDistanceToTravel >= distanceToNextPoint) {
            totalDistanceToTravel -= distanceToNextPoint;
            newPosition = nextPoint;
            currentPathIndex++;
          } else {
            const fraction = totalDistanceToTravel / distanceToNextPoint;
            newPosition = {
              lat: newPosition.lat + (nextPoint.lat - newPosition.lat) * fraction,
              lng: newPosition.lng + (nextPoint.lng - newPosition.lng) * fraction,
            };
            totalDistanceToTravel = 0;
          }
        }
        currentPathIndexRef.current = currentPathIndex;
        return prevBuses.map(b => b.id === selectedBusId ? { ...b, position: newPosition } : b);
      });
    }, 100); 
  
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [selectedBusId, route, onboard, userLocation, destinationLocation, toast, handleMissedBus, start, tripFinishedForUser]);
  
  const displayPath = useMemo(() => {
    if (!selectedBus || !route) return [];

    let currentBusIndexOnPath = -1;
    let minBusDist = Infinity;
    route.path.forEach((p, index) => {
        const dist = getDistanceFromLatLonInKm(selectedBus.position.lat, selectedBus.position.lng, p.lat, p.lng);
        if (dist < minBusDist) {
            minBusDist = dist;
            currentBusIndexOnPath = index;
        }
    });

    if (currentBusIndexOnPath === -1) return [];

    let targetPathIndex = -1;

    if (tripFinishedForUser) {
        targetPathIndex = route.path.length - 1;
    } else if (onboard) {
        const destStop = busStops.find(s => s.name === destination);
        if (!destStop) return [];
        let minDestStopDist = Infinity;
        route.path.forEach((p, index) => {
            const dist = getDistanceFromLatLonInKm(destStop.position.lat, destStop.position.lng, p.lat, p.lng);
            if(dist < minDestStopDist) {
                minDestStopDist = dist;
                targetPathIndex = index;
            }
        });
    } else {
        const userStop = busStops.find(s => s.name === start);
        if (!userStop) return [];
        let minUserStopDist = Infinity;
        route.path.forEach((p, index) => {
            const dist = getDistanceFromLatLonInKm(userStop.position.lat, userStop.position.lng, p.lat, p.lng);
            if (dist < minUserStopDist) {
                minUserStopDist = dist;
                targetPathIndex = index;
            }
        });
    }
    
    if (targetPathIndex === -1 || currentBusIndexOnPath > targetPathIndex) return [selectedBus.position];
    
    const remainingPath = route.path.slice(currentBusIndexOnPath, targetPathIndex + 1);
    
    if (getDistanceFromLatLonInKm(selectedBus.position.lat, selectedBus.position.lng, remainingPath[0].lat, remainingPath[0].lng) > 0.01) {
        return [selectedBus.position, ...remainingPath];
    }

    return remainingPath;
}, [selectedBus, route, onboard, start, destination, tripFinishedForUser]);


  return (
    <div className="flex flex-col h-screen bg-background">
        <header className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={handleGoBack} className="shadow-lg">
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
                            {userLocation && !onboard && !tripFinishedForUser && (
                                <AdvancedMarker position={userLocation} title="Your Location">
                                <Pin><div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div></Pin>
                                </AdvancedMarker>
                            )}
                             {onboard && userLocation && selectedBus && !tripFinishedForUser && (
                                <AdvancedMarker position={selectedBus.position} title="Your Location">
                                    <span className="text-2xl">🙋‍♂️</span>
                                </AdvancedMarker>
                            )}

                            {destinationLocation && !tripFinishedForUser && (
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
                            
                            <CustomPolyline path={displayPath} color={onboard ? "#22c55e" : "hsl(var(--primary))"} />
                        </Map>
                         {showOnboardPrompt && <OnboardPrompt onOnboard={handleOnboard} onCancel={handleCancelOnboard} />}
                         {showGetDownPrompt && <GetDownPrompt onGetDown={handleGetDown} />}
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

    