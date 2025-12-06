import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { F1SessionResponse, F1TelemetryResponse } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';

interface TelemetrySectionProps {
  telemetryData: F1TelemetryResponse | null;
  sessionData: F1SessionResponse | null;
  filters: { year: string; gp: string; session: string; drivers: string[] };
  onTelemetryDataLoaded: (data: F1TelemetryResponse | null) => void;
  timeFormat: 'seconds' | 'minutes';
}

export default function TelemetrySection({ 
  telemetryData, 
  sessionData, 
  filters, 
  onTelemetryDataLoaded,
  timeFormat
}: TelemetrySectionProps) {
  const [activeTab, setActiveTab] = useState<'speed' | 'throttle' | 'brake'>('speed');
  const [selectedDriver1, setSelectedDriver1] = useState<string>("");
  const [selectedLap1, setSelectedLap1] = useState<string>("");
  const [selectedDriver2, setSelectedDriver2] = useState<string>("");
  const [selectedLap2, setSelectedLap2] = useState<string>("");
  // chartInstanceRef and canvasRef are no longer needed with recharts
  const { toast } = useToast();

  // Load telemetry data mutation
  const loadTelemetryMutation = useMutation({
    mutationFn: async (params: {
      year: number;
      gp: string;
      session: string;
      driver1: string;
      lap1: number;
      driver2?: string;
      lap2?: number;
    }) => {
      const response = await apiRequest("POST", "/api/f1/telemetry", params);
      return response.json();
    },
    onSuccess: (data: F1TelemetryResponse) => {
      onTelemetryDataLoaded(data);
      toast({
        title: "Telemetry Loaded",
        description: "Successfully loaded telemetry data for comparison",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Loading Telemetry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // useEffect for chart rendering is removed as recharts handles it.

  const handleLoadTelemetry = () => {
    if (!filters.year || !filters.gp || !filters.session || !selectedDriver1 || !selectedLap1) {
      toast({
        title: "Missing Parameters",
        description: "Please select driver and lap for telemetry comparison",
        variant: "destructive",
      });
      return;
    }

    loadTelemetryMutation.mutate({
      year: parseInt(filters.year),
      gp: filters.gp,
      session: filters.session,
      driver1: selectedDriver1,
      lap1: parseInt(selectedLap1),
      driver2: selectedDriver2 && selectedDriver2 !== "none" ? selectedDriver2 : undefined,
      lap2: selectedLap2 ? parseInt(selectedLap2) : undefined,
    });
  };

  const clearTelemetry = () => {
    onTelemetryDataLoaded(null);
    setSelectedDriver1("");
    setSelectedLap1("");
    setSelectedDriver2("");
    setSelectedLap2("");
  };

  const availableDrivers = sessionData?.drivers || [];
  const maxLap = sessionData?.statistics.totalLaps || 50;
  const lapOptions = Array.from({ length: maxLap }, (_, i) => i + 1);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "N/A";
    if (timeFormat === 'seconds') {
      return `${seconds.toFixed(3)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  };

  // Helper function to format time for recharts tooltip
  const formatTimeForTooltip = (seconds: number) => {
    if (seconds === 0) return "N/A";
    if (timeFormat === 'seconds') {
      return `${seconds.toFixed(3)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  // Prepare data for recharts
  const prepareChartData = (telemetry: F1TelemetryResponse['driver1']['telemetry']) => {
    return telemetry.distance.map((dist, idx) => ({
      distance: Math.round(dist),
      speed: telemetry.speed[idx] || 0,
      throttle: telemetry.throttle[idx] || 0,
      brake: telemetry.brake[idx] || 0,
      gear: telemetry.gear[idx] || 0,
      // Add other telemetry data as needed
    }));
  };

  const driver1ChartData = telemetryData ? prepareChartData(telemetryData.driver1.telemetry) : [];
  const driver2ChartData = telemetryData?.driver2 ? prepareChartData(telemetryData.driver2.telemetry) : [];

  const combinedSpeedData = driver1ChartData.map((d1, idx) => {
    const d2 = driver2ChartData[idx];
    return {
      distance: d1.distance,
      [`${telemetryData.driver1.driver}_speed`]: d1.speed,
      ...(d2 && { [`${telemetryData.driver2.driver}_speed`]: d2.speed }),
    };
  });

  const combinedThrottleBrakeData = driver1ChartData.map((d1, idx) => {
    const d2 = driver2ChartData[idx];
    return {
      distance: d1.distance,
      [`${telemetryData.driver1.driver}_throttle`]: d1.throttle,
      [`${telemetryData.driver1.driver}_brake`]: d1.brake,
      ...(d2 && {
        [`${telemetryData.driver2.driver}_throttle`]: d2.throttle,
        [`${telemetryData.driver2.driver}_brake`]: d2.brake,
      }),
    };
  });
  
  const driver1Color = "#3b82f6"; // blue
  const driver2Color = "#ef4444"; // red
  
  // Prepare gear data only when telemetry is available
  const combinedGearData = telemetryData ? driver1ChartData.map((d1, idx) => {
    const d2 = driver2ChartData[idx];
    return {
      distance: d1.distance,
      [`${telemetryData.driver1.driver}_gear`]: d1.gear,
      ...(d2 && telemetryData.driver2 && { [`${telemetryData.driver2.driver}_gear`]: d2.gear }),
    };
  }) : [];

  return (
    <Card className="overflow-hidden" data-testid="telemetry-section">
      <div className="p-6 border-b border-border bg-muted/30">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="title-telemetry">
            <i className="fas fa-signal text-primary mr-2"></i>
            TELEMETRY
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Detailed lap analysis - Speed, Throttle, Brake</p>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Driver/Lap Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" data-testid="telemetry-controls">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Driver 1</label>
            <Select value={selectedDriver1} onValueChange={setSelectedDriver1}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver..." />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver} value={driver}>
                    {driver}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Lap 1</label>
            <div className="flex gap-2">
              <Select value={selectedLap1} onValueChange={setSelectedLap1}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select lap..." />
                </SelectTrigger>
                <SelectContent>
                  {lapOptions.map((lap) => (
                    <SelectItem key={lap} value={lap.toString()}>
                      {lap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sessionData?.statistics.fastestLap && selectedDriver1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const validLaps = sessionData.laps.filter(lap => lap.driver === selectedDriver1 && lap.lapTime > 0);
                    if (validLaps.length === 0) {
                      toast({
                        title: "No valid laps",
                        description: "No completed laps found for this driver",
                        variant: "destructive",
                      });
                      return;
                    }
                    const minTime = Math.min(...validLaps.map(lap => lap.lapTime));
                    const fastestLapData = validLaps.find(l => l.lapTime === minTime);
                    if (fastestLapData) {
                      setSelectedLap1(fastestLapData.lapNumber.toString());
                    }
                  }}
                  title="Select fastest lap for this driver"
                  data-testid="button-fastest-lap-1"
                >
                  <i className="fas fa-bolt text-yellow-500"></i>
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Driver 2 (Optional)</label>
            <Select value={selectedDriver2} onValueChange={setSelectedDriver2}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver} value={driver}>
                    {driver}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Lap 2 (Optional)</label>
            <div className="flex gap-2">
              <Select value={selectedLap2} onValueChange={setSelectedLap2} disabled={!selectedDriver2 || selectedDriver2 === "none"}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select lap..." />
                </SelectTrigger>
                <SelectContent>
                  {lapOptions.map((lap) => (
                    <SelectItem key={lap} value={lap.toString()}>
                      {lap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sessionData?.statistics.fastestLap && selectedDriver2 && selectedDriver2 !== "none" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const validLaps = sessionData.laps.filter(lap => lap.driver === selectedDriver2 && lap.lapTime > 0);
                    if (validLaps.length === 0) {
                      toast({
                        title: "No valid laps",
                        description: "No completed laps found for this driver",
                        variant: "destructive",
                      });
                      return;
                    }
                    const minTime = Math.min(...validLaps.map(lap => lap.lapTime));
                    const fastestLapData = validLaps.find(l => l.lapTime === minTime);
                    if (fastestLapData) {
                      setSelectedLap2(fastestLapData.lapNumber.toString());
                    }
                  }}
                  title="Select fastest lap for this driver"
                  data-testid="button-fastest-lap-2"
                >
                  <i className="fas fa-bolt text-yellow-500"></i>
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleLoadTelemetry}
              disabled={loadTelemetryMutation.isPending}
              className="w-full"
              data-testid="button-load-telemetry"
            >
              {loadTelemetryMutation.isPending ? (
                <i className="fas fa-spinner loading-spinner"></i>
              ) : (
                "Load Telemetry"
              )}
            </Button>
          </div>
        </div>

        {!telemetryData ? (
          <div className="text-center py-12" data-testid="telemetry-empty">
            <div className="inline-block mb-4">
              <i className="fas fa-chart-line text-6xl text-muted"></i>
            </div>
            <p className="text-muted-foreground text-lg mb-2">Selected telemetry data will appear here...</p>
            <p className="text-muted-foreground text-sm">Select drivers and laps above to view detailed telemetry</p>
          </div>
        ) : (
          <div data-testid="telemetry-content">
            {/* Comparison Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm font-medium text-foreground font-mono" data-testid="text-driver1-info">
                      {telemetryData.driver1.driver} - Lap {telemetryData.driver1.lap}
                    </span>
                  </div>
                  {telemetryData.driver2 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-secondary"></div>
                      <span className="text-sm font-medium text-foreground font-mono" data-testid="text-driver2-info">
                        {telemetryData.driver2.driver} - Lap {telemetryData.driver2.lap}
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={clearTelemetry} data-testid="button-clear-telemetry">
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </div>

            {/* Telemetry Metrics Grid (Updated) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6" data-testid="telemetry-metrics">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Lap Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold" style={{ color: driver1Color }}>
                        {telemetryData.driver1.driver}:
                      </span>{" "}
                      {formatTime(telemetryData.driver1.metrics.lapTime)}
                    </div>
                    {telemetryData.driver2 && (
                      <div>
                        <span className="font-semibold" style={{ color: driver2Color }}>
                          {telemetryData.driver2.driver}:
                        </span>{" "}
                        {formatTime(telemetryData.driver2.metrics.lapTime)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Max Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold" style={{ color: driver1Color }}>
                        {telemetryData.driver1.driver}:
                      </span>{" "}
                      {telemetryData.driver1.metrics.maxSpeed.toFixed(1)} km/h
                    </div>
                    {telemetryData.driver2 && (
                      <div>
                        <span className="font-semibold" style={{ color: driver2Color }}>
                          {telemetryData.driver2.driver}:
                        </span>{" "}
                        {telemetryData.driver2.metrics.maxSpeed.toFixed(1)} km/h
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold" style={{ color: driver1Color }}>
                        {telemetryData.driver1.driver}:
                      </span>{" "}
                      {telemetryData.driver1.metrics.avgSpeed.toFixed(1)} km/h
                    </div>
                    {telemetryData.driver2 && (
                      <div>
                        <span className="font-semibold" style={{ color: driver2Color }}>
                          {telemetryData.driver2.driver}:
                        </span>{" "}
                        {telemetryData.driver2.metrics.avgSpeed.toFixed(1)} km/h
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">DRS Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold" style={{ color: driver1Color }}>
                        {telemetryData.driver1.driver}:
                      </span>{" "}
                      {telemetryData.driver1.metrics.drsUsage.toFixed(1)}%
                    </div>
                    {telemetryData.driver2 && (
                      <div>
                        <span className="font-semibold" style={{ color: driver2Color }}>
                          {telemetryData.driver2.driver}:
                        </span>{" "}
                        {telemetryData.driver2.metrics.drsUsage.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tire Compound</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold" style={{ color: driver1Color }}>
                        {telemetryData.driver1.driver}:
                      </span>{" "}
                      <span className="uppercase font-mono text-xs px-2 py-1 bg-primary/10 rounded">
                        {telemetryData.driver1.telemetry.compound || 'UNKNOWN'}
                      </span>
                    </div>
                    {telemetryData.driver2 && (
                      <div>
                        <span className="font-semibold" style={{ color: driver2Color }}>
                          {telemetryData.driver2.driver}:
                        </span>{" "}
                        <span className="uppercase font-mono text-xs px-2 py-1 bg-secondary/10 rounded">
                          {telemetryData.driver2.telemetry.compound || 'UNKNOWN'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Speed Trace Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Speed Trace</CardTitle>
                <CardDescription>Speed (km/h) vs Track Distance (m)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={combinedSpeedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="distance" label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value, name) => [value.toFixed(1) + ' km/h', name]}/>
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey={`${telemetryData.driver1.driver}_speed`} 
                      stroke={driver1Color} 
                      fill={driver1Color}
                      fillOpacity={0.3}
                      name={`${telemetryData.driver1.driver} Speed`}
                    />
                    {telemetryData.driver2 && (
                      <Area 
                        type="monotone" 
                        dataKey={`${telemetryData.driver2.driver}_speed`} 
                        stroke={driver2Color} 
                        fill={driver2Color}
                        fillOpacity={0.3}
                        name={`${telemetryData.driver2.driver} Speed`}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Throttle & Brake Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Throttle & Brake Application</CardTitle>
                <CardDescription>Input percentage vs Track Distance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={combinedThrottleBrakeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="distance" label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Input %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value, name) => [value.toFixed(1) + '%', name]}/>
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={`${telemetryData.driver1.driver}_throttle`} 
                      stroke="#10b981" 
                      dot={false}
                      name={`${telemetryData.driver1.driver} Throttle`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={`${telemetryData.driver1.driver}_brake`} 
                      stroke="#dc2626" 
                      dot={false}
                      name={`${telemetryData.driver1.driver} Brake`}
                    />
                    {telemetryData.driver2 && (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey={`${telemetryData.driver2.driver}_throttle`} 
                          stroke="#34d399" 
                          dot={false}
                          strokeDasharray="5 5"
                          name={`${telemetryData.driver2.driver} Throttle`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={`${telemetryData.driver2.driver}_brake`} 
                          stroke="#f87171" 
                          dot={false}
                          strokeDasharray="5 5"
                          name={`${telemetryData.driver2.driver} Brake`}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gear Usage Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Gear Selection</CardTitle>
                <CardDescription>Gear vs Track Distance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={combinedGearData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="distance" label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[0, 8]} label={{ value: 'Gear', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value, name) => [value, name]}/>
                    <Legend />
                    <Line 
                      type="stepAfter" 
                      dataKey={`${telemetryData.driver1.driver}_gear`} 
                      stroke={driver1Color} 
                      strokeWidth={2}
                      dot={false}
                      name={`${telemetryData.driver1.driver} Gear`}
                    />
                    {telemetryData.driver2 && (
                      <Line 
                        type="stepAfter" 
                        dataKey={`${telemetryData.driver2.driver}_gear`} 
                        stroke={driver2Color} 
                        strokeWidth={2}
                        dot={false}
                        name={`${telemetryData.driver2.driver} Gear`}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sector Times Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sector Times Comparison</CardTitle>
                <CardDescription>Time (seconds) per sector</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    {
                      sector: 'Sector 1',
                      [telemetryData.driver1.driver]: telemetryData.driver1.metrics.sector1,
                      ...(telemetryData.driver2 && {
                        [telemetryData.driver2.driver]: telemetryData.driver2.metrics.sector1,
                      })
                    },
                    {
                      sector: 'Sector 2',
                      [telemetryData.driver1.driver]: telemetryData.driver1.metrics.sector2,
                      ...(telemetryData.driver2 && {
                        [telemetryData.driver2.driver]: telemetryData.driver2.metrics.sector2,
                      })
                    },
                    {
                      sector: 'Sector 3',
                      [telemetryData.driver1.driver]: telemetryData.driver1.metrics.sector3,
                      ...(telemetryData.driver2 && {
                        [telemetryData.driver2.driver]: telemetryData.driver2.metrics.sector3,
                      })
                    },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis label={{ value: 'Time (s)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value, name) => [formatTimeForTooltip(value), name]}/>
                    <Legend />
                    <Bar dataKey={telemetryData.driver1.driver} fill={driver1Color} />
                    {telemetryData.driver2 && (
                      <Bar dataKey={telemetryData.driver2.driver} fill={driver2Color} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Speed Delta Chart (only when comparing two drivers) */}
            {telemetryData.driver2 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Speed Delta Analysis</CardTitle>
                  <CardDescription>
                    Speed advantage/disadvantage between {telemetryData.driver1.driver} and {telemetryData.driver2.driver}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={driver1ChartData.map((d1, idx) => {
                      const d2 = driver2ChartData[idx];
                      const delta = d2 ? d1.speed - d2.speed : 0;
                      return {
                        distance: d1.distance,
                        delta: delta,
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="distance" label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Speed Delta (km/h)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} km/h`, 'Delta']} />
                      <Legend />
                      <defs>
                        <linearGradient id="deltaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="50%" stopColor="#eab308" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="delta" 
                        stroke="#6366f1" 
                        fill="url(#deltaGradient)"
                        fillOpacity={0.6}
                        name={`${telemetryData.driver1.driver} vs ${telemetryData.driver2.driver}`}
                      />
                      <text x="50%" y="20" textAnchor="middle" className="text-sm text-muted-foreground">
                        Positive = {telemetryData.driver1.driver} faster
                      </text>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Cornering Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cornering Performance Index</CardTitle>
                <CardDescription>Estimated cornering force based on speed changes and inputs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={driver1ChartData.map((d1, idx) => {
                    const prevSpeed = idx > 0 ? driver1ChartData[idx - 1].speed : d1.speed;
                    const speedChange = Math.abs(d1.speed - prevSpeed);
                    const corneringIndex = (speedChange * 0.5) + ((100 - d1.throttle) * 0.3) + (d1.brake * 0.2);
                    
                    const d2 = driver2ChartData[idx];
                    const prevSpeed2 = idx > 0 && d2 ? driver2ChartData[idx - 1].speed : (d2?.speed || 0);
                    const speedChange2 = d2 ? Math.abs(d2.speed - prevSpeed2) : 0;
                    const corneringIndex2 = d2 ? (speedChange2 * 0.5) + ((100 - d2.throttle) * 0.3) + (d2.brake * 0.2) : 0;
                    
                    return {
                      distance: d1.distance,
                      [`${telemetryData.driver1.driver}_cornering`]: corneringIndex,
                      ...(d2 && telemetryData.driver2 && {
                        [`${telemetryData.driver2.driver}_cornering`]: corneringIndex2,
                      }),
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="distance" label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Cornering Index', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}`, 'Index']} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey={`${telemetryData.driver1.driver}_cornering`} 
                      stroke={driver1Color} 
                      fill={driver1Color}
                      fillOpacity={0.4}
                      name={`${telemetryData.driver1.driver} Cornering`}
                    />
                    {telemetryData.driver2 && (
                      <Area 
                        type="monotone" 
                        dataKey={`${telemetryData.driver2.driver}_cornering`} 
                        stroke={driver2Color} 
                        fill={driver2Color}
                        fillOpacity={0.4}
                        name={`${telemetryData.driver2.driver} Cornering`}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}