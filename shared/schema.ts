import { z } from "zod";

// Types for internal storage
export type F1Session = {
  id: string;
  year: number;
  gp: string;
  session: string;
  sessionData: any;
};

export type InsertF1Session = Omit<F1Session, 'id'>;

export type F1Lap = {
  id: string;
  sessionId: string;
  driver: string;
  lapNumber: number;
  lapTime: number | null;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  compound: string | null;
  isPersonalBest: string | null;
};

export type InsertF1Lap = Omit<F1Lap, 'id'>;

export type F1Telemetry = {
  id: string;
  lapId: string;
  driver: string;
  telemetryData: any;
};

export type InsertF1Telemetry = Omit<F1Telemetry, 'id'>;

// API Response types
export type F1SessionResponse = {
  year: number;
  gp: string;
  session: string;
  drivers: string[];
  laps: F1LapData[];
  statistics: F1Statistics;
};

export type F1LapData = {
  driver: string;
  lapNumber: number;
  lapTime: number;
  sector1: number;
  sector2: number;
  sector3: number;
  compound: string;
  isPersonalBest: boolean;
};

export type F1Statistics = {
  fastestLap: {
    time: number;
    driver: string;
  };
  topSpeed: {
    value: number;
    driver: string;
  };
  speedTrap: {
    value: number;
    driver: string;
  };
  totalLaps: number;
  avgLapTime: number;
};

export type F1TelemetryData = {
  distance: number[];
  speed: number[];
  throttle: number[];
  brake: number[];
  drs: number[];
};

export type F1TelemetryResponse = {
  driver1: {
    driver: string;
    lap: number;
    data: F1TelemetryData;
    metrics: {
      maxSpeed: number;
      avgSpeed: number;
      throttle: number;
      brake: number;
      drs: number;
      lapTime: number;
      sector1: number;
      sector2: number;
      sector3: number;
    };
  };
  driver2?: {
    driver: string;
    lap: number;
    data: F1TelemetryData;
    metrics: {
      maxSpeed: number;
      avgSpeed: number;
      throttle: number;
      brake: number;
      drs: number;
      lapTime: number;
      sector1: number;
      sector2: number;
      sector3: number;
    };
  };
};

// Available years and GPs
export const AVAILABLE_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
export const SESSIONS = {
  'FP1': 'Free Practice 1',
  'FP2': 'Free Practice 2', 
  'FP3': 'Free Practice 3',
  'Q': 'Qualifying',
  'R': 'Race'
};

export const f1TelemetryResponseSchema = z.object({
  driver1: z.object({
    driver: z.string(),
    lap: z.number(),
    telemetry: z.object({
      distance: z.array(z.number()),
      speed: z.array(z.number()),
      throttle: z.array(z.number()),
      brake: z.array(z.number()),
      gear: z.array(z.number()),
      rpm: z.array(z.number()),
      drs: z.array(z.number()),
      compound: z.string(),
    }),
    metrics: z.object({
      maxSpeed: z.number(),
      avgSpeed: z.number(),
      avgThrottle: z.number(),
      avgBrake: z.number(),
      drsUsage: z.number(),
      lapTime: z.number(),
      sector1: z.number(),
      sector2: z.number(),
      sector3: z.number(),
    }),
  }),
  driver2: z.object({
    driver: z.string(),
    lap: z.number(),
    telemetry: z.object({
      distance: z.array(z.number()),
      speed: z.array(z.number()),
      throttle: z.array(z.number()),
      brake: z.array(z.number()),
      gear: z.array(z.number()),
      rpm: z.array(z.number()),
      drs: z.array(z.number()),
      compound: z.string(),
    }),
    metrics: z.object({
      maxSpeed: z.number(),
      avgSpeed: z.number(),
      avgThrottle: z.number(),
      avgBrake: z.number(),
      drsUsage: z.number(),
      lapTime: z.number(),
      sector1: z.number(),
      sector2: z.number(),
      sector3: z.number(),
    }),
  }).optional(),
});
