import type { Bus, Route, BusStop } from './types';

export const busStops: BusStop[] = [
  { id: 'stop1', name: 'ISBT Sector 17, Chandigarh', position: { lat: 30.7419, lng: 76.7762 } },
  { id: 'stop2', name: 'Kharar Bus Stand', position: { lat: 30.7454, lng: 76.6493 } },
  { id: 'stop3', name: 'Ropar Bus Stand', position: { lat: 30.9660, lng: 76.5250 } },
  { id: 'stop4', name: 'Jalandhar Bus Stand', position: { lat: 31.3260, lng: 75.5762 } },
  { id: 'stop5', name: 'Amritsar Bus Stand', position: { lat: 31.6340, lng: 74.8723 } },
];

export const routes: Route[] = [
  {
    id: 'route1',
    name: 'Chandigarh to Amritsar',
    stops: ['stop1', 'stop2', 'stop3', 'stop4', 'stop5'],
    path: [
      { lat: 30.7419, lng: 76.7762 }, // Chandigarh
      { lat: 30.7454, lng: 76.6493 }, // Kharar
      { lat: 30.85, lng: 76.60 },
      { lat: 30.9660, lng: 76.5250 }, // Ropar
      { lat: 31.05, lng: 76.30 },
      { lat: 31.15, lng: 75.90 },
      { lat: 31.3260, lng: 75.5762 }, // Jalandhar
      { lat: 31.45, lng: 75.20 },
      { lat: 31.6340, lng: 74.8723 }, // Amritsar
    ],
  },
];

export const initialBuses: Bus[] = [
  {
    id: 'bus101',
    routeId: 'route1',
    position: { lat: 30.7419, lng: 76.7762 },
    destination: 'Amritsar',
    type: 'A/C',
    passengerCount: 25,
  },
  {
    id: 'bus102',
    routeId: 'route1',
    position: { lat: 30.9660, lng: 76.5250 },
    destination: 'Amritsar',
    type: 'Non-A/C',
    passengerCount: 40,
  },
  {
    id: 'bus103',
    routeId: 'route1',
    position: { lat: 31.3260, lng: 75.5762 },
    destination: 'Chandigarh',
    type: 'A/C',
    passengerCount: 15,
  },
];
