import { type F1Session, type InsertF1Session, type F1Lap, type InsertF1Lap, type F1Telemetry, type InsertF1Telemetry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // F1 Sessions
  getF1Session(year: number, gp: string, session: string): Promise<F1Session | undefined>;
  createF1Session(session: InsertF1Session): Promise<F1Session>;
  
  // F1 Laps
  getF1Laps(sessionId: string): Promise<F1Lap[]>;
  createF1Lap(lap: InsertF1Lap): Promise<F1Lap>;
  
  // F1 Telemetry
  getF1Telemetry(lapId: string): Promise<F1Telemetry | undefined>;
  createF1Telemetry(telemetry: InsertF1Telemetry): Promise<F1Telemetry>;
}

export class MemStorage implements IStorage {
  private f1Sessions: Map<string, F1Session>;
  private f1Laps: Map<string, F1Lap>;
  private f1Telemetry: Map<string, F1Telemetry>;

  constructor() {
    this.f1Sessions = new Map();
    this.f1Laps = new Map();
    this.f1Telemetry = new Map();
  }

  async getF1Session(year: number, gp: string, session: string): Promise<F1Session | undefined> {
    const key = `${year}-${gp}-${session}`;
    return Array.from(this.f1Sessions.values()).find(
      s => s.year === year && s.gp === gp && s.session === session
    );
  }

  async createF1Session(insertSession: InsertF1Session): Promise<F1Session> {
    const id = randomUUID();
    const session: F1Session = { ...insertSession, id, sessionData: insertSession.sessionData ?? null };
    this.f1Sessions.set(id, session);
    return session;
  }

  async getF1Laps(sessionId: string): Promise<F1Lap[]> {
    return Array.from(this.f1Laps.values()).filter(
      lap => lap.sessionId === sessionId
    );
  }

  async createF1Lap(insertLap: InsertF1Lap): Promise<F1Lap> {
    const id = randomUUID();
    const lap: F1Lap = { 
      ...insertLap, 
      id,
      lapTime: insertLap.lapTime ?? null,
      sector1: insertLap.sector1 ?? null,
      sector2: insertLap.sector2 ?? null,
      sector3: insertLap.sector3 ?? null,
      compound: insertLap.compound ?? null,
      isPersonalBest: insertLap.isPersonalBest ?? null
    };
    this.f1Laps.set(id, lap);
    return lap;
  }

  async getF1Telemetry(lapId: string): Promise<F1Telemetry | undefined> {
    return Array.from(this.f1Telemetry.values()).find(
      t => t.lapId === lapId
    );
  }

  async createF1Telemetry(insertTelemetry: InsertF1Telemetry): Promise<F1Telemetry> {
    const id = randomUUID();
    const telemetry: F1Telemetry = { ...insertTelemetry, id, telemetryData: insertTelemetry.telemetryData ?? null };
    this.f1Telemetry.set(id, telemetry);
    return telemetry;
  }
}

export const storage = new MemStorage();
