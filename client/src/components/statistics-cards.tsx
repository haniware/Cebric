import { Card, CardContent } from "@/components/ui/card";
import { F1SessionResponse } from "@shared/schema";

interface StatisticsCardsProps {
  sessionData: F1SessionResponse | null;
  timeFormat: 'seconds' | 'minutes';
}

export default function StatisticsCards({ sessionData, timeFormat }: StatisticsCardsProps) {
  if (!sessionData?.statistics) {
    return null;
  }

  const { statistics } = sessionData;

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "N/A";
    if (timeFormat === 'seconds') {
      return `${seconds.toFixed(3)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  };

  const formatSpeed = (speed: number) => {
    if (speed === 0) return "N/A";
    return `${speed.toFixed(1)} km/h`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8" data-testid="statistics-cards">
      {/* Fastest Lap */}
      <Card className="racing-stripe pl-7" data-testid="card-fastest-lap">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Fastest Lap</span>
            <i className="fas fa-trophy text-primary"></i>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" data-testid="text-fastest-lap-time">
            {formatTime(statistics.fastestLap.time)}
          </p>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-fastest-lap-driver">
            {statistics.fastestLap.driver}
          </p>
        </CardContent>
      </Card>

      {/* Top Speed */}
      <Card className="racing-stripe pl-7" data-testid="card-top-speed">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Top Speed</span>
            <i className="fas fa-tachometer-alt text-secondary"></i>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" data-testid="text-top-speed-value">
            {formatSpeed(statistics.topSpeed.value)}
          </p>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-top-speed-driver">
            {statistics.topSpeed.driver}
          </p>
        </CardContent>
      </Card>

      {/* Speed Trap */}
      <Card className="racing-stripe pl-7" data-testid="card-speed-trap">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Speed Trap</span>
            <i className="fas fa-radar text-accent"></i>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" data-testid="text-speed-trap-value">
            {formatSpeed(statistics.speedTrap.value)}
          </p>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-speed-trap-driver">
            {statistics.speedTrap.driver}
          </p>
        </CardContent>
      </Card>

      {/* Total Laps & Active Drivers */}
      <Card className="racing-stripe pl-7" data-testid="card-total-laps">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Laps</span>
            <i className="fas fa-flag text-accent"></i>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" data-testid="text-total-laps">
            {statistics.totalLaps}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Race distance</p>
        </CardContent>
      </Card>

      {/* Average Lap Time */}
      <Card className="racing-stripe pl-7" data-testid="card-avg-lap-time">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Avg. Lap Time</span>
            <i className="fas fa-clock text-primary"></i>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" data-testid="text-avg-lap-time">
            {formatTime(statistics.avgLapTime)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Average Lap Time</p>
          {statistics.fastestLap && statistics.avgLapTime > 0 && (
            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">Δ to fastest: </span>
              <span className="font-mono text-primary">+{(statistics.avgLapTime - statistics.fastestLap.time).toFixed(3)}s</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}