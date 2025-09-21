export interface LatLng {
  lat: number;
  lng: number;
}

export interface BusStop {
  id: string;
  name:string;
  position: LatLng;
}

export interface Route {
  id: string;
  name: string;
  path: LatLng[];
  stops: string[]; // array of BusStop ids
}

export interface Bus {
  id: string;
  routeId: string;
  position: LatLng;
  currentPathIndex?: number;
  destination: string;
  type: 'A/C' | 'Non-A/C';
  passengerCount: number;
  ticketPrice: number;
}
