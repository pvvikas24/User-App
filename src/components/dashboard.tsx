
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, Pin } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '@/lib/config';
import { initialBuses, routes, busStops } from '@/lib/data';
import type { Bus, LatLng, Route } from '@/lib/types';
import Logo from './logo';
import BusIcon from './icons/bus-icon';
import BusDetailsCard from './bus-details-card';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDistanceFromLatLonInKm } from '@/lib/utils';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

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

const Dashboard = ({ selectedBusId }: DashboardProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const start = searchParams.get('start');
  const destination = searchParams.get('destination');

  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LatLng | null>(null);

  const initialCenter = useMemo(() => {
    const bus = initialBuses.find(b => b.id === selectedBusId);
    return bus ? bus.position : { lat: 31.1471, lng: 75.3412 }; // Default to Punjab center
  }, [selectedBusId]);

  const [status, setStatus] = useState('Bus is en-route to your location');
  const [onboard, setOnboard] = useState(false);

  const selectedBus = useMemo(() => buses.find(b => b.id === selectedBusId), [buses, selectedBusId]);

  useEffect(() => {
    const startStop = busStops.find(s => s.name === start);
    const destStop = busStops.find(s => s.name === destination);
    if(startStop) setUserLocation(startStop.position);
    if(destStop) setDestinationLocation(destStop.position);
  }, [start, destination]);

  useEffect(() => {
    if (!userLocation || !selectedBus) return;

    const distanceToUser = getDistanceFromLatLonInKm(
        selectedBus.position.lat,
        selectedBus.position.lng,
        userLocation.lat,
        userLocation.lng
    );

    if(distanceToUser < 1 && !onboard) {
        setOnboard(true);
        setStatus('You are onboard. Heading to destination.');
    }

  }, [selectedBus, userLocation, onboard]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (!selectedBus) return;

        setBuses((prevBuses) =>
            prevBuses.map((bus) => {
                if (bus.id !== selectedBus.id) return bus;

                const route = routes.find((r) => r.id === bus.routeId);
                if (!route) return bus;

                const currentPointIndex = route.path.findIndex(
                    (p) => p.lat === bus.position.lat && p.lng === bus.position.lng
                );
                
                if (currentPointIndex === -1) { 
                    // If bus is not exactly on a path point, find the closest one to start. This is a fallback.
                    let closestIndex = 0;
                    let minDistance = Infinity;
                    route.path.forEach((p, index) => {
                        const dist = getDistanceFromLatLonInKm(bus.position.lat, bus.position.lng, p.lat, p.lng);
                        if(dist < minDistance) {
                            minDistance = dist;
                            closestIndex = index;
                        }
                    });
                     return { ...bus, position: route.path[closestIndex] };
                };


                // For simulation, we always move forward. In a real app, you'd check direction.
                const nextPointIndex = (currentPointIndex + 1) % route.path.length;
                
                // Stop simulation if bus reaches the destination
                const destStop = busStops.find(s => s.name === destination);
                if (destStop) {
                    const destPathIndex = route.path.findIndex(p => p.lat === destStop.position.lat && p.lng === destStop.position.lng);
                    if (currentPointIndex === destPathIndex) {
                        clearInterval(interval);
                        return bus;
                    }
                }
                
                return { ...bus, position: route.path[nextPointIndex] };
            })
        );
    }, 2000); 

    return () => clearInterval(interval);
  }, [selectedBus, destination]);
  
  const pathToUser = useMemo(() => {
      if (!selectedBus || !userLocation || onboard) return [];
      const route = routes.find(r => r.id === selectedBus.routeId);
      if (!route) return [];

      const busIndexOnPath = route.path.findIndex(p => p.lat === selectedBus.position.lat && p.lng === selectedBus.position.lng);

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
  
    const busIndexOnPath = route.path.findIndex(p => p.lat === selectedBus.position.lat && p.lng === selectedBus.position.lng);
  
    const destStop = busStops.find(s => s.name === destination);
    if(!destStop) return [];
    const destStopPathIndex = route.path.findIndex(p => p.lat === destStop.position.lat && p.lng === destStop.position.lng);
  
    if (busIndexOnPath === -1 || destStopPathIndex === -1 || busIndexOnPath >= destStopPathIndex) return [];
    
    return route.path.slice(busIndexOnPath, destStopPathIndex + 1);
  
  }, [selectedBus, destinationLocation, onboard, destination]);


  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="relative h-screen w-screen overflow-hidden">
        <Map
          mapId="punjab-roadways-map"
          defaultCenter={initialCenter}
          defaultZoom={12}
          disableDefaultUI={false}
          gestureHandling={'greedy'}
          className="h-full w-full"
        >
          {userLocation && (
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
        
        <header className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="secondary" onClick={() => router.back()} className="shadow-lg">
                <ArrowLeft className="h-5 w-5" />
            </Button>
             <div className="bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                <Logo />
             </div>
          </div>
        </header>

        {selectedBus && (
            <BusDetailsCard 
                bus={selectedBus}
                userLocation={onboard ? destinationLocation : userLocation}
                onClose={() => router.back()}
                status={status}
            />
        )}

      </div>
    </APIProvider>
  );
};

export default Dashboard;
