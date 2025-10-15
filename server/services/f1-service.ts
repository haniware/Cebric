import { spawn } from "child_process";
import path from "path";
import { F1SessionResponse, F1TelemetryResponse } from "@shared/schema";

export class F1Service {
  private pythonPath: string;

  constructor() {
    this.pythonPath = path.resolve(import.meta.dirname, "../../python/f1_data_fetcher.py");
  }

  async getSessionData(year: number, gp: string, session: string, drivers?: string[]): Promise<F1SessionResponse> {
    return new Promise((resolve, reject) => {
      const args = [this.pythonPath, "session", year.toString(), gp, session];
      if (drivers && drivers.length > 0) {
        args.push(...drivers);
      }

      const pythonProcess = spawn("python3", args);
      let dataString = "";
      let errorString = "";

      pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorString += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`FastF1 process failed: ${errorString}`));
          return;
        }

        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse FastF1 response: ${error}`));
        }
      });
    });
  }

  async getTelemetryData(
    year: number, 
    gp: string, 
    session: string, 
    driver1: string, 
    lap1: number, 
    driver2?: string, 
    lap2?: number
  ): Promise<F1TelemetryResponse> {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonPath, 
        "telemetry", 
        year.toString(), 
        gp, 
        session, 
        driver1, 
        lap1.toString()
      ];
      
      if (driver2 && lap2) {
        args.push(driver2, lap2.toString());
      }

      const pythonProcess = spawn("python3", args);
      let dataString = "";
      let errorString = "";

      pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorString += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`FastF1 telemetry process failed: ${errorString}`));
          return;
        }

        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse FastF1 telemetry response: ${error}`));
        }
      });
    });
  }

  async getAvailableGPs(year: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const args = [this.pythonPath, "gps", year.toString()];
      const pythonProcess = spawn("python3", args);
      let dataString = "";
      let errorString = "";

      pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorString += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`FastF1 GP fetch failed: ${errorString}`));
          return;
        }

        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse FastF1 GP response: ${error}`));
        }
      });
    });
  }
}

export const f1Service = new F1Service();
