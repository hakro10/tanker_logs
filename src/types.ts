export type CargoType =
  | 'diesel'
  | 'petrol'
  | 'diesel_plus'
  | 'petrol_plus'
  | 'kerosene'
  | 'gas_oil';

export const cargoOptions: { value: CargoType; label: string }[] = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel_plus', label: 'Diesel Plus' },
  { value: 'petrol_plus', label: 'Petrol Plus' },
  { value: 'kerosene', label: 'Kerosene' },
  { value: 'gas_oil', label: 'Gas Oil' },
];

export interface Driver {
  id: string;
  name: string;
}

export interface Truck {
  id: string;
  plate: string;
}

export interface Trailer {
  id: string;
  plate: string;
  compartmentCount: number;
  maxPerCompartmentLiters: number;
}

export interface Cargo {
  id: string;
  cargoType: CargoType;
  liters: number;
  compartment: number; // 1..compartmentCount
}

export interface DeliveryDrop {
  id: string;
  customerName: string;
  deliveryAddress: string;
  cargos: Cargo[];
}

export interface Job {
  id: string;
  jobNumber: string;
  customerAccount: string;
  drops: DeliveryDrop[];
}

export interface WorkLog {
  id: string;
  date: string; // ISO YYYY-MM-DD
  driverId?: string;
  truckId?: string;
  trailerId?: string;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  jobs: Job[];
  notes?: string;
}

export interface AppState {
  drivers: Driver[];
  trucks: Truck[];
  trailers: Trailer[];
  workLogs: WorkLog[];
}
