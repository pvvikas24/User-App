import type { Bus, Route, BusStop } from './types';

export const busStops: BusStop[] = [
  { id: 'stop1', name: 'ISBT Sector 17, Chandigarh', position: { lat: 30.7419, lng: 76.7762 } },
  { id: 'stop2', name: 'Kharar Bus Stand', position: { lat: 30.7454, lng: 76.6493 } },
  { id: 'stop3', name: 'Ropar Bus Stand', position: { lat: 30.9660, lng: 76.5250 } },
  { id: 'stop4', name: 'Jalandhar Bus Stand', position: { lat: 31.3260, lng: 75.5762 } },
  { id: 'stop5', name: 'Amritsar Bus Stand', position: { lat: 31.6340, lng: 74.8723 } },
  // New route stops
  { id: 'stop6', name: 'Ludhiana Bus Stand', position: { lat: 30.9112, lng: 75.8516 } },
  { id: 'stop7', name: 'Phagwara Bus Stand', position: { lat: 31.2183, lng: 75.7731 } },
];

export const routes: Route[] = [
  {
    id: 'route1',
    name: 'Chandigarh to Amritsar',
    stops: ['stop1', 'stop2', 'stop3', 'stop7', 'stop4', 'stop5'],
    path: [
      { lat: 30.7419, lng: 76.7762 }, // Chandigarh
      { lat: 30.7454, lng: 76.6493 }, // Kharar
      { lat: 30.85, lng: 76.60 },
      { lat: 30.9660, lng: 76.5250 }, // Ropar
      { lat: 31.05, lng: 76.30 },
      { lat: 31.15, lng: 75.90 },
      { lat: 31.2183, lng: 75.7731 }, // Phagwara
      { lat: 31.3260, lng: 75.5762 }, // Jalandhar
      { lat: 31.45, lng: 75.20 },
      { lat: 31.6340, lng: 74.8723 }, // Amritsar
    ],
  },
  {
    id: 'route2',
    name: 'Chandigarh to Ludhiana',
    stops: ['stop1', 'stop2', 'stop6'],
     path: [
      { lat: 30.7419, lng: 76.7762 }, // Chandigarh
      { lat: 30.7454, lng: 76.6493 }, // Kharar
      { lat: 30.80, lng: 76.45 },
      { lat: 30.9112, lng: 75.8516 }, // Ludhiana
    ],
  }
];

export const initialBuses: Bus[] = [
  {
    id: 'PB01A1234',
    routeId: 'route1',
    position: { lat: 30.7419, lng: 76.7762 },
    currentPathIndex: 0,
    destination: 'Amritsar',
    type: 'A/C',
    passengerCount: 25,
    ticketPrice: 350,
  },
  {
    id: 'PB01A5678',
    routeId: 'route1',
    position: { lat: 30.7419, lng: 76.7762 },
    currentPathIndex: 0,
    destination: 'Amritsar',
    type: 'Non-A/C',
    passengerCount: 35,
    ticketPrice: 280,
  },
  {
    id: 'PB02B5678',
    routeId: 'route1',
    position: { lat: 30.9660, lng: 76.5250 },
    currentPathIndex: 3,
    destination: 'Amritsar',
    type: 'Non-A/C',
    passengerCount: 40,
    ticketPrice: 280,
  },
   {
    id: 'PB02B9101',
    routeId: 'route1',
    position: { lat: 30.85, lng: 76.60 },
    currentPathIndex: 2,
    destination: 'Amritsar',
    type: 'A/C',
    passengerCount: 18,
    ticketPrice: 350,
  },
  {
    id: 'PB03C9101',
    routeId: 'route1',
    position: { lat: 31.3260, lng: 75.5762 },
    currentPathIndex: 7,
    destination: 'Chandigarh', // This bus is going the other way
    type: 'A/C',
    passengerCount: 15,
    ticketPrice: 350,
  },
  {
    id: 'PB04D4321',
    routeId: 'route2',
    position: { lat: 30.7419, lng: 76.7762 },
    currentPathIndex: 0,
    destination: 'Ludhiana',
    type: 'A/C',
    passengerCount: 18,
    ticketPrice: 150,
  },
  {
    id: 'PB04D8765',
    routeId: 'route2',
    position: { lat: 30.7454, lng: 76.6493 },
    currentPathIndex: 1,
    destination: 'Ludhiana',
    type: 'Non-A/C',
    passengerCount: 45,
    ticketPrice: 120,
  }
];
