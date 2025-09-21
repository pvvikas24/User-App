
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Bus, LatLng } from '@/lib/types';
import { getDistanceFromLatLonInKm } from '@/lib/utils';
import { X, Clock, MapPin, Users, Route as RouteIcon } from 'lucide-react';

interface BusDetailsCardProps {
  bus: Bus;
  userLocation: LatLng | null;
  onClose: () => void;
  status: string;
}

const BusDetailsCard = ({ bus, userLocation, onClose, status }: BusDetailsCardProps) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    if (userLocation && bus) {
      const dist = getDistanceFromLatLonInKm(
        userLocation.lat,
        userLocation.lng,
        bus.position.lat,
        bus.position.lng
      );
      setDistance(dist);

      const AVERAGE_SPEED_KMPH = 40;
      const etaHours = dist / AVERAGE_SPEED_KMPH;
      setEta(Math.round(etaHours * 60));
    }
  }, [bus, userLocation, bus.position]);

  if (!bus) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
      <Card className="bg-background/80 backdrop-blur-sm border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-primary font-bold">Bus #{bus.id}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-foreground/70 hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-lg font-semibold mb-1">To: {bus.destination}</p>
                <div className="flex items-center gap-2 text-sm text-amber-400 font-semibold">
                    <RouteIcon className="h-4 w-4" />
                    <span>{status}</span>
                </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                <p className="font-bold">{bus.passengerCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusDetailsCard;
