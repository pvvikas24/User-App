'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, Polyline } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '@/lib/config';
import { initialBuses, routes, busStops } from '@/lib/data';
import type { Bus, LatLng, Route } from '@/lib/types';
import Logo from './logo';
import BusIcon from './icons/bus-icon';
import BusStopIcon from './icons/bus-stop-icon';
import BusDetailsCard from './bus-details-card';
import RouteOptimizer from './route-optimizer';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Search, Route as RouteIcon, LocateFixed } from 'lucide-react';

const Dashboard = () => {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [center, setCenter] = useState<LatLng>({ lat: 31.1471, lng: 75.3412 }); // Punjab center
  const [zoom, setZoom] = useState(8);
  
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const locateUser = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newUserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newUserLocation);
          setCenter(newUserLocation);
          setZoom(13);
        },
        () => {
          console.error('Error getting user location.');
        }
      );
    }
  }, []);

  useEffect(() => {
    locateUser();
  }, [locateUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBuses((prevBuses) =>
        prevBuses.map((bus) => {
          const route = routes.find((r) => r.id === bus.routeId);
          if (!route) return bus;

          const currentPointIndex = route.path.findIndex(
            (p) => p.lat === bus.position.lat && p.lng === bus.position.lng
          );
          
          if (currentPointIndex === -1) return bus;

          const nextPointIndex = (currentPointIndex + 1) % route.path.length;
          
          return { ...bus, position: route.path[nextPointIndex] };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  
  const selectedRoute = useMemo<Route | undefined>(() => {
    return routes.find(r => r.id === selectedBus?.routeId);
  }, [selectedBus]);

  const visibleBuses = useMemo(() => {
    return buses.filter(bus => {
        const route = routes.find(r => r.id === bus.routeId);
        if (!route) return false;

        const typeMatch = filterType === 'All' || bus.type === filterType;
        const searchMatch = !searchQuery || route.name.toLowerCase().includes(searchQuery.toLowerCase());

        return typeMatch && searchMatch;
    });
  }, [searchQuery, filterType, buses]);

  const handleMarkerClick = (bus: Bus) => {
    setSelectedBus(bus);
    setCenter(bus.position);
    setZoom(14);
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="relative h-screen w-screen overflow-hidden">
        <Map
          mapId="punjab-roadways-map"
          center={center}
          zoom={zoom}
          disableDefaultUI={true}
          gestureHandling={'greedy'}
          className="h-full w-full"
        >
          {userLocation && (
            <AdvancedMarker position={userLocation} title="Your Location">
               <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
            </AdvancedMarker>
          )}

          {busStops.map((stop) => (
            <AdvancedMarker key={stop.id} position={stop.position} title={stop.name}>
              <BusStopIcon className="w-6 h-6 text-foreground/50" />
            </AdvancedMarker>
          ))}
          
          {visibleBuses.map((bus) => (
            <AdvancedMarker
              key={bus.id}
              position={bus.position}
              onClick={() => handleMarkerClick(bus)}
            >
              <BusIcon className="w-8 h-8 text-primary transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer drop-shadow-lg" />
            </AdvancedMarker>
          ))}

          {selectedRoute && (
             <Polyline path={selectedRoute.path} strokeColor="var(--color-primary)" strokeOpacity={0.8} strokeWeight={6} />
          )}

        </Map>
        
        <header className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
          <div className="bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-lg">
             <Logo />
          </div>
          <div className="flex items-center gap-2">
             <Button size="icon" variant="secondary" onClick={locateUser} className="shadow-lg">
                <LocateFixed className="h-5 w-5" />
             </Button>
          </div>
        </header>
        
        <div className="absolute top-24 left-4 z-10 flex flex-col gap-2">
           <Button variant="secondary" onClick={() => setIsSearchSheetOpen(true)} className="shadow-lg">
              <Search className="mr-2 h-4 w-4" />
              Search & Filter
            </Button>
            <Button variant="secondary" onClick={() => setIsOptimizerOpen(true)} className="shadow-lg">
              <RouteIcon className="mr-2 h-4 w-4" />
              Optimize Route
            </Button>
        </div>

        {selectedBus && (
            <BusDetailsCard 
                bus={selectedBus}
                userLocation={userLocation}
                onClose={() => setSelectedBus(null)}
            />
        )}

        <Sheet open={isSearchSheetOpen} onOpenChange={setIsSearchSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Search and Filter</SheetTitle>
              <SheetDescription>Find specific buses or filter by type.</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="search">Search by Route Name</Label>
                    <Input id="search" placeholder="e.g., Chandigarh to Amritsar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Bus Type</Label>
                    <RadioGroup value={filterType} onValueChange={setFilterType}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="All" id="r-all" />
                            <Label htmlFor="r-all">All</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A/C" id="r-ac" />
                            <Label htmlFor="r-ac">A/C</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Non-A/C" id="r-nonac" />
                            <Label htmlFor="r-nonac">Non-A/C</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <RouteOptimizer 
            open={isOptimizerOpen} 
            onOpenChange={setIsOptimizerOpen} 
            userLocationString={userLocation ? `${userLocation.lat}, ${userLocation.lng}` : null}
        />
      </div>
    </APIProvider>
  );
};

export default Dashboard;
