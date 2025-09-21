
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, Pin } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '@/lib/config';
import { initialBuses, routes, busStops } from '@/lib/data';
import type { Bus, LatLng } from '@/lib/types';
import Logo from './logo';
import BusIcon from './icons/bus-icon';
import { useRouter } from 'next/navigation';
import { getDistanceFromLatLonInKm } from '@/lib/utils';
import { Button } from './ui/button';
import { ArrowLeft, Users, Clock, MapPin, Route as RouteIcon, IndianRupee, Siren } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useTracking } from '@/contexts/TrackingContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
    initialBusPosition: LatLng;
    initialPathIndex: number;
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

const GetDownPrompt = ({ onGetDown, destination }: { onGetDown: () => void; destination: string; }) => (
    <div className="absolute bottom-4 right-4 z-20">
        <Card className="bg-background/90 backdrop-blur-sm border-primary/50 shadow-2xl">
            <CardHeader>
                <CardTitle>Destination Reached!</CardTitle>
                <CardDescription>You have arrived at {destination}.</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end">
                <Button onClick={onGetDown}>Get Down</Button>
            </CardFooter>
        </Card>
    </div>
);

const SosDialog = () => {
    const { toast } = useToast();
    const handleSosConfirm = () => {
        toast({
            title: "SOS Signal Sent",
            description: "Emergency services have been notified of your location.",
            variant: "destructive",
        })
    }
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="w-full flex items-center gap-2">
                    <Siren className="h-5 w-5" />
                    SOS
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Emergency</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will immediately alert emergency services with your current location. Only use this in a genuine emergency.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSosConfirm}>Confirm SOS</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


const Dashboard = ({ selectedBusId, userStartLocation, userDestination, initialBusPosition, initialPathIndex }: DashboardProps) => {
  const router = useRouter();
  const { setTrackingState } = useTracking();
  const { toast } = useToast();

  const [buses, setBuses] = useState<Bus[]>(() => 
    initialBuses.map(b => 
        b.id === selectedBusId ? { ...b, position: initialBusPosition, currentPathIndex: initialPathIndex } : b
    )
  );

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LatLng | null>(null);

  const initialCenter = useMemo(() => {
    return initialBusPosition;
  }, [initialBusPosition]);

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
  
  const AVERAGE_SPEED_KMPH = 1000; 

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
    let targetLocation: LatLng | null = null;
    if (tripFinishedForUser) {
        targetLocation = route?.path[route.path.length - 1] ?? null;
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
  }, [selectedBus, userLocation, destinationLocation, onboard, tripFinishedForUser, route, AVERAGE_SPEED_KMPH]);

  useEffect(() => {
    const startStop = busStops.find(s => s.name === userStartLocation);
    const destStop = busStops.find(s => s.name === userDestination);
    if(startStop) setUserLocation(startStop.position);
    if(destStop) setDestinationLocation(destStop.position);
  }, [userStartLocation, userDestination]);


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
    
    setTimeout(() => {
        setTrackingState('authenticated');
        router.push('/');
    }, 3000);
  }

  useEffect(() => {
    if (!route || !userLocation || !destinationLocation) return;
  
    const currentPathIndexRef = { current: initialPathIndex };

    simulationIntervalRef.current = setInterval(() => {
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
             if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

            if (tripFinishedForUser) {
                 return prevBuses;
            }

            if (!onboard) {
                setStatus('Bus has arrived at your location.');
                setShowOnboardPrompt(true);
            } else {
                setStatus('You have arrived at your destination.');
                setShowGetDownPrompt(true);
            }
            return prevBuses.map(b => b.id === selectedBusId ? { ...b, position: tickTargetLocation } : b);
        }
        
        let currentPathIndex = currentBus.currentPathIndex ?? currentPathIndexRef.current;

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
        
        return prevBuses.map(b => b.id === selectedBusId ? { ...b, position: newPosition, currentPathIndex } : b);
      });
    }, 100); 
  
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [selectedBusId, route, onboard, userLocation, destinationLocation, toast, handleMissedBus, tripFinishedForUser, initialPathIndex, AVERAGE_SPEED_KMPH]);
  
  const displayPath = useMemo(() => {
    if (!selectedBus || !route) return [];

    const currentBusIndexOnPath = selectedBus.currentPathIndex ?? initialPathIndex;

    let targetPathIndex = -1;
    let targetPosition: LatLng | null = null;
    
    if (tripFinishedForUser) {
        targetPathIndex = route.path.length - 1;
        targetPosition = route.path[targetPathIndex];
    } else if (onboard) {
        targetPosition = destinationLocation;
    } else {
        targetPosition = userLocation;
    }
    
    if (!targetPosition) return [];

    let minTargetDist = Infinity;
    route.path.forEach((p, index) => {
        const dist = getDistanceFromLatLonInKm(targetPosition!.lat, targetPosition!.lng, p.lat, p.lng);
        if (dist < minTargetDist) {
            minTargetDist = dist;
            targetPathIndex = index;
        }
    });

    if (targetPathIndex === -1 || currentBusIndexOnPath > targetPathIndex) return [selectedBus.position];
    
    const remainingPath = route.path.slice(currentBusIndexOnPath, targetPathIndex + 1);
    
    // Prepend the current bus position to the start of the path for a smooth line
    if (getDistanceFromLatLonInKm(selectedBus.position.lat, selectedBus.position.lng, remainingPath[0].lat, remainingPath[0].lng) > 0.01) {
        return [selectedBus.position, ...remainingPath];
    }

    return remainingPath;
}, [selectedBus, route, onboard, userLocation, destinationLocation, tripFinishedForUser, initialPathIndex]);


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
                            
                            <CustomPolyline path={displayPath} color={onboard ? "#22c55e" : "hsl(var(--primary))"} />
                        </Map>
                         {showOnboardPrompt && <OnboardPrompt onOnboard={handleOnboard} onCancel={handleCancelOnboard} />}
                         {showGetDownPrompt && <GetDownPrompt onGetDown={handleGetDown} destination={userDestination} />}
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
                                        <Users className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Crowd</p>
                                            <p className="font-bold capitalize">{selectedBus.crowd}</p>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <IndianRupee className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Ticket Price</p>
                                            <p className="font-bold">{selectedBus.ticketPrice}</p>
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
                                <p><span className="font-semibold">From:</span> {userStartLocation}</p>
                                <p><span className="font-semibold">To:</span> {userDestination}</p>
                            </CardContent>
                        </Card>
                        <SosDialog />
                     </div>
                   )}
                </TabsContent>
            </Tabs>
        </main>

    </div>
  );
};

export default Dashboard;
