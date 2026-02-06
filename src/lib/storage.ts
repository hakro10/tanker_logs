import { AppState, Driver, Trailer, Truck, WorkLog, DeliveryDrop } from '../types';

const STORAGE_KEY = 'fuel-log-state-v1';

const canUseStorage = typeof window !== 'undefined' && !!window.localStorage;

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const defaultTrailer: Trailer = {
  id: uid(),
  plate: 'TRL-001',
  compartmentCount: 6,
  maxPerCompartmentLiters: 7200,
};

const defaultState: AppState = {
  drivers: [
    { id: uid(), name: 'Primary Driver' },
  ],
  trucks: [
    { id: uid(), plate: 'TRK-001' },
  ],
  trailers: [defaultTrailer],
  workLogs: [],
};

export function loadState(): AppState {
  if (!canUseStorage) return defaultState;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState;
  try {
    const parsed = JSON.parse(saved) as AppState;
    const normalizedLogs =
      parsed.workLogs?.map((log, logIdx) => ({
        ...log,
        jobs:
          log.jobs?.map((job, jobIdx) => {
            // If legacy flat drop structure, lift into delivery drops with single cargo each
            const drops: DeliveryDrop[] =
              (job as any).drops?.map((drop: any, dropIdx: number) => {
                const cargos = drop.cargos
                  ? drop.cargos
                  : [
                      {
                        id: uid(),
                        cargoType: drop.cargoType,
                        liters: drop.liters || 0,
                        compartment: drop.compartment || dropIdx + 1,
                      },
                    ];
                return {
                  id: drop.id || uid(),
                  customerName: drop.customerName || drop.customerAccount || job.customerAccount || '',
                  deliveryAddress: drop.deliveryAddress || '',
                  cargos,
                };
              }) || [];
            return {
              ...job,
              customerAccount: job.customerAccount || '',
              jobNumber: job.jobNumber || `JOB-${jobIdx + 1}`,
              drops,
            };
          }) || [],
      })) || [];
    return {
      ...defaultState,
      ...parsed,
      drivers: parsed.drivers?.length ? parsed.drivers : defaultState.drivers,
      trucks: parsed.trucks?.length ? parsed.trucks : defaultState.trucks,
      trailers: parsed.trailers?.length ? parsed.trailers : defaultState.trailers,
      workLogs: normalizedLogs,
    };
  } catch (err) {
    console.warn('Could not parse saved state', err);
    return defaultState;
  }
}

export function saveState(state: AppState) {
  if (!canUseStorage) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function upsertWorkLog(state: AppState, log: WorkLog): AppState {
  const existingIndex = state.workLogs.findIndex((l) => l.date === log.date);
  const workLogs = [...state.workLogs];
  if (existingIndex >= 0) {
    workLogs[existingIndex] = log;
  } else {
    workLogs.push(log);
  }
  return { ...state, workLogs };
}

export function addDriver(state: AppState, name: string): [AppState, Driver] {
  const driver: Driver = { id: uid(), name };
  return [{ ...state, drivers: [...state.drivers, driver] }, driver];
}

export function addTruck(state: AppState, plate: string): [AppState, Truck] {
  const truck: Truck = { id: uid(), plate };
  return [{ ...state, trucks: [...state.trucks, truck] }, truck];
}

export function addTrailer(
  state: AppState,
  plate: string,
  compartmentCount = 6,
  maxPerCompartmentLiters = 7200,
): [AppState, Trailer] {
  const trailer: Trailer = { id: uid(), plate, compartmentCount, maxPerCompartmentLiters };
  return [{ ...state, trailers: [...state.trailers, trailer] }, trailer];
}
