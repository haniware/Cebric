import { Card, CardContent } from "@/components/ui/card";
import { F1SessionResponse } from "@shared/schema";

interface AdditionalAnalysisProps {
  sessionData: F1SessionResponse | null;
  timeFormat: 'seconds' | 'minutes';
}

export default function AdditionalAnalysis({ sessionData, timeFormat }: AdditionalAnalysisProps) {
  if (!sessionData?.laps || sessionData.laps.length === 0) {
    return null;
  }

  // Calculate sector times (best sectors for each sector)
  const sector1Times = sessionData.laps
    .filter(lap => lap.sector1 && lap.sector1 > 0)
    .map(lap => ({ time: lap.sector1!, driver: lap.driver }))
    .sort((a, b) => a.time - b.time);

  const sector2Times = sessionData.laps
    .filter(lap => lap.sector2 && lap.sector2 > 0)
    .map(lap => ({ time: lap.sector2!, driver: lap.driver }))
    .sort((a, b) => a.time - b.time);

  const sector3Times = sessionData.laps
    .filter(lap => lap.sector3 && lap.sector3 > 0)
    .map(lap => ({ time: lap.sector3!, driver: lap.driver }))
    .sort((a, b) => a.time - b.time);

  // Calculate tire strategy (simplified - group by compound)
  const tireStints = sessionData.laps
    .reduce((acc, lap) => {
      const compound = lap.compound || 'UNKNOWN';
      if (!acc[compound]) {
        acc[compound] = {
          compound,
          laps: [],
          totalTime: 0,
          count: 0
        };
      }
      acc[compound].laps.push(lap.lapNumber);
      if (lap.lapTime > 0) {
        acc[compound].totalTime += lap.lapTime;
        acc[compound].count++;
      }
      return acc;
    }, {} as Record<string, any>);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  };

  const formatSectorTime = (seconds: number) => {
    if (seconds === 0) return "N/A";
    if (timeFormat === 'seconds') {
      return `${seconds.toFixed(3)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return minutes > 0 ? `${minutes}:${secs.padStart(6, '0')}` : `${seconds.toFixed(3)}s`;
  };

  const getCompoundColor = (compound: string) => {
    const colors: Record<string, string> = {
      'SOFT': 'bg-red-500',
      'MEDIUM': 'bg-yellow-500',
      'HARD': 'bg-slate-300',
      'INTERMEDIATE': 'bg-green-500',
      'WET': 'bg-blue-500',
      'UNKNOWN': 'bg-gray-500'
    };
    return colors[compound] || colors['UNKNOWN'];
  };

  const getCompoundLetter = (compound: string) => {
    const letters: Record<string, string> = {
      'SOFT': 'S',
      'MEDIUM': 'M',
      'HARD': 'H',
      'INTERMEDIATE': 'I',
      'WET': 'W',
      'UNKNOWN': '?'
    };
    return letters[compound] || letters['UNKNOWN'];
  };

  const getCompoundTextColor = (compound: string) => {
    return compound === 'HARD' ? 'text-slate-700' : 'text-white';
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="additional-analysis">
      {/* Sector Times */}
      <Card data-testid="sector-times-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center" data-testid="title-sector-times">
            <i className="fas fa-stopwatch text-primary mr-2"></i>
            Sector Times
          </h3>
          <div className="space-y-4">
            {sector1Times.length > 0 && (
              <div className="flex items-center justify-between" data-testid="sector1-info">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold">S1</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-mono" data-testid="sector1-time">
                      {formatSectorTime(sector1Times[0].time)}
                    </p>
                    <p className="text-xs text-muted-foreground">Sector 1</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Best:</span>
                  <span className="text-sm font-bold text-primary font-mono" data-testid="sector1-driver">
                    {sector1Times[0].driver}
                  </span>
                </div>
              </div>
            )}

            {sector2Times.length > 0 && (
              <div className="flex items-center justify-between" data-testid="sector2-info">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <span className="text-secondary font-bold">S2</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-mono" data-testid="sector2-time">
                      {formatSectorTime(sector2Times[0].time)}
                    </p>
                    <p className="text-xs text-muted-foreground">Sector 2</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Best:</span>
                  <span className="text-sm font-bold text-secondary font-mono" data-testid="sector2-driver">
                    {sector2Times[0].driver}
                  </span>
                </div>
              </div>
            )}

            {sector3Times.length > 0 && (
              <div className="flex items-center justify-between" data-testid="sector3-info">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold">S3</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-mono" data-testid="sector3-time">
                      {formatSectorTime(sector3Times[0].time)}
                    </p>
                    <p className="text-xs text-muted-foreground">Sector 3</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Best:</span>
                  <span className="text-sm font-bold text-accent font-mono" data-testid="sector3-driver">
                    {sector3Times[0].driver}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tire Strategy */}
      <Card data-testid="tire-strategy-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center" data-testid="title-tire-strategy">
            <i className="fas fa-circle-notch text-primary mr-2"></i>
            Tire Strategy
          </h3>
          <div className="space-y-3">
            {Object.values(tireStints).map((stint: any, index) => {
              const avgTime = stint.count > 0 ? stint.totalTime / stint.count : 0;
              const lapRange = `Laps ${Math.min(...stint.laps)}-${Math.max(...stint.laps)}`;

              return (
                <div 
                  key={stint.compound} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`tire-stint-${stint.compound.toLowerCase()}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${getCompoundColor(stint.compound)} flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${getCompoundTextColor(stint.compound)}`}>
                        {getCompoundLetter(stint.compound)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid={`compound-${stint.compound.toLowerCase()}`}>
                        {stint.compound.charAt(0) + stint.compound.slice(1).toLowerCase()}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`laps-${stint.compound.toLowerCase()}`}>
                        {lapRange}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground" data-testid={`avg-time-${stint.compound.toLowerCase()}`}>
                    {avgTime > 0 ? formatTime(avgTime) : 'N/A'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}